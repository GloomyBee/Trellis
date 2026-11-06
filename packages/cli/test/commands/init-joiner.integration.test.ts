/**
 * Native init and reinit leave task creation to explicit user actions.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

vi.mock("figlet", () => ({
  default: { textSync: vi.fn(() => "TRELLIS") },
}));

vi.mock("inquirer", () => ({
  default: { prompt: vi.fn().mockResolvedValue({}) },
}));

vi.mock("node:child_process", () => ({
  execSync: vi.fn().mockImplementation((cmd: string) => {
    const py = process.platform === "win32" ? "python" : "python3";
    return cmd === `${py} --version` ? "Python 3.11.12" : "";
  }),
}));

import { init } from "../../src/commands/init.js";
import { DIR_NAMES, PATHS } from "../../src/constants/paths.js";

describe("init() without automatic onboarding", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "trellis-joiner-int-"));
    vi.spyOn(process, "cwd").mockReturnValue(tmpDir);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it.each([
    { checkout: false, force: false, skipExisting: false },
    { checkout: true, force: false, skipExisting: false },
    { checkout: true, force: true, skipExisting: false },
    { checkout: true, force: false, skipExisting: true },
  ])("creates no task or journal: %j", async ({ checkout, ...options }) => {
    const tasksDir = path.join(tmpDir, PATHS.TASKS);
    if (checkout) fs.mkdirSync(tasksDir, { recursive: true });

    await init({ yes: true, user: "alice", ...options });

    expect(fs.readdirSync(tasksDir)).toEqual([]);
    expect(fs.existsSync(path.join(tmpDir, PATHS.WORKSPACE))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, PATHS.SPEC))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, ".gitattributes"))).toBe(false);
    expect(fs.readFileSync(path.join(tmpDir, PATHS.DEVELOPER_FILE), "utf-8"))
      .toContain("name=alice\n");
  });

  it("preserves existing identity, specs, journals and attributes on force reinit", async () => {
    const files = new Map([
      [PATHS.DEVELOPER_FILE, "name=original\n"],
      [`${PATHS.SPEC}/research.md`, "# Research\n"],
      [`${PATHS.WORKSPACE}/original/journal-1.md`, "# Existing journal\n"],
      [".gitattributes", "*.dat binary\n"],
    ]);
    for (const [relativePath, content] of files) {
      const target = path.join(tmpDir, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }

    await init({ yes: true, user: "alice", force: true });

    for (const [relativePath, content] of files) {
      expect(fs.readFileSync(path.join(tmpDir, relativePath), "utf-8")).toBe(content);
    }
    expect(fs.readdirSync(path.join(tmpDir, DIR_NAMES.WORKFLOW, DIR_NAMES.TASKS)))
      .toEqual([]);
  });
});
