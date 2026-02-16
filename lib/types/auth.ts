/** Shared auth types for API responses and auth context */

export type Role = "admin" | "brand" | "user";

export interface User {
  id: string;
  email: string;
  role: Role;
  brandId?: string;
  firstName?: string;
  lastName?: string;
}
