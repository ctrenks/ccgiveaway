// Role levels for authorization
export const ROLES = {
  USER: 0,
  MODERATOR: 5,
  ADMIN: 9,
} as const;

export type RoleLevel = (typeof ROLES)[keyof typeof ROLES];

