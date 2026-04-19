import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/infrastructure/auth/better-auth.server';

export const { GET, POST } = toNextJsHandler(auth);
