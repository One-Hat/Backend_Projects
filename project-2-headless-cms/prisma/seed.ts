import { PrismaClient, Role, FieldType, RelationCardinality, EntryStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('AdminPass123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cms.local' },
    update: {},
    create: {
      email: 'admin@cms.local',
      password: passwordHash,
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  });
  console.log(`👤 Admin user seeded: ${admin.email} (Password: AdminPass123!)`);

  const editorHash = await bcrypt.hash('EditorPass123!', 10);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@cms.local' },
    update: {},
    create: {
      email: 'editor@cms.local',
      password: editorHash,
      name: 'Content Editor',
      role: Role.EDITOR,
    },
  });
  console.log(`✍️ Editor user seeded: ${editor.email} (Password: EditorPass123!)`);

  // 2. Seed Default Consumer API Key
  const demoApiKey = 'cms_demo_consumer_api_key_777';
  const hashedKey = crypto.createHash('sha256').update(demoApiKey).digest('hex');
  await prisma.apiKey.upsert({
    where: { keyHash: hashedKey },
    update: {},
    create: {
      name: 'Default Frontend Client Key',
      keyHash: hashedKey,
      role: Role.CONSUMER,
    },
  });
  console.log(`🔑 Demo API Key seeded: ${demoApiKey}`);

  // 3. Seed "Author" ContentType
  let authorContentType = await prisma.contentType.findUnique({
    where: { slug: 'author' },
  });

  if (!authorContentType) {
    authorContentType = await prisma.contentType.create({
      data: {
        name: 'Author',
        slug: 'author',
        description: 'Content writers and contributors',
        fields: {
          create: [
            { name: 'Full Name', slug: 'name', type: FieldType.STRING, isRequired: true },
            { name: 'Biography', slug: 'bio', type: FieldType.TEXT },
            { name: 'Social Handle', slug: 'handle', type: FieldType.STRING },
          ],
        },
      },
    });
    console.log(`📄 ContentType created: Author`);
  }

  // 4. Seed "BlogPost" ContentType
  let blogContentType = await prisma.contentType.findUnique({
    where: { slug: 'blog_post' },
  });

  if (!blogContentType) {
    blogContentType = await prisma.contentType.create({
      data: {
        name: 'Blog Post',
        slug: 'blog_post',
        description: 'Articles and editorial blog posts',
        fields: {
          create: [
            { name: 'Title', slug: 'title', type: FieldType.STRING, isRequired: true },
            { name: 'Slug', slug: 'slug', type: FieldType.STRING, isRequired: true, isUnique: true },
            { name: 'Content Body', slug: 'content', type: FieldType.TEXT, isRequired: true },
            { name: 'Estimated Read Time (mins)', slug: 'read_time', type: FieldType.INTEGER },
            {
              name: 'Author',
              slug: 'author',
              type: FieldType.RELATION,
              targetContentTypeId: authorContentType.id,
              relationCardinality: RelationCardinality.ONE_TO_ONE,
            },
            {
              name: 'Cover Image',
              slug: 'cover_image',
              type: FieldType.MEDIA,
            },
          ],
        },
      },
    });
    console.log(`📄 ContentType created: Blog Post`);
  }

  // 5. Seed Author Entry
  const authorEntry = await prisma.entry.create({
    data: {
      contentTypeId: authorContentType.id,
      status: EntryStatus.PUBLISHED,
      data: {
        name: 'Ada Lovelace',
        bio: 'Mathematician and computer science pioneer.',
        handle: '@adalovelace',
      },
      publishedAt: new Date(),
      createdById: admin.id,
    },
  });
  console.log(`📝 Author entry created: Ada Lovelace`);

  // 6. Seed Sample Asset
  const sampleAsset = await prisma.asset.create({
    data: {
      filename: 'sample_cover.png',
      originalName: 'tech_cover.png',
      mimeType: 'image/png',
      size: 10240,
      url: 'http://localhost:4000/uploads/sample_cover.png',
      path: './uploads/sample_cover.png',
      altText: 'Headless CMS Architecture Cover Image',
    },
  });

  // 7. Seed Blog Post Entry with Relation to Author and Asset
  const postEntry = await prisma.entry.create({
    data: {
      contentTypeId: blogContentType.id,
      status: EntryStatus.PUBLISHED,
      data: {
        title: 'Mastering Headless CMS Architecture with GraphQL & TypeScript',
        slug: 'mastering-headless-cms-graphql',
        content:
          'Building a dynamic headless CMS requires decoupling the content storage model from hardcoded database tables...',
        read_time: 5,
      },
      publishedAt: new Date(),
      createdById: admin.id,
      outgoingRelations: {
        create: [
          {
            fieldSlug: 'author',
            targetEntryId: authorEntry.id,
          },
        ],
      },
      assets: {
        create: [
          {
            fieldSlug: 'cover_image',
            assetId: sampleAsset.id,
          },
        ],
      },
    },
  });
  console.log(`📝 Blog entry created: "${postEntry.id}" with relational author and asset!`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
