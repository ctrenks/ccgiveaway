import { DefaultSession } from "next-auth";

// Role levels: 0=user, 5=moderator, 9=admin
export const ROLES = {
  USER: 0,
  MODERATOR: 5,
  ADMIN: 9,
} as const;

export type RoleLevel = (typeof ROLES)[keyof typeof ROLES];

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: number;
  }
}
