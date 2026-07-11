import { Role } from '@prisma/client';

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface ILoginPayload {
  email: string;
  password: string;
}
