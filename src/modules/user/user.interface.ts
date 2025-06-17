export interface User {
  userId: bigint;
  email: string | null;
  password: string | null;
  name: string | null;
  biography: string | null;
  role: string | null;
  gender: string | null;
  codeExpired: Date | null;
  codeId: string | null;
}

export type UserWithoutPassword = Omit<User, 'password'>;
