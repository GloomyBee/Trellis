#!/usr/bin/env python3
"""
Package discovery and context output.

Provides:
    get_packages_info           - Get structured package info
    get_packages_section        - Build PACKAGES text section
    get_context_packages_text   - Full packages text output (--mode packages)
    get_context_packages_json   - Full packages JSON output (--mode packages --json)
"""

from __future__ import annotations

from pathlib import Path
import re

from .config import (
    _is_true_config_value,
    get_context_injection_limits,
    get_default_package,
    get_packages,
    get_spec_scope,
)
from .paths import (
    DIR_SPEC,
    DIR_WORKFLOW,
    get_current_task,
    get_repo_root,
)
from .tasks import load_task


# =============================================================================
# Internal Helpers
# =============================================================================

_WORK_TYPES = ("code", "research", "experiments", "plotting", "writing")
_RESEARCH_HISTORY_HEADING = re.compile(
    r"^\s{0,3}#{1,6}\s+(?:\d+[.)]?\s+)?"
    r"(?:(?:(?:research|experiment)\s+)?(?:phase|stage|history|historical)\b|阶段|历史|研究历史)",
    re.IGNORECASE,
)


def _safe_project_path(
    root: Path, value: object, warnings: list[str], *, absolute: bool = False
) -> Path | None:
    """Resolve every read inside the real project, including symlink targets."""
    if not isinstance(value, (str, Path)) or not str(value).strip():
        warnings.append(f"Invalid project path: {value!r}")
        return None
    candidate = Path(value)
    if candidate.is_absolute() and not absolute:
        warnings.append(f"Expected a repository-relative path: {value}")
        return None
    try:
        resolved = (root / candidate).resolve()
        resolved.relative_to(root)
    except (OSError, RuntimeError, ValueError):
        warnings.append(f"Refused path outside the project: {value}")
        return None
    return resolved


def _flat_spec_info(root: Path, package: str | None = None) -> dict:
    """List flat spec entry points without reading their bodies."""
    base = Path(DIR_WORKFLOW) / DIR_SPEC
    if package:
        base /= package
    files = []
    for name in ("index", *_WORK_TYPES):
        relative = base / f"{name}.md"
        candidate = _safe_project_path(root.resolve(), relative, [])
        if candidate and candidate.is_file():
            files.append(relative.as_posix())
    index = (base / "index.md").as_posix()
    return {"specIndex": index if index in files else None, "specFiles": files}

def _scan_spec_layers(spec_dir: Path, package: str | None = None) -> list[str]:
    """Scan spec directory for available layers (subdirectories).

    For monorepo: scans spec/<package>/
    For single-repo: scans spec/
    """
    target = spec_dir / package if package else spec_dir
    if not target.is_dir():
        return []
    return sorted(
        d.name for d in target.iterdir() if d.is_dir() and d.name != "guides"
    )


def _get_active_task_package(repo_root: Path) -> str | None:
    """Get the package field from the active task's task.json."""
    current = get_current_task(repo_root)
    if not current:
        return None
    ct = load_task(repo_root / current)
    return ct.package if ct and ct.package else None


def _resolve_scope_set(
    packages: dict,
    spec_scope,
    task_pkg: str | None,
    default_pkg: str | None,
) -> set | None:
    """Resolve spec_scope to a set of allowed package names, or None for full scan."""
    if not packages:
        return None

    if spec_scope is None:
        return None

    if isinstance(spec_scope, str) and spec_scope == "active_task":
        if task_pkg and task_pkg in packages:
            return {task_pkg}
        if default_pkg and default_pkg in packages:
            return {default_pkg}
        return None

    if isinstance(spec_scope, list):
        valid = {e for e in spec_scope if e in packages}
        if valid:
            return valid
        # All invalid: fallback
        if task_pkg and task_pkg in packages:
            return {task_pkg}
        if default_pkg and default_pkg in packages:
            return {default_pkg}
        return None

    return None


# =============================================================================
# Public Functions
# =============================================================================

