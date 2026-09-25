import { GraphQLScalarType, Kind } from 'graphql';
import { prisma } from '../../db/prisma.js';
import { AuthService } from '../auth/auth.service.js';
import { SchemaService } from '../schema/schema.service.js';
import { ContentService } from '../content/content.service.js';
import { MediaService } from '../media/storage.js';
import { GraphQLContext } from './context.js';
import { EntryStatus, Role } from '@prisma/client';

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.INT:
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.OBJECT: {
        const obj: Record<string, any> = {};
        for (const field of ast.fields) {
          obj[field.name.value] = parseLiteralHelper(field.value);
        }
        return obj;
      }
      case Kind.LIST:
        return ast.values.map(parseLiteralHelper);
      case Kind.NULL:
        return null;
      default:
        return null;
    }
  },
});

function parseLiteralHelper(ast: any): any {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return parseFloat(ast.value);
    case Kind.OBJECT: {
      const obj: Record<string, any> = {};
      for (const field of ast.fields) {
        obj[field.name.value] = parseLiteralHelper(field.value);
      }
      return obj;
    }
    case Kind.LIST:
      return ast.values.map(parseLiteralHelper);
    case Kind.NULL:
      return null;
    default:
      return null;
  }
}

export const resolvers = {
  JSON: JSONScalar,

  Query: {
    me: async (_: any, __: any, ctx: GraphQLContext) => {
      ctx.requireAuth();
      if (!ctx.user) return null;
      return prisma.user.findUnique({ where: { id: ctx.user.userId } });
    },

    contentTypes: async () => {
      return SchemaService.getContentTypes();
    },

    contentType: async (_: any, { idOrSlug }: { idOrSlug: string }) => {
      return SchemaService.getContentType(idOrSlug);
    },

    entries: async (
      _: any,
      args: {
        contentType: string;
        filter?: any;
        pagination?: any;
        sort?: any;
      },
      ctx: GraphQLContext
    ) => {
      const filter = { ...(args.filter || {}) };

      // RBAC: Consumer or unauthenticated public clients can ONLY see PUBLISHED entries
      const isPrivileged = ctx.role === Role.ADMIN || ctx.role === Role.EDITOR;
      if (!isPrivileged) {
        filter.status = EntryStatus.PUBLISHED;
      }

      return ContentService.getEntries(args.contentType, filter, args.pagination, args.sort);
    },

    entry: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      const entry = await ContentService.getEntryById(id);
      if (!entry) return null;

      const isPrivileged = ctx.role === Role.ADMIN || ctx.role === Role.EDITOR;
      if (!isPrivileged && entry.status !== EntryStatus.PUBLISHED) {
        throw new Error('Forbidden: Draft content requires Editor or Admin authentication.');
      }

      return entry;
    },

    assets: async (_: any, { limit, skip }: { limit?: number; skip?: number }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      return MediaService.getAssets(limit, skip);
    },

    apiKeys: async (_: any, __: any, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN]);
      return prisma.apiKey.findMany({
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    register: async (
      _: any,
      { input }: { input: { email: string; password: string; name: string; role?: Role } }
    ) => {
      const existing = await prisma.user.findUnique({ where: { email: input.email } });
      if (existing) {
        throw new Error('User with this email already exists.');
      }

      // Check if this is the first user; if so, make them ADMIN
      const count = await prisma.user.count();
      const role = count === 0 ? Role.ADMIN : input.role || Role.EDITOR;

      const passwordHash = await AuthService.hashPassword(input.password);
      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: passwordHash,
          name: input.name,
          role,
        },
      });

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user };
    },

    login: async (_: any, { input }: { input: { email: string; password: string } }) => {
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      if (!user) {
        throw new Error('Invalid email or password.');
      }

      const isValid = await AuthService.comparePassword(input.password, user.password);
      if (!isValid) {
        throw new Error('Invalid email or password.');
      }

      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return { token, user };
    },

    createApiKey: async (
      _: any,
      { input }: { input: { name: string; role?: Role; expiresAt?: string } },
      ctx: GraphQLContext
    ) => {
      ctx.requireRole([Role.ADMIN]);
      const expires = input.expiresAt ? new Date(input.expiresAt) : undefined;
      return AuthService.generateApiKey(input.name, input.role, expires);
    },

    revokeApiKey: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN]);
      await prisma.apiKey.delete({ where: { id } });
      return true;
    },

    createContentType: async (_: any, { input }: { input: any }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN]);
      return SchemaService.createContentType(input);
    },

    addField: async (_: any, { contentTypeIdOrSlug, field }: any, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN]);
      return SchemaService.addField(contentTypeIdOrSlug, field);
    },

    deleteContentType: async (_: any, { idOrSlug }: { idOrSlug: string }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN]);
      await SchemaService.deleteContentType(idOrSlug);
      return true;
    },

    createEntry: async (_: any, { input }: { input: any }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      return ContentService.createEntry({
        contentTypeIdOrSlug: input.contentType,
        data: input.data,
        status: input.status,
        createdById: ctx.user?.userId,
        relations: input.relations,
        assets: input.assets,
      });
    },

    updateEntry: async (_: any, { input }: { input: any }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      return ContentService.updateEntry(input);
    },

    publishEntry: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      return ContentService.publishEntry(id);
    },

    unpublishEntry: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      return ContentService.unpublishEntry(id);
    },

    deleteEntry: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      await ContentService.deleteEntry(id);
      return true;
    },

    deleteAsset: async (_: any, { id }: { id: string }, ctx: GraphQLContext) => {
      ctx.requireRole([Role.ADMIN, Role.EDITOR]);
      await MediaService.deleteAsset(id);
      return true;
    },
  },

  ContentType: {
    entryCount: async (parent: any) => {
      if (parent._count?.entries !== undefined) return parent._count.entries;
      return prisma.entry.count({ where: { contentTypeId: parent.id } });
    },
  },

  Entry: {
    contentType: async (parent: any) => {
      if (parent.contentType) return parent.contentType;
      return prisma.contentType.findUnique({ where: { id: parent.contentTypeId } });
    },

    relations: async (parent: any, _: any, { loaders }: GraphQLContext) => {
      return loaders.relationsBySourceEntryId.load(parent.id);
    },

    assets: async (parent: any, _: any, { loaders }: GraphQLContext) => {
      return loaders.assetsByEntryId.load(parent.id);
    },

    // Resolves nested relation entries by field slug without N+1 query traps
    related: async (parent: any, { field }: { field: string }, { loaders }: GraphQLContext) => {
      const allRelations = await loaders.relationsBySourceEntryId.load(parent.id);
      return allRelations
        .filter((r) => r.fieldSlug === field)
        .map((r) => r.targetEntry);
    },

    // Resolves single asset by field slug without N+1 query traps
    asset: async (parent: any, { field }: { field: string }, { loaders }: GraphQLContext) => {
      const allAssets = await loaders.assetsByEntryId.load(parent.id);
      const match = allAssets.find((a) => a.fieldSlug === field);
      return match ? match.asset : null;
    },
  },
};
