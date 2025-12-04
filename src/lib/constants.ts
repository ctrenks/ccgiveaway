// Role levels for authorization
export const ROLES = {
  USER: 0,
  BANNED: 1,      // Banned from giveaways
  MODERATOR: 5,
  ADMIN: 9,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  0: "User",
  1: "Banned",
  5: "Moderator",
  9: "Admin",
};

export type RoleLevel = (typeof ROLES)[keyof typeof ROLES];
