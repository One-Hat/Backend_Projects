import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService, TokenPayload } from '../auth/auth.service.js';
import { createDataLoaders, CMSDataLoaders } from '../../db/dataloaders.js';
import { Role, ApiKey } from '@prisma/client';

export interface GraphQLContext {
  req: FastifyRequest;
  reply: FastifyReply;
  user: TokenPayload | null;
  apiKey: ApiKey | null;
  role: Role | null;
  loaders: CMSDataLoaders;
  requireAuth: () => TokenPayload | ApiKey;
  requireRole: (allowedRoles: Role[]) => void;
}

export async function buildGraphQLContext(req: FastifyRequest, reply: FastifyReply): Promise<GraphQLContext> {
  const loaders = createDataLoaders();

  let user: TokenPayload | null = null;
  let apiKey: ApiKey | null = null;
  let role: Role | null = null;

  // 1. Check Authorization: Bearer <jwt>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    user = AuthService.verifyToken(token);
    if (user) {
      role = user.role;
    }
  }

  // 2. Check x-api-key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (!user && apiKeyHeader && typeof apiKeyHeader === 'string') {
    apiKey = await AuthService.validateApiKey(apiKeyHeader);
    if (apiKey) {
      role = apiKey.role;
    }
  }

  const requireAuth = () => {
    if (!user && !apiKey) {
      throw new Error('Unauthorized: Authentication required.');
    }
    return user || apiKey!;
  };

  const requireRole = (allowedRoles: Role[]) => {
    requireAuth();
    if (!role || !allowedRoles.includes(role)) {
      throw new Error(`Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions.`);
    }
  };

  return {
    req,
    reply,
    user,
    apiKey,
    role,
    loaders,
    requireAuth,
    requireRole,
  };
}
