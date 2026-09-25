import { prisma } from '../../db/prisma.js';
import { SchemaService } from '../schema/schema.service.js';
import { EntryStatus, FieldType, Prisma } from '@prisma/client';

export interface EntryRelationInput {
  fieldSlug: string;
  targetEntryId: string;
}

export interface EntryAssetInput {
  fieldSlug: string;
  assetId: string;
}

export interface CreateEntryInput {
  contentTypeIdOrSlug: string;
  data: Record<string, any>;
  status?: EntryStatus;
  createdById?: string;
  relations?: EntryRelationInput[];
  assets?: EntryAssetInput[];
}

export interface UpdateEntryInput {
  id: string;
  data?: Record<string, any>;
  status?: EntryStatus;
  relations?: EntryRelationInput[];
  assets?: EntryAssetInput[];
}

export interface EntryFilterInput {
  status?: EntryStatus;
  searchTerm?: string;
}

export interface EntryPaginationInput {
  page?: number;
  limit?: number;
}

export interface EntrySortInput {
  field?: string;
  order?: 'asc' | 'desc';
}

export class ContentService {
  /**
   * Validates dynamic JSON data against the ContentType's field definitions
   */
  static validateFieldData(fieldDefinitions: any[], data: Record<string, any>) {
    for (const field of fieldDefinitions) {
      // Don't validate relation or media fields inside the raw json data
      if (field.type === FieldType.RELATION || field.type === FieldType.MEDIA) {
        continue;
      }

      const val = data[field.slug];

      if (field.isRequired && (val === undefined || val === null || val === '')) {
        throw new Error(`Field '${field.name}' (${field.slug}) is required.`);
      }

      if (val !== undefined && val !== null) {
        switch (field.type) {
          case FieldType.STRING:
          case FieldType.TEXT:
            if (typeof val !== 'string') {
              throw new Error(`Field '${field.slug}' must be a string.`);
            }
            break;
          case FieldType.INTEGER:
            if (!Number.isInteger(val)) {
              throw new Error(`Field '${field.slug}' must be an integer.`);
            }
            break;
          case FieldType.FLOAT:
            if (typeof val !== 'number' || isNaN(val)) {
              throw new Error(`Field '${field.slug}' must be a valid float/number.`);
            }
            break;
          case FieldType.BOOLEAN:
            if (typeof val !== 'boolean') {
              throw new Error(`Field '${field.slug}' must be a boolean.`);
            }
            break;
          case FieldType.DATETIME:
            if (isNaN(Date.parse(val))) {
              throw new Error(`Field '${field.slug}' must be a valid ISO DateTime.`);
            }
            break;
        }
      }
    }
  }

  static async createEntry(input: CreateEntryInput) {
    const contentType = await SchemaService.getContentType(input.contentTypeIdOrSlug);
    if (!contentType) {
      throw new Error(`Content type '${input.contentTypeIdOrSlug}' not found.`);
    }

    // Validate fields
    this.validateFieldData(contentType.fields, input.data);

    const initialStatus = input.status || EntryStatus.DRAFT;
    const publishedAt = initialStatus === EntryStatus.PUBLISHED ? new Date() : null;

    return prisma.$transaction(async (tx) => {
      const entry = await tx.entry.create({
        data: {
          contentTypeId: contentType.id,
          status: initialStatus,
          data: input.data as Prisma.InputJsonValue,
          publishedAt,
          createdById: input.createdById,
        },
      });

      // Handle relations
      if (input.relations && input.relations.length > 0) {
        await tx.entryRelation.createMany({
          data: input.relations.map((r) => ({
            sourceEntryId: entry.id,
            targetEntryId: r.targetEntryId,
            fieldSlug: r.fieldSlug,
          })),
        });
      }

      // Handle assets
      if (input.assets && input.assets.length > 0) {
        await tx.entryAsset.createMany({
          data: input.assets.map((a) => ({
            entryId: entry.id,
            assetId: a.assetId,
            fieldSlug: a.fieldSlug,
          })),
        });
      }

      return tx.entry.findUnique({
        where: { id: entry.id },
        include: {
          contentType: true,
          outgoingRelations: { include: { targetEntry: true } },
          assets: { include: { asset: true } },
          createdBy: true,
        },
      });
    });
  }

