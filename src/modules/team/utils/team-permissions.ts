import { TeamMember } from '../entities/team-member.entity';
import { TeamRole } from '../constants/team-role.enum';
import { TeamPermission } from '../constants/team-permission.enum';

const ALL_PERMISSIONS: TeamPermission[] = [
  TeamPermission.TEAM_INVITE_MEMBER,
  TeamPermission.TEAM_UPDATE_ROLE,
  TeamPermission.TEAM_SETTINGS_UPDATE,
  TeamPermission.PROJECT_CREATE_DELETE,
  TeamPermission.PROJECT_INVITE_MEMBER,
  TeamPermission.PROJECT_UPDATE_ROLE,
];

export function resolveTeamPermissions(member: TeamMember): Set<TeamPermission> {
  if (member.customRole?.permissions?.length) {
    return new Set(member.customRole.permissions as TeamPermission[]);
  }
  if (member.role === TeamRole.OWNER || member.role === TeamRole.MANAGER) {
    return new Set(ALL_PERMISSIONS);
  }
  return new Set<TeamPermission>();
}

export function hasTeamPermission(member: TeamMember, permission: TeamPermission): boolean {
  return resolveTeamPermissions(member).has(permission);
}
