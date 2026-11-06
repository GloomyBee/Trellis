/* global process, Buffer */
/**
 * Trellis Context Injection Plugin
 *
 * Injects context when Task tool is called with supported subagent types.
 * Uses OpenCode's tool.execute.before hook.
 */

import { existsSync, readdirSync, realpathSync, statSync } from "fs"
import { isAbsolute, join, relative } from "path"
import {
  TrellisContext,
  debugLog,
  readContextInjectionLimits,
  ContextBudget,
  materializeArtifact,
  materializeFile,
} from "../lib/trellis-context.js"
import { loadWorkContext } from "../lib/session-utils.js"

// Supported subagent types
const AGENTS_ALL = ["implement", "check", "research"]

function canonicalContextPath(ctx, file) {
  try {
    const root = realpathSync(ctx.directory)
    const target = realpathSync(isAbsolute(file) ? file : join(ctx.directory, file))
    const rel = relative(root, target)
    if (rel.startsWith("..") || isAbsolute(rel)) return null
    const path = target.replace(/\\/g, "/").replace(/\/$/, "")
    return process.platform === "win32" ? path.toLowerCase() : path
  } catch {
    return null
  }
}

function withWorkNotes(parts, notes, budget) {
  for (const note of notes) {
    const notice = `[Trellis: ${note}]`
    const size = Buffer.byteLength(notice, "utf-8")
    if (budget.hasRoom(size)) {
      budget.add(size)
      parts.push(notice)
    }
  }
  return parts.join("\n\n")
}

function scopedWorkBlocks(ctx, taskDir, budget) {
  const context = loadWorkContext(ctx, null, { summary: false, taskDir: taskDir || "" })
  const parts = []
  const paths = new Set()
  const notes = [...(context?.warnings || [])]
  for (const entry of context?.files || []) {
    if (typeof entry.file !== "string" || typeof entry.content !== "string") continue
    const path = canonicalContextPath(ctx, entry.file)
    if (!path) {
      paths.add(null)
      notes.push(`Cannot resolve selected context ${entry.file}; read relevant guidance directly.`)
      continue
    }
    paths.add(path)
    const content = entry.content + (entry.truncated
      ? `\n[Trellis: truncated — read ${entry.file} directly for the rest]` : "")
    const block = `=== ${entry.file} ===\n${content}`
    const size = Buffer.byteLength(block, "utf-8")
    const output = budget.hasRoom(size) ? block
      : `[Trellis: not inlined (total context limit reached) — ${entry.file}: ${entry.reason || "Work context"}]`
    budget.add(Buffer.byteLength(output, "utf-8"))
    parts.push(output)
  }
  return { parts, paths, notes }
}

// Do not re-inline selected files (especially research history) through JSONL.
function curatedBlocks(ctx, jsonlPath, limits, budget, selectedPaths, notes) {
  const blocks = []
  if (selectedPaths.has(null)) {
    notes.push("Selected context could not be resolved; read manifest references directly.")
    return blocks
  }
  for (const line of (ctx.readFile(jsonlPath) || "").split(/\r?\n/)) {
    if (!line.trim()) continue
    try {
      const entry = JSON.parse(line)
      const file = entry.file || entry.path
      if (typeof file !== "string" || !file) continue
      const normalized = canonicalContextPath(ctx, file)
      if (!normalized) {
        notes.push(`Cannot safely resolve manifest context ${file}; not inlined.`)
        continue
      }
      if (selectedPaths.has(normalized)) continue
      const reason = entry.reason || "-"
      if (entry.type === "directory") {
        if ([...selectedPaths].some(path => path.startsWith(`${normalized}/`))) {
          notes.push(`Read ${file} directly for additional context; selected files are already scoped above.`)
        } else {
          const directory = isAbsolute(file) ? file : join(ctx.directory, file)
          const files = readdirSync(directory)
            .filter(name => name.endsWith(".md") && statSync(join(directory, name)).isFile())
            .sort().slice(0, 20)
          for (const name of files) {
            const child = join(file, name)
            const childPath = canonicalContextPath(ctx, child)
            if (!childPath || selectedPaths.has(childPath)) continue
            const block = materializeFile(ctx.directory, child, reason, limits, budget)
            if (block) blocks.push(block)
          }
        }
      } else {
        const block = materializeFile(ctx.directory, file, reason, limits, budget)
        if (block) blocks.push(block)
      }
    } catch {
      // Ignore malformed optional manifest entries.
    }
  }
  return blocks
}

