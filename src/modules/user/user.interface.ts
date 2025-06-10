export interface User {
  idUser: bigint;
  email: string | null;
  password: string | null;
  name: string | null;
  biography: string | null;
  role: string | null;
  gender: string | null;
  birthday: Date | null;
  codeExpired: string | null;
  codeId: string | null;
}

export type UserWithoutPassword = Omit<User, 'password'>;
