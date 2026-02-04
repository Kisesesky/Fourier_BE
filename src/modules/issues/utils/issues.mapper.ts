// src/modules/issue/utils/issue.mapper.ts
import { Issue } from '../entities/issue.entity';
import { IssueResponseDto } from '../dto/issue-response.dto';

export function mapIssuesToResponse(issue: Issue): IssueResponseDto {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    progress: issue.progress,
    startAt: issue.startAt,
    endAt: issue.endAt,
    createdAt: issue.createdAt,
    creator: issue.creator
      ? {
          id: issue.creator.id,
          name: issue.creator.name,
          avatarUrl: issue.creator.avatarUrl ?? null,
        }
      : null,
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          name: issue.assignee.displayName ?? issue.assignee.name,
          avatarUrl: issue.assignee.avatarUrl ?? null,
        }
      : null,
    group: issue.group
      ? {
          id: issue.group.id,
          name: issue.group.name,
          color: issue.group.color,
          sortOrder: issue.group.sortOrder,
          createdAt: issue.group.createdAt,
        }
      : null,
    parentId: issue.parentId ?? issue.parent?.id ?? null,
    subtasks: issue.subtasks?.map(mapIssuesToResponse) ?? [],
    comments:
      issue.comments?.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: c.author
          ? {
              id: c.author.id,
              name: c.author.displayName ?? c.author.name,
              avatarUrl: c.author.avatarUrl ?? null,
            }
          : null,
      })) ?? [],
  };
}