// Match `Active task: <path>` on the first non-empty line of the dispatch
// prompt. Mirrors the contract in workflow.md's [workflow-state:in_progress]
// breadcrumb so multi-window users can disambiguate which task is targeted.
const ACTIVE_TASK_HINT_RE = /^\s*Active task:\s*(\S+)\s*$/m

function extractActiveTaskHint(prompt) {
  if (typeof prompt !== "string" || !prompt) return null
  const match = prompt.match(ACTIVE_TASK_HINT_RE)
  return match ? match[1].trim() : null
}

/**
 * Get context for implement agent. `taskDir` may be relative
 * (`.trellis/tasks/foo`) or absolute; both are resolved via
 * `ctx.resolveTaskDir`.
 *
 * Read order:
 *   1. Scoped work sources, then optional non-duplicate JSONL references
 *   2. prd.md (requirements)
 *   3. design.md if present (technical design)
 *   4. implement.md if present (execution plan)
 * All blocks share one total budget (issue #441).
 */
function getImplementContext(ctx, taskDir) {
  const limits = readContextInjectionLimits(ctx.directory)
  const budget = new ContextBudget(limits.max_total_bytes)
  const { parts, paths, notes } = scopedWorkBlocks(ctx, taskDir, budget)
  const taskDirFull = taskDir ? ctx.resolveTaskDir(taskDir) : null
  if (!taskDirFull) return withWorkNotes(parts, notes, budget)

  // 1. Read implement.jsonl
  const jsonlPath = join(taskDirFull, "implement.jsonl")
  const blocks = curatedBlocks(ctx, jsonlPath, limits, budget, paths, notes)
  if (blocks.length > 0) {
    parts.push(ctx.buildContextFromEntries(blocks))
  }

  // 2. Requirements document
  const prdBlock = materializeArtifact(
    ctx.directory,
    `${taskDir}/prd.md`,
    `${taskDir}/prd.md (Requirements)`,
    "Requirements document",
    limits,
    budget,
  )
  if (prdBlock) parts.push(prdBlock)

  // 3. Technical design for complex tasks
  const designBlock = materializeArtifact(
    ctx.directory,
    `${taskDir}/design.md`,
    `${taskDir}/design.md (Technical Design)`,
    "Technical design document",
    limits,
    budget,
  )
  if (designBlock) parts.push(designBlock)

  // 4. Execution plan for complex tasks
  const implementPlanBlock = materializeArtifact(
    ctx.directory,
    `${taskDir}/implement.md`,
    `${taskDir}/implement.md (Execution Plan)`,
    "Execution plan document",
    limits,
    budget,
  )
  if (implementPlanBlock) parts.push(implementPlanBlock)

  return withWorkNotes(parts, notes, budget)
}

/**
 * Get context for check agent. `taskDir` may be relative or absolute.
 * Same read order and shared budget as the implement context.
 */
function getCheckContext(ctx, taskDir) {
  const limits = readContextInjectionLimits(ctx.directory)
  const budget = new ContextBudget(limits.max_total_bytes)
  const { parts, paths, notes } = scopedWorkBlocks(ctx, taskDir, budget)
  const taskDirFull = taskDir ? ctx.resolveTaskDir(taskDir) : null
  if (!taskDirFull) return withWorkNotes(parts, notes, budget)

  const jsonlPath = join(taskDirFull, "check.jsonl")
  const blocks = curatedBlocks(ctx, jsonlPath, limits, budget, paths, notes)
  if (blocks.length > 0) {
    parts.push(ctx.buildContextFromEntries(blocks))
  }

  const prdBlock = materializeArtifact(
    ctx.directory,
    `${taskDir}/prd.md`,
    `${taskDir}/prd.md (Requirements)`,
    "Requirements document",
    limits,
    budget,
  )
  if (prdBlock) parts.push(prdBlock)

  const designBlock = materializeArtifact(
    ctx.directory,
    `${taskDir}/design.md`,
    `${taskDir}/design.md (Technical Design)`,
    "Technical design document",
    limits,
    budget,
  )
  if (designBlock) parts.push(designBlock)

  const implementPlanBlock = materializeArtifact(
    ctx.directory,
    `${taskDir}/implement.md`,
    `${taskDir}/implement.md (Execution Plan)`,
    "Execution plan document",
    limits,
    budget,
  )
  if (implementPlanBlock) parts.push(implementPlanBlock)

  return withWorkNotes(parts, notes, budget)
}

/**
 * Get context for finish phase (final check before PR)
 */
