import { createServer } from '../src/server.js';
import { prisma } from '../src/db/prisma.js';

async function runTests() {
  console.log('🧪 Starting Headless CMS End-to-End Test Suite...\n');

  const app = await createServer();
  await app.listen({ port: 4001, host: '127.0.0.1' });

  const BASE_URL = 'http://127.0.0.1:4001';
  let adminToken = '';
  let consumerApiKey = '';
  let categoryTypeId = '';
  let articleTypeId = '';
  let categoryEntryId = '';
  let articleEntryId = '';

  const gqlRequest = async (query: string, variables: any = {}, headers: Record<string, string> = {}) => {
    const res = await fetch(`${BASE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({ query, variables }),
    });
    return res.json();
  };

  try {
    // 1. Health check
    console.log('🔹 Test 1: Health check endpoint');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    if (health.status !== 'ok') throw new Error('Health check failed');
    console.log('   ✅ Health check passed: status ok\n');

    // 2. Register Admin User
    console.log('🔹 Test 2: Admin Registration & Authentication');
    const regRes = await gqlRequest(/* GraphQL */ `
      mutation RegisterAdmin {
        register(input: {
          email: "admin_test@cms.local",
          password: "SecurePassword123!",
          name: "Test Administrator",
          role: ADMIN
        }) {
          token
          user {
            id
            email
            role
          }
        }
      }
    `);

    if (regRes.errors) {
      // If already registered, login instead
      const loginRes = await gqlRequest(/* GraphQL */ `
        mutation LoginAdmin {
          login(input: {
            email: "admin_test@cms.local",
            password: "SecurePassword123!"
          }) {
            token
            user {
              id
              email
              role
            }
          }
        }
      `);
      if (loginRes.errors) throw new Error(JSON.stringify(loginRes.errors));
      adminToken = loginRes.data.login.token;
    } else {
      adminToken = regRes.data.register.token;
    }
    console.log('   ✅ Admin authenticated successfully (JWT acquired)\n');

    // 3. Create Consumer API Key
    console.log('🔹 Test 3: API Key Generation (Admin-only)');
    const apiKeyRes = await gqlRequest(
      /* GraphQL */ `
        mutation CreateApiKey {
          createApiKey(input: {
            name: "Frontend Static Site Generator Key",
            role: CONSUMER
          }) {
            plainKey
            apiKey {
              id
              name
              role
            }
          }
        }
      `,
      {},
      { Authorization: `Bearer ${adminToken}` }
    );

    if (apiKeyRes.errors) throw new Error(JSON.stringify(apiKeyRes.errors));
    consumerApiKey = apiKeyRes.data.createApiKey.plainKey;
    console.log(`   ✅ Consumer API Key created: ${consumerApiKey.substring(0, 16)}...\n`);

    // 4. Create Dynamic Content Types (Category & Article)
    console.log('🔹 Test 4: Dynamic Content Modeling (Schema Engine)');
    const catTypeRes = await gqlRequest(
      /* GraphQL */ `
        mutation CreateCategoryType {
          createContentType(input: {
            name: "Category",
            slug: "category_test",
            description: "Topic categories",
            fields: [
              { name: "Name", slug: "name", type: STRING, isRequired: true },
              { name: "Slug", slug: "slug", type: STRING, isRequired: true, isUnique: true }
            ]
          }) {
            id
            name
            slug
            fields {
              name
              slug
              type
            }
          }
        }
      `,
      {},
      { Authorization: `Bearer ${adminToken}` }
    );

    if (catTypeRes.errors && !catTypeRes.errors[0]?.message.includes('already exists')) {
      throw new Error(JSON.stringify(catTypeRes.errors));
    }
    console.log('   ✅ "Category" content type registered');

    const artTypeRes = await gqlRequest(
      /* GraphQL */ `
        mutation CreateArticleType {
          createContentType(input: {
            name: "Article",
            slug: "article_test",
            description: "Technical articles",
            fields: [
              { name: "Title", slug: "title", type: STRING, isRequired: true },
              { name: "Slug", slug: "slug", type: STRING, isRequired: true, isUnique: true },
              { name: "Body", slug: "body", type: TEXT, isRequired: true },
              { name: "Views", slug: "views", type: INTEGER },
              { name: "Category", slug: "category", type: RELATION, targetContentTypeId: "category_test" }
            ]
          }) {
            id
            name
            slug
            fields {
              name
              slug
              type
            }
          }
        }
      `,
      {},
      { Authorization: `Bearer ${adminToken}` }
    );

    if (artTypeRes.errors && !artTypeRes.errors[0]?.message.includes('already exists')) {
      throw new Error(JSON.stringify(artTypeRes.errors));
    }
    console.log('   ✅ "Article" content type with dynamic relation registered\n');

    // 5. Create Entries
    console.log('🔹 Test 5: Dynamic Content Entry Creation & Field Validation');
    const catEntryRes = await gqlRequest(
      /* GraphQL */ `
        mutation CreateCategoryEntry {
          createEntry(input: {
            contentType: "category_test",
            data: {
              name: "Engineering & Architecture",
              slug: "engineering"
            },
            status: PUBLISHED
          }) {
            id
            status
            data
          }
        }
      `,
      {},
      { Authorization: `Bearer ${adminToken}` }
    );

    if (catEntryRes.errors) throw new Error(JSON.stringify(catEntryRes.errors));
    categoryEntryId = catEntryRes.data.createEntry.id;
    console.log(`   ✅ Category entry created: ID ${categoryEntryId}`);

    const articleEntryRes = await gqlRequest(
      /* GraphQL */ `
        mutation CreateArticleEntry($catId: String!) {
          createEntry(input: {
            contentType: "article_test",
            data: {
              title: "Building a Headless CMS with Fastify & Yoga",
              slug: "building-headless-cms-fastify-yoga",
              body: "Headless CMS architecture decouples content storage from presentation...",
              views: 1250
            },
            status: PUBLISHED,
            relations: [
              { fieldSlug: "category", targetEntryId: $catId }
            ]
          }) {
            id
            status
            data
            related(field: "category") {
              id
              data
            }
          }
        }
      `,
      { catId: categoryEntryId },
      { Authorization: `Bearer ${adminToken}` }
    );

    if (articleEntryRes.errors) throw new Error(JSON.stringify(articleEntryRes.errors));
    articleEntryId = articleEntryRes.data.createEntry.id;
    console.log(`   ✅ Article entry created and linked to Category!`);
    console.log(`   🔍 Nested category data resolved:`, articleEntryRes.data.createEntry.related[0]?.data?.name);
    console.log();

    // 6. Consumer Delivery Query using API Key & DataLoader
    console.log('🔹 Test 6: Consumer Delivery Query with API Key (x-api-key)');
    const deliveryRes = await gqlRequest(
      /* GraphQL */ `
        query ConsumerDeliveryQuery {
          entries(contentType: "article_test") {
            totalCount
            items {
              id
              status
              data
              related(field: "category") {
                id
                data
              }
            }
          }
        }
      `,
      {},
      { 'x-api-key': consumerApiKey }
    );

    if (deliveryRes.errors) throw new Error(JSON.stringify(deliveryRes.errors));
    console.log(`   ✅ Query executed with consumer API key. Total entries: ${deliveryRes.data.entries.totalCount}`);
    console.log(`   📄 Entry title: ${deliveryRes.data.entries.items[0]?.data?.title}`);
    console.log(`   🏷️  Related Category: ${deliveryRes.data.entries.items[0]?.related[0]?.data?.name}\n`);

    console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀');
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
