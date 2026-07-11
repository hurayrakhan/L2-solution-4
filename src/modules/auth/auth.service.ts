import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { IRegisterPayload, ILoginPayload } from './auth.interface.js';

const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'rentnest_jwt_secret_token_change_in_production';
  const expires = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign({ id }, secret, { expiresIn: expires });
};

const registerUser = async (payload: IRegisterPayload) => {
  const { name, email, password, role } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

const loginUser = async (payload: ILoginPayload) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new AppError('Invalid email or password', 401);
  }

  if (user.status === 'BANNED') {
    throw new AppError('Your account has been banned', 403);
  }

  const token = signToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

export const AuthService = {
  registerUser,
  loginUser,
  getProfile,
};
