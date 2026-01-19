// src/modules/activity-log/utils/activity-message.util.ts
import { ActivityLog } from '../entities/activity-log.entity';
import { IssueActivityAction } from '../../issues/constants/issue-activity-action.enum';

export function buildActivityMessage(activityLog: ActivityLog): string {
  const name =
    activityLog.actor?.displayName ??
    activityLog.actor?.name ??
    '알 수 없음';

  switch (activityLog.action) {
    case IssueActivityAction.CREATED:
      return `${name}이 이슈를 생성했습니다.`;

    case IssueActivityAction.UPDATED:
      return `${name}이 이슈를 수정했습니다.`;

    case IssueActivityAction.DELETED:
      return `${name}이 이슈를 삭제했습니다.`;

    case IssueActivityAction.COMMENTED:
      return `${name}이 댓글을 남겼습니다.`;

    case IssueActivityAction.ASSIGNED:
      return `${name}이 담당자를 변경했습니다.`;

    case IssueActivityAction.STATUS_CHANGED:
      return `${name}이 상태를 변경했습니다.`;

    case IssueActivityAction.PROGRESS_UPDATED:
      return `${name}이 진행률을 변경했습니다.`;

    case IssueActivityAction.SUBTASK_ADDED:
      return `${name}이 하위 업무를 추가했습니다.`;

    case IssueActivityAction.SUBTASK_REMOVED:
      return `${name}이 하위 업무를 제거했습니다.`;

    case 'calendar.moved':
      return `${name}이 일정을 변경했습니다.`;

    default:
      return `${name}이 작업을 수행했습니다.`;
  }
}