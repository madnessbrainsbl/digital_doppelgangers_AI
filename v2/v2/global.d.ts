declare namespace Express {
  interface Request {
    user?: {
      id: number;
      email: string;
      name?: string | null;
      role: string;
    };
  }
}
