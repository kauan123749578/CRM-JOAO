export type LoginDto = {
  username: string;
  password: string;
};

export type RegisterDto = {
  username: string;
  email?: string;
  password: string;
  name: string;
  role?: 'admin' | 'employee';
};

export type JwtPayload = {
  userId: string;
  email: string;
  role: string;
};

