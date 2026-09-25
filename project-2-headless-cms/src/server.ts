import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { createSchema, createYoga } from 'graphql-yoga';
import { env } from './config/env.js';
import { typeDefs } from './modules/graphql/typeDefs.js';
import { resolvers } from './modules/graphql/resolvers.js';
import { buildGraphQLContext } from './modules/graphql/context.js';
import { MediaService } from './modules/media/storage.js';
import { AuthService } from './modules/auth/auth.service.js';
import { Role } from '@prisma/client';

export async function createServer() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development',
  });

  // Enable CORS for all frontends (Next.js, Astro, Remix, Vue, etc.)
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Enable multipart file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  });

  // Ensure uploads directory exists
  MediaService.ensureUploadDir();

  // Serve static uploaded assets
  await app.register(fastifyStatic, {
    root: path.resolve(process.cwd(), env.UPLOAD_DIR),
    prefix: '/uploads/',
  });

  // Build GraphQL Yoga Schema & Server
  const yoga = createYoga<{
    req: any;
    reply: any;
  }>({
    schema: createSchema({
      typeDefs,
      resolvers,
    }),
    context: async ({ req, reply }) => {
      return buildGraphQLContext(req, reply);
    },
    graphiql: {
      title: 'Headless CMS GraphiQL Explorer',
      defaultQuery: /* GraphQL */ `
        query GetContentTypes {
          contentTypes {
            name
            slug
            entryCount
            fields {
              name
              slug
              type
            }
          }
        }
      `,
    },
    graphqlEndpoint: '/graphql',
  });

  // Bind GraphQL Yoga to Fastify route
  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await yoga.handleNodeRequestAndResponse(req, reply, {
        req,
        reply,
      });

      if (response) {
        response.headers.forEach((value, key) => {
          reply.header(key, value);
        });

        reply.status(response.status);
        reply.send(response.body);

        return reply;
      }
    },
  });

  // Dedicated REST file upload endpoint
  app.post('/api/upload', async (req, reply) => {
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const user = AuthService.verifyToken(token);
    if (!user || (user.role !== Role.ADMIN && user.role !== Role.EDITOR)) {
      return reply.status(403).send({ error: 'Forbidden: Requires Admin or Editor role.' });
    }

    const data = await req.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded.' });
    }

    try {
      const asset = await MediaService.saveFile({
        filename: data.filename,
        mimetype: data.mimetype,
        file: data.file,
      });

      return reply.status(201).send({
        success: true,
        asset,
      });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Upload failed' });
    }
  });

  // Health check endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'headless-cms',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });

  return app;
}
