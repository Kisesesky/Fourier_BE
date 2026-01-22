// src/modules/utils/snapshot.ts
import { Issue } from "../entities/issue.entity";

export function snapshot(issue: Issue) {
  return {
    ...issue,
    startAt: issue.startAt ? new Date(issue.startAt) : null,
    endAt: issue.endAt ? new Date(issue.endAt) : null,
  };
}