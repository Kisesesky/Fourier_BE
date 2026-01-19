// src/modules/issues/constants/issue-activity-action.enum.ts
export enum IssueActivityAction {
  CREATED = 'issue.created',
  UPDATED = 'issue.updated',
  DELETED = 'issue.deleted',
  COMMENTED = 'issue.commented',
  ASSIGNED = 'issue.assigned',
  STATUS_CHANGED = 'issue.status_changed',
  PROGRESS_UPDATED = 'issue.progress_updated',
  SUBTASK_ADDED = 'issue.subtask_added',
  SUBTASK_REMOVED = 'issue.subtask_removed',
}