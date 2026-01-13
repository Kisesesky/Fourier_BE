// src/modules/issue/issue.mapper.ts
import { Issue } from './entities/issue.entity';
import { IssueResponseDto } from './dto/issue-response.dto';

export function mapIssueToResponse(issue: Issue): IssueResponseDto {
  return {
    id: issue.id,
    title: issue.title,
    status: issue.status,
    progress: issue.progress,
    startAt: issue.startAt,
    endAt: issue.endAt,
    createdAt: issue.createdAt,
    creator: {
      id: issue.creator.id,
      name: issue.creator.displayName ?? issue.creator.name,
    },
    assignee: issue.assignee
      ? {
          id: issue.assignee.id,
          name: issue.assignee.displayName ?? issue.assignee.name,
        }
      : undefined,
    subtasks: issue.subtasks?.map(mapIssueToResponse) ?? [],
    comments:
      issue.comments?.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        author: {
          id: c.author.id,
          name: c.author.displayName ?? c.author.name,
        },
      })) ?? [],
  };
}