def get_packages_info(repo_root: Path) -> list[dict]:
    """Get structured package info for monorepo projects.

    Returns list of dicts with keys: name, path, type, default, specLayers,
    isSubmodule, isGitRepo.
    Returns empty list for single-repo projects.
    """
    packages = get_packages(repo_root)
    if not packages:
        return []

    default_pkg = get_default_package(repo_root)
    spec_dir = repo_root / DIR_WORKFLOW / DIR_SPEC
    result = []

    for pkg_name, pkg_config in packages.items():
        pkg_path = pkg_config.get("path", pkg_name) if isinstance(pkg_config, dict) else str(pkg_config)
        pkg_type = pkg_config.get("type", "local") if isinstance(pkg_config, dict) else "local"
        pkg_git = pkg_config.get("git", False) if isinstance(pkg_config, dict) else False
        layers = _scan_spec_layers(spec_dir, pkg_name)

        result.append({
            "name": pkg_name,
            "path": pkg_path,
            "type": pkg_type,
            "default": pkg_name == default_pkg,
            "specLayers": layers,
            **_flat_spec_info(repo_root, pkg_name),
            "isSubmodule": pkg_type == "submodule",
            "isGitRepo": _is_true_config_value(pkg_git),
        })

    return result


def get_packages_section(repo_root: Path) -> str:
    """Build the PACKAGES section for text output."""
    spec_dir = repo_root / DIR_WORKFLOW / DIR_SPEC
    pkg_info = get_packages_info(repo_root)

    lines: list[str] = []
    lines.append("## PACKAGES")
    flat = _flat_spec_info(repo_root)
    if flat["specIndex"]:
        lines.append(f"Spec index: {flat['specIndex']}")
    if flat["specFiles"]:
        lines.append(f"Spec files: {', '.join(flat['specFiles'])}")

    if not pkg_info:
        lines.append("(single-repo mode)")
        layers = _scan_spec_layers(spec_dir)
        if layers:
            lines.append(f"Spec layers: {', '.join(layers)}")
        return "\n".join(lines)

    default_pkg = get_default_package(repo_root)

    for pkg in pkg_info:
        layers_str = f"  [{', '.join(pkg['specLayers'])}]" if pkg["specLayers"] else ""
        submodule_tag = "  (submodule)" if pkg["isSubmodule"] else ""
        git_repo_tag = "  (git repo)" if pkg["isGitRepo"] else ""
        default_tag = "  *" if pkg["default"] else ""
        lines.append(
            f"- {pkg['name']:<16} {pkg['path']:<20}{layers_str}{submodule_tag}{git_repo_tag}{default_tag}"
        )

    if default_pkg:
        lines.append(f"Default package: {default_pkg}")

    return "\n".join(lines)


def get_context_packages_text(repo_root: Path | None = None) -> str:
    """Get packages context as formatted text (for --mode packages)."""
    if repo_root is None:
        repo_root = get_repo_root()

    pkg_info = get_packages_info(repo_root)
    lines: list[str] = []
    flat = _flat_spec_info(repo_root)
    if flat["specIndex"]:
        lines.append(f"Spec index: {flat['specIndex']}")
    if flat["specFiles"]:
        lines.append(f"Spec files: {', '.join(flat['specFiles'])}")
    if lines:
        lines.append("")

    if not pkg_info:
        spec_dir = repo_root / DIR_WORKFLOW / DIR_SPEC
        lines.append("Single-repo project (no packages configured)")
        lines.append("")
        layers = _scan_spec_layers(spec_dir)
        if layers:
            lines.append(f"Spec layers: {', '.join(layers)}")
        return "\n".join(lines)

    # Resolve scope for annotations
    packages_dict = get_packages(repo_root) or {}
    default_pkg = get_default_package(repo_root)
    spec_scope = get_spec_scope(repo_root)
    task_pkg = _get_active_task_package(repo_root)
    scope_set = _resolve_scope_set(packages_dict, spec_scope, task_pkg, default_pkg)

    lines.append("## PACKAGES")
    lines.append("")
    for pkg in pkg_info:
        default_tag = " (default)" if pkg["default"] else ""
        type_tag = f" [{pkg['type']}]" if pkg["type"] != "local" else ""
        git_tag = " [git repo]" if pkg["isGitRepo"] else ""

        # Scope annotation
        scope_tag = ""
        if scope_set is not None and pkg["name"] not in scope_set:
            scope_tag = " (out of scope)"

        lines.append(f"### {pkg['name']}{default_tag}{type_tag}{git_tag}{scope_tag}")
        lines.append(f"Path: {pkg['path']}")
        if pkg["specFiles"]:
            lines.append(f"Spec files: {', '.join(pkg['specFiles'])}")
        if pkg["specLayers"]:
            lines.append(f"Spec layers: {', '.join(pkg['specLayers'])}")
            for layer in pkg["specLayers"]:
                lines.append(f"  - .trellis/spec/{pkg['name']}/{layer}/index.md")
        else:
            lines.append("Spec: not configured")
        lines.append("")

    # Also show shared guides
    guides_dir = repo_root / DIR_WORKFLOW / DIR_SPEC / "guides"
    if guides_dir.is_dir():
        lines.append("### Shared Guides (always included)")
        lines.append("Path: .trellis/spec/guides/index.md")
        lines.append("")

    return "\n".join(lines)


