// src/modules/utils/snapshot.ts
import { Issue } from "../entities/issue.entity";

export function snapshot(issue: Issue) {
  return {
    title: issue.title,
    status: issue.status,
    progress: issue.progress,
    assigneeId: issue.assignee?.id ?? null,
    startAt: issue.startAt,
    endAt: issue.endAt,
  };
}