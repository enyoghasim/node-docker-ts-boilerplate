declare global {
  namespace Express {
    interface Session {
      user?: number;
    }
  }
}
