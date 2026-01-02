# 데이터 모델 (FE 기준)

Issues
- Issue: id, key, title, description?, status, priority, assignee?, reporter?, createdAt, updatedAt
- IssueComment: id, issueId, author, body, createdAt
- IssueActivity: id, issueId, type, text, createdAt
- User: id, name, email, avatarUrl?

Chat
- Channel: id, name, workspaceId, isDM?
- Msg: id, author, authorId, text, ts, channelId, attachments?, parentId?, threadCount?, reactions?, mentions?, seenBy?

Calendar
- CalendarEvent: id, calendarId, title, start, end?, allDay, location?, description?

Docs
- DocMeta: id, title, description?, icon?, color?, folderId, locations, owner, fileSize?, starred?, content?, createdAt, updatedAt, versions?
- DocFolder: id, name, icon?, color?, parentId, createdAt, updatedAt
- DocVersion: id, date, content

Members
- Member: id, name, email, role, title?, avatarUrl?, location?, timezone?, description?, joinedAt, lastActiveAt, isFavorite?, statusMessage?, tags?
- MemberInvite: id, email, role, invitedBy, invitedByName, invitedAt, status, message?, name?, avatarUrl?
- MemberPresence: memberId, status, lastSeenAt
- MemberSummary: total, online, favorites

Worksheet
- Worksheet: id, title, ownerName, updatedAt, status, columns, rows, tags?, description?
- WorksheetColumn: id, title, type, options?, width?
- WorksheetRow: id, cells, assignee?, status?, memo?, updatedAt
