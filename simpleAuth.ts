import { Request, Response, NextFunction } from 'express';

// Temporary authentication system for Google OAuth integration
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// Store authenticated users in memory (for development)
const authenticatedUsers = new Map<string, AuthenticatedUser>();

export const createTestUser = () => {
  const testUser: AuthenticatedUser = {
    id: '2',
    email: 'user@example.com',
    name: 'Test User',
    picture: 'https://via.placeholder.com/40'
  };
  authenticatedUsers.set('test-session', testUser);
  return testUser;
};

export const getAuthenticatedUser = (sessionId: string): AuthenticatedUser | null => {
  return authenticatedUsers.get(sessionId) || null;
};

export const simpleAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // For now, create a test user to bypass Google OAuth issues
  const testUser = createTestUser();
  (req as any).user = testUser;
  next();
};

export const handleSimpleAuth = (req: Request, res: Response) => {
  const testUser = createTestUser();
  res.json(testUser);
};