// issues/constants/issue-color.map.ts
import { IssueStatus } from './issue-status.enum';

export const ISSUE_STATUS_COLOR: Record<IssueStatus, string> = {
  [IssueStatus.PLANNED]: '#94a3b8',     // gray
  [IssueStatus.IN_PROGRESS]: '#3b82f6', // blue
  [IssueStatus.WARNING]: '#fa0202ff',   // red
  [IssueStatus.DELAYED]: '#f9f900fd',   // yellow
  [IssueStatus.REVIEW]: '#f59e0b',      // amber
  [IssueStatus.DONE]: '#22c55e',        // green
};