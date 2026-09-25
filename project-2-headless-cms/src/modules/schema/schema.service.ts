import { prisma } from '../../db/prisma.js';
import { FieldType, RelationCardinality } from '@prisma/client';

export interface CreateFieldInput {
  name: string;
  slug: string;
  type: FieldType;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  targetContentTypeId?: string;
  relationCardinality?: RelationCardinality;
}

export interface CreateContentTypeInput {
  name: string;
  slug?: string;
  description?: string;
  fields?: CreateFieldInput[];
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

export class SchemaService {
  static async getContentType(idOrSlug: string) {
    return prisma.contentType.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        fields: true,
      },
    });
  }

  static async getContentTypes() {
    return prisma.contentType.findMany({
      include: {
        fields: true,
        _count: {
          select: { entries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createContentType(input: CreateContentTypeInput) {
    const slug = slugify(input.slug || input.name);

    const existing = await prisma.contentType.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new Error(`Content type with slug '${slug}' already exists.`);
    }

    return prisma.contentType.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        fields: input.fields
          ? {
              create: input.fields.map((f) => ({
                name: f.name,
                slug: slugify(f.slug || f.name),
                type: f.type,
                isRequired: f.isRequired ?? false,
                isUnique: f.isUnique ?? false,
                defaultValue: f.defaultValue,
                targetContentTypeId: f.targetContentTypeId,
                relationCardinality: f.relationCardinality,
              })),
            }
          : undefined,
      },
      include: {
        fields: true,
      },
    });
  }

  static async addField(contentTypeIdOrSlug: string, field: CreateFieldInput) {
    const ct = await this.getContentType(contentTypeIdOrSlug);
    if (!ct) {
      throw new Error(`Content type not found: ${contentTypeIdOrSlug}`);
    }

    const fieldSlug = slugify(field.slug || field.name);

    return prisma.fieldDefinition.create({
      data: {
        contentTypeId: ct.id,
        name: field.name,
        slug: fieldSlug,
        type: field.type,
        isRequired: field.isRequired ?? false,
        isUnique: field.isUnique ?? false,
        defaultValue: field.defaultValue,
        targetContentTypeId: field.targetContentTypeId,
        relationCardinality: field.relationCardinality,
      },
    });
  }

  static async deleteContentType(idOrSlug: string) {
    const ct = await this.getContentType(idOrSlug);
    if (!ct) throw new Error(`Content type not found: ${idOrSlug}`);

    return prisma.contentType.delete({
      where: { id: ct.id },
    });
  }
}