def get_context_packages_json(repo_root: Path | None = None) -> dict:
    """Get packages context as a dictionary (for --mode packages --json)."""
    if repo_root is None:
        repo_root = get_repo_root()

    pkg_info = get_packages_info(repo_root)

    if not pkg_info:
        spec_dir = repo_root / DIR_WORKFLOW / DIR_SPEC
        layers = _scan_spec_layers(spec_dir)
        return {
            "mode": "single-repo",
            "specLayers": layers,
            **_flat_spec_info(repo_root),
        }

    default_pkg = get_default_package(repo_root)
    spec_scope = get_spec_scope(repo_root)
    task_pkg = _get_active_task_package(repo_root)

    return {
        "mode": "monorepo",
        "packages": pkg_info,
        "defaultPackage": default_pkg,
        "specScope": spec_scope,
        "activeTaskPackage": task_pkg,
        **_flat_spec_info(repo_root),
    }


def get_work_context(
    repo_root: Path | None = None,
    *,
    work_types: list[str] | str | None = None,
    package_path: str | Path | None = None,
    research_record: str | Path | None = None,
    task_dir: str | Path | None = None,
    summary: bool = False,
) -> dict:
    """Read explicitly scoped work context; absent optional files never block work.

    CLI values override task metadata. This function only reads existing files;
    it does not infer a work type from prose or discover unrelated packages.
    """
    root = (repo_root or get_repo_root()).resolve()
    warnings: list[str] = []
    task = None
    task_ref = task_dir if task_dir is not None else get_current_task(root)
    if task_ref:
        task_path = _safe_project_path(root, task_ref, warnings, absolute=True)
        if task_path:
            task_json = _safe_project_path(root, task_path / "task.json", warnings, absolute=True)
            if task_json and task_json.is_file():
                task = load_task(task_path)
            else:
                warnings.append(f"Task metadata unavailable: {task_ref}/task.json")
    meta = task.meta if task and isinstance(task.meta, dict) else {}
    selected = work_types if work_types is not None else meta.get("work_types")
    values = [selected] if isinstance(selected, str) else selected
    types: list[str] = []
    if values is not None and not isinstance(values, (list, tuple)):
        warnings.append("work_types must be a list or comma-separated string.")
        values = []
    for value in values or []:
        for name in str(value).split(","):
            name = name.strip().lower()
            if name in _WORK_TYPES:
                if name not in types:
                    types.append(name)
            elif name:
                warnings.append(f"Unknown work type: {name}; choose from {', '.join(_WORK_TYPES)}.")
    if not types:
        warnings.append("Main agent: choose work types for this task with --work-type; no task is required.")

    packages = get_packages(root) or {}
    chosen_package = package_path if package_path is not None else meta.get("package_path")
    if chosen_package is None and task and isinstance(task.package, str) and task.package in packages:
        chosen_package = packages[task.package].get("path", task.package)
    package = _safe_project_path(root, chosen_package, warnings) if chosen_package is not None else None
    if package and not package.is_dir():
        warnings.append(f"Package directory unavailable: {chosen_package}")
        package = None
    record_ref = research_record if research_record is not None else meta.get("research_record")
    record = _safe_project_path(root, record_ref, warnings) if record_ref is not None else None
    if record and (record.suffix.lower() != ".md" or not record.is_file()):
        warnings.append(f"Research record must be an existing Markdown file: {record_ref}")
        record = None

    limits = get_context_injection_limits(root)
    caps = [limits[key] for key in ("max_artifact_bytes", "max_total_bytes") if limits[key]]
    remaining = min(caps) if caps else None
    files: list[dict] = []
    seen: set[str] = set()

    def add_file(relative: Path, reason: str, *, state: bool = False, optional: bool = False) -> None:
        nonlocal remaining
        path = _safe_project_path(root, relative, warnings)
        if path is None:
            return
        label = relative.as_posix()
        if label in seen:
            return
        seen.add(label)
        if not path.is_file():
            if not optional:
                warnings.append(f"Optional context not found: {label}; continue with relevant existing guidance.")
            return
        content = ""
        truncated = False
        if not summary or state:
            caps = [cap for cap in (limits["max_file_bytes"], remaining) if cap is not None and cap > 0]
            cap = min(caps) if caps else None
            # A zero remaining shared budget means no body, unlike config zero (unlimited).
            if remaining == 0:
                truncated = path.stat().st_size > 0
            else:
                try:
                    with path.open("rb") as stream:
                        data = stream.read(cap + 1) if cap is not None else stream.read()
                    if state:
                        # Never inject stage/history sections on subsequent turns.
                        lines = data.splitlines(keepends=True)
                        for index, line in enumerate(lines):
                            if _RESEARCH_HISTORY_HEADING.match(line.decode("utf-8", errors="ignore")):
                                data = b"".join(lines[:index])
                                break
                    truncated = cap is not None and len(data) > cap
                    content = (data[:cap] if truncated else data).decode("utf-8", errors="ignore")
                except OSError as exc:
                    warnings.append(f"Cannot read {label}: {exc}")
                    return
            if remaining is not None:
                remaining -= len(content.encode("utf-8"))
        files.append({"file": label, "reason": reason, "content": content, "truncated": truncated})
        if truncated:
            warnings.append(f"Context truncated by byte budget: {label}; read the file directly for the rest.")

    base = Path(DIR_WORKFLOW) / DIR_SPEC
    add_file(base / "index.md", "Project spec index", optional=True)
    names = list(types)
    if "research" in types or "experiments" in types:
        names = list(dict.fromkeys([*names, "research", "experiments"]))
    for name in names:
        add_file(base / f"{name}.md", f"Selected {name} guidance")

    # Legacy layer indexes stay available, restricted to the selected package.
    spec_package = None
    if package:
        for name, config in packages.items():
            configured = _safe_project_path(root, config.get("path", name), [])
            if configured == package:
                spec_package = name
                break
    legacy_base = base / spec_package if spec_package else base
    if spec_package:
        add_file(legacy_base / "index.md", "Selected package spec index", optional=True)
        for name in names:
            add_file(legacy_base / f"{name}.md", f"Package {name} guidance", optional=True)
    if spec_package or not packages:
        legacy_dir = _safe_project_path(root, legacy_base, warnings)
        if legacy_dir and legacy_dir.is_dir():
            for layer in sorted(legacy_dir.iterdir()):
                if layer.is_dir() and (layer.name in names or ("code" in types and layer.name in ("backend", "frontend", "unit-test"))):
                    add_file(legacy_base / layer.name / "index.md", f"Legacy {layer.name} layer index", optional=True)
    if package:
        relative_package = package.relative_to(root)
        for entry in (Path("README.md"), Path("docs/index.md")):
            add_file(relative_package / entry, "Selected package entry point", optional=True)
    if record:
        add_file(record.relative_to(root), "Current research state before the first phase/history heading; read this file directly for full history", state=True)

    return {
        "workTypes": types,
        "packagePath": package.relative_to(root).as_posix() if package else None,
        "researchRecord": record.relative_to(root).as_posix() if record else None,
        "files": files,
        "warnings": warnings,
    }


def get_work_context_text(
    repo_root: Path | None = None,
    *,
    work_types: list[str] | str | None = None,
    package_path: str | Path | None = None,
    research_record: str | Path | None = None,
    task_dir: str | Path | None = None,
    summary: bool = False,
) -> str:
    """Format scoped context for the CLI and session/sub-agent hooks."""
    context = get_work_context(
        repo_root, work_types=work_types, package_path=package_path,
        research_record=research_record, task_dir=task_dir, summary=summary,
    )
    lines = ["## WORK CONTEXT", f"Work types: {', '.join(context['workTypes']) or '(choose for this task)'}"]
    if context["packagePath"]:
        lines.append(f"Package: {context['packagePath']}")
    if context["researchRecord"]:
        lines.append(f"Research record: {context['researchRecord']} (read directly for full history)")
    for entry in context["files"]:
        lines.append(f"\n=== {entry['file']} ===\n{entry['reason']}")
        if entry["content"]:
            lines.append(entry["content"])
        if entry["truncated"]:
            lines.append(f"[Trellis: truncated — {entry['file']}; read this file directly for the rest]")
    for warning in context["warnings"]:
        lines.append(f"[!] {warning}")
    return "\n".join(lines)
