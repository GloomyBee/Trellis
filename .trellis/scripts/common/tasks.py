"""
Task data access layer.

Single source of truth for loading and iterating task directories.
Replaces scattered task.json parsing across 9+ files.

Provides:
    load_task          — Load a single task by directory path
    iter_active_tasks  — Iterate all non-archived tasks (sorted)
    get_all_statuses   — Get {dir_name: status} map for children progress
"""

from __future__ import annotations

import sys
from collections.abc import Iterator
from pathlib import Path

from .io import describe_json_read_failure, read_json_checked
from .paths import DIR_ARCHIVE, FILE_TASK_JSON
from .types import TaskInfo


def load_task(task_dir: Path) -> TaskInfo | None:
    """Load task from a directory containing task.json.

    Args:
        task_dir: Absolute path to the task directory.

    Returns:
        TaskInfo if task.json exists and is valid, None otherwise.

    A directory without task.json is not a task, so it is skipped silently.
    A task.json that exists but cannot be loaded is different: the task
    disappears from `task.py list` and from every context the iterator feeds.
    Callers stay tolerant, but the skip is announced on stderr so a task
    cannot vanish from the workflow with no diagnostic anywhere.
    """
    task_json = task_dir / FILE_TASK_JSON
    if not task_json.is_file():
        return None

    data, reason = read_json_checked(task_json)
    if data is None:
        problem, hint = describe_json_read_failure(task_json, reason)
        print(f"[WARN] Skipping task '{task_dir.name}': {problem}", file=sys.stderr)
        print(f"       {hint}", file=sys.stderr)
        return None

    return TaskInfo(
        dir_name=task_dir.name,
        directory=task_dir,
        title=data.get("title") or data.get("name") or "unknown",
        status=data.get("status", "unknown"),
        assignee=data.get("assignee", ""),
        priority=data.get("priority", "P2"),
        children=tuple(data.get("children", [])),
        parent=data.get("parent"),
        package=data.get("package"),
        raw=data,
    )


def iter_active_tasks(tasks_dir: Path) -> Iterator[TaskInfo]:
    """Iterate all active (non-archived) tasks, sorted by directory name.

    Skips the "archive" directory and directories without valid task.json.

    Args:
        tasks_dir: Path to the tasks directory.

    Yields:
        TaskInfo for each valid task.
    """
    if not tasks_dir.is_dir():
        return

    for d in sorted(tasks_dir.iterdir()):
        if not d.is_dir() or d.name == "archive":
            continue
        info = load_task(d)
        if info is not None:
            yield info


def get_all_statuses(tasks_dir: Path) -> dict[str, str]:
    """Get actual statuses for active and archived tasks.

    Archived tasks contribute their stored status, never an inferred completion.

    Args:
        tasks_dir: Path to the tasks directory.

    Returns:
        Dict mapping directory names to status strings.
    """
    statuses: dict[str, str] = {}
    archive_dir = tasks_dir / DIR_ARCHIVE
    if archive_dir.is_dir():
        for task_json in sorted(archive_dir.glob("*/*/task.json")):
            task = load_task(task_json.parent)
            if task is not None:
                statuses[task.dir_name] = task.status
    # 活跃任务优先；归档只提供真实状态，不根据目录是否消失推断完成。
    statuses.update({t.dir_name: t.status for t in iter_active_tasks(tasks_dir)})
    return statuses


def children_progress(
    children: tuple[str, ...] | list[str],
    all_statuses: dict[str, str],
) -> str:
    """Format children progress string like " [2/3 done]".

    Args:
        children: List of child directory names.
        all_statuses: Status map from get_all_statuses().

    Returns:
        Formatted string, or "" if no children.
    """
    if not children:
        return ""
    # 缺失或仅行政归档的子任务不能自动算作已完成。
    done = sum(
        1 for c in children
        if all_statuses.get(c) in ("completed", "done")
    )
    return f" [{done}/{len(children)} done]"
