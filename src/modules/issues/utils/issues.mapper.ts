// src/modules/issue/utils/issue.mapper.ts
import { Issue } from '../entities/issue.entity';
import { IssueResponseDto } from '../dto/issue-response.dto';

export function mapIssuesToResponse(issue: Issue): IssueResponseDto {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    progress: issue.progress,
    startAt: issue.startAt,
    endAt: issue.endAt,
    createdAt: issue.createdAt,
    creator: issue.creator
      ? {
          id: issue.creator.id,
          name: issue.creator.name,
        }
      : null,
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          name: issue.assignee.displayName ?? issue.assignee.name,
        }
      : null,
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
            }
          : null,
      })) ?? [],
  };
}