  static async updateEntry(input: UpdateEntryInput) {
    const existing = await prisma.entry.findUnique({
      where: { id: input.id },
      include: { contentType: { include: { fields: true } } },
    });

    if (!existing) {
      throw new Error(`Entry with id '${input.id}' not found.`);
    }

    const mergedData = input.data
      ? { ...(existing.data as Record<string, any>), ...input.data }
      : (existing.data as Record<string, any>);

    if (input.data) {
      this.validateFieldData(existing.contentType.fields, mergedData);
    }

    return prisma.$transaction(async (tx) => {
      // If relations specified, replace them
      if (input.relations) {
        await tx.entryRelation.deleteMany({ where: { sourceEntryId: input.id } });
        if (input.relations.length > 0) {
          await tx.entryRelation.createMany({
            data: input.relations.map((r) => ({
              sourceEntryId: input.id,
              targetEntryId: r.targetEntryId,
              fieldSlug: r.fieldSlug,
            })),
          });
        }
      }

      // If assets specified, replace them
      if (input.assets) {
        await tx.entryAsset.deleteMany({ where: { entryId: input.id } });
        if (input.assets.length > 0) {
          await tx.entryAsset.createMany({
            data: input.assets.map((a) => ({
              entryId: input.id,
              assetId: a.assetId,
              fieldSlug: a.fieldSlug,
            })),
          });
        }
      }

      const updatePayload: Prisma.EntryUpdateInput = {
        data: mergedData as Prisma.InputJsonValue,
      };

      if (input.status) {
        updatePayload.status = input.status;
        if (input.status === EntryStatus.PUBLISHED && !existing.publishedAt) {
          updatePayload.publishedAt = new Date();
        }
      }

      return tx.entry.update({
        where: { id: input.id },
        data: updatePayload,
        include: {
          contentType: true,
          outgoingRelations: { include: { targetEntry: true } },
          assets: { include: { asset: true } },
        },
      });
    });
  }

  static async publishEntry(id: string) {
    return prisma.entry.update({
      where: { id },
      data: {
        status: EntryStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  static async unpublishEntry(id: string) {
    return prisma.entry.update({
      where: { id },
      data: {
        status: EntryStatus.DRAFT,
      },
    });
  }

  static async deleteEntry(id: string) {
    return prisma.entry.delete({
      where: { id },
    });
  }

  static async getEntries(
    contentTypeIdOrSlug: string,
    filter?: EntryFilterInput,
    pagination?: EntryPaginationInput,
    sort?: EntrySortInput
  ) {
    const contentType = await SchemaService.getContentType(contentTypeIdOrSlug);
    if (!contentType) {
      throw new Error(`Content type '${contentTypeIdOrSlug}' not found.`);
    }

    const page = Math.max(1, pagination?.page || 1);
    const limit = Math.min(100, Math.max(1, pagination?.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.EntryWhereInput = {
      contentTypeId: contentType.id,
    };

    if (filter?.status) {
      where.status = filter.status;
    }

    const totalCount = await prisma.entry.count({ where });

    const orderBy: Prisma.EntryOrderByWithRelationInput = sort?.field
      ? { [sort.field]: sort.order || 'desc' }
      : { createdAt: 'desc' };

    const items = await prisma.entry.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        contentType: true,
      },
    });

    return {
      items,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page * limit < totalCount,
      hasPrevPage: page > 1,
    };
  }

  static async getEntryById(id: string) {
    return prisma.entry.findUnique({
      where: { id },
      include: {
        contentType: true,
      },
    });
  }
}