function getFinishContext(ctx, taskDir) {
  // Finish reuses check context (same JSONL source)
  return getCheckContext(ctx, taskDir)
}


/**
 * Get context for research agent
 */
function getResearchContext(ctx, taskDir) {
  const limits = readContextInjectionLimits(ctx.directory)
  const budget = new ContextBudget(limits.max_total_bytes)
  const { parts, notes } = scopedWorkBlocks(ctx, taskDir, budget)
  parts.push("Read .trellis/workflow.md and relevant scoped specs/package docs. Search only what the assigned question needs.")
  return withWorkNotes(parts, notes, budget)
}

/**
 * Build enhanced prompt with context
 */
function buildPrompt(agentType, originalPrompt, context, isFinish = false) {
  const names = { implement: "Implement", check: isFinish ? "Finish" : "Check", research: "Research" }
  if (!names[agentType]) return originalPrompt
  return `<!-- trellis-hook-injected -->
# ${names[agentType]} Agent Task

Follow .trellis/workflow.md and the scoped assignment below. There is no fixed
agent pipeline. Read relevant guidance bodies, not just indexes; follow paths
shown as truncated or not inlined when that content matters to the assignment.
${agentType === "research" ? "Research is read-only unless the assignment explicitly grants an output path." : "Use only the verification needed for the changed behavior or scientific claim."}
Do not create Git commits, PRs or new records unless the assignment requests them.

## Your Context

${context}

## Your Task

${originalPrompt}

Report findings or changes, actual checks/results and any unresolved issue.`
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`
}

function powershellQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

function envValue(env, key) {
  const value = env?.[key]
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function shellBasename(value) {
  return value.replace(/\\/g, "/").split("/").pop()?.toLowerCase() || ""
}

function isWindowsPosixShell(env = process.env) {
  if (envValue(env, "MSYSTEM")) return true
  if (envValue(env, "MINGW_PREFIX")) return true
  if (envValue(env, "OPENCODE_GIT_BASH_PATH")) return true

  const ostype = envValue(env, "OSTYPE")?.toLowerCase() || ""
  if (/(msys|mingw|cygwin)/.test(ostype)) return true

  const shell = shellBasename(envValue(env, "SHELL") || "")
  return /^(bash|sh|zsh)(\.exe)?$/.test(shell)
}

function buildTrellisContextPrefix(contextKey, hostPlatform = process.platform, env = process.env) {
  if (hostPlatform === "win32" && !isWindowsPosixShell(env)) {
    return `$env:TRELLIS_CONTEXT_ID = ${powershellQuote(contextKey)}; `
  }

  return `export TRELLIS_CONTEXT_ID=${shellQuote(contextKey)}; `
}

function getBashCommandKey(args) {
  if (!args || typeof args !== "object") return null
  if (typeof args.command === "string") return "command"
  if (typeof args.cmd === "string") return "cmd"
  return null
}

function commandStartsWithTrellisContext(command) {
  const firstCommand = command.trimStart().split(/[;&|]/, 1)[0].trimStart()
  return (
    /^TRELLIS_CONTEXT_ID\s*=/.test(firstCommand) ||
    /^export\s+TRELLIS_CONTEXT_ID\s*=/.test(firstCommand) ||
    /^env\s+(?:(?:-\S+|[A-Za-z_][A-Za-z0-9_]*=\S*)\s+)*TRELLIS_CONTEXT_ID\s*=/.test(firstCommand) ||
    /^\$env:TRELLIS_CONTEXT_ID\s*=/i.test(firstCommand)
  )
}

/**
 * OpenCode exposes no session identity to Bash at all — it sets no session env
 * var in any process. The plugin hook does receive it, so inject it into Bash
 * commands before execution; that prefix is the only channel by which an
 * AI-run `task.py` sees the OpenCode session.
 */
function injectTrellisContextIntoBash(ctx, input, output, hostPlatform, env) {
  const args = output?.args
  const commandKey = getBashCommandKey(args)
  if (!commandKey) return false

  const command = args[commandKey]
  if (!command.trim()) return false
  if (commandStartsWithTrellisContext(command)) return false

  const contextKey = ctx.getContextKey(input)
  if (!contextKey) return false

  args[commandKey] = `${buildTrellisContextPrefix(contextKey, hostPlatform, env)}${command}`
  return true
}

// OpenCode plugin factory: `export default async (input) => hooks`.
// OpenCode 1.2.x iterates every module export and invokes it as a function
// (packages/opencode/src/plugin/index.ts — `for ([_, fn] of Object.entries(mod)) await fn(input)`);
// the previous `{ id, server }` object shape failed with
// `TypeError: fn is not a function` in 1.2.x.
export default async ({ directory, platform: hostPlatform = process.platform, env = process.env }) => {
  const ctx = new TrellisContext(directory)
  debugLog("inject", "Plugin loaded, directory:", directory)

  return {
      "tool.execute.before": async (input, output) => {
        try {
          if (process.env.TRELLIS_HOOKS === "0" || process.env.TRELLIS_DISABLE_HOOKS === "1") {
            return
          }
          debugLog("inject", "tool.execute.before called, tool:", input?.tool)

          const toolName = input?.tool?.toLowerCase()
          if (toolName === "bash") {
            if (injectTrellisContextIntoBash(ctx, input, output, hostPlatform, env)) {
              debugLog("inject", "Injected TRELLIS_CONTEXT_ID into Bash command")
            }
            return
          }

          if (toolName !== "task") {
            return
          }

          const args = output?.args
          if (!args) return

          const rawSubagentType = args.subagent_type
          // Strip "trellis-" prefix added by v0.5.0-beta.5 agent rename migration
          const subagentType = (rawSubagentType || "").replace(/^trellis-/, "")
          const originalPrompt = args.prompt || ""

          debugLog("inject", "Task tool called, subagent_type:", rawSubagentType)

          if (!AGENTS_ALL.includes(subagentType)) {
            debugLog("inject", "Skipping - unsupported subagent_type")
            return
          }

          // Resolve active task in this priority order (only later steps
          // run when earlier ones miss):
          //   1. Exact session runtime context lookup for input.sessionID
          //   2. `Active task: <path>` hint in the dispatch prompt
          //      (explicit per-dispatch override — beats single-session
          //      inference so multi-window users can disambiguate)
          //   3. Single-session fallback — only when exactly 1 session
          //      runtime file exists locally
          let taskDir = null
          let taskSource = null

          const contextKey = ctx.getContextKey(input)
          if (contextKey) {
            const context = ctx.readContext(contextKey)
            const exactRef = ctx.normalizeTaskRef(context?.current_task || "")
            if (exactRef) {
              taskDir = exactRef
              taskSource = `session:${contextKey}`
            }
          }

          if (!taskDir) {
            const hintRef = extractActiveTaskHint(originalPrompt)
            if (hintRef) {
              const hintNormalized = ctx.normalizeTaskRef(hintRef)
              if (hintNormalized) {
                const hintDir = ctx.resolveTaskDir(hintNormalized)
                if (hintDir && existsSync(hintDir)) {
                  taskDir = hintNormalized
                  taskSource = "prompt-hint"
                  debugLog("inject", "Resolved task from Active task: hint:", hintNormalized)
                }
              }
            }
          }

          if (!taskDir) {
            const fallback = ctx._resolveSingleSessionFallback()
            if (fallback?.taskPath) {
              const fallbackDir = ctx.resolveTaskDir(fallback.taskPath)
              if (fallbackDir && existsSync(fallbackDir)) {
                taskDir = fallback.taskPath
                taskSource = fallback.source
                debugLog("inject", "Resolved task via single-session fallback:", taskDir, "source:", taskSource)
              }
            }
          }

          // A task is optional; still reject an explicit stale/unsafe task path.
          if (taskDir) {
            const taskDirFull = ctx.resolveTaskDir(taskDir)
            if (!taskDirFull || !existsSync(taskDirFull)) {
              debugLog("inject", "Skipping - task directory not found")
              return
            }
          }

          // Check for [finish] marker
          const isFinish = originalPrompt.toLowerCase().includes("[finish]")

          // Get context based on agent type
          let context = ""
          switch (subagentType) {
            case "implement":
              context = getImplementContext(ctx, taskDir)
              break
            case "check":
              context = isFinish
                ? getFinishContext(ctx, taskDir)
                : getCheckContext(ctx, taskDir)
              break
            case "research":
              context = getResearchContext(ctx, taskDir)
              break
          }

          if (!context) {
            debugLog("inject", "No context to inject")
            return
          }

          const newPrompt = buildPrompt(subagentType, originalPrompt, context, isFinish)

          // Mutate args in-place — whole-object replacement does NOT work for the task tool
          // because the runtime holds a local reference to the same args object.
          args.prompt = newPrompt

          debugLog("inject", "Injected context for", subagentType, "prompt length:", newPrompt.length)

        } catch (error) {
          debugLog("inject", "Error in tool.execute.before:", error.message, error.stack)
        }
      }
    }
}
