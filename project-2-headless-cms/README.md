# 🚀 Headless CMS Backend with GraphQL Yoga, Fastify, Prisma & PostgreSQL

A robust, enterprise-grade Headless Content Management System (CMS) backend built with **Node.js, TypeScript, Fastify, GraphQL Yoga, Prisma, and PostgreSQL**.

---

## 🏗️ Architecture & Core Highlights

1. **Dynamic Content Modeling (The Storage Layer)**:
   - Dynamic `ContentType` definitions (`Blog Post`, `Author`, `Product`, `Category`).
   - Dynamic `FieldDefinition` types: `STRING`, `TEXT` (Markdown/HTML), `INTEGER`, `FLOAT`, `BOOLEAN`, `DATETIME`, `JSON`, `MEDIA`, `RELATION`.
   - Dynamic `Entry` records storing agile fields via PostgreSQL `JsonB` with validation against the content type schema before persistence.
   - Dynamic relation graph (`EntryRelation`) and media links (`EntryAsset`).

2. **GraphQL API & High-Performance Delivery (The Delivery Layer)**:
   - Powered by **GraphQL Yoga** and **Fastify**.
   - Built-in **GraphiQL Explorer** playground.
   - **DataLoader Integration**: Prevents N+1 database queries when fetching nested relational content (e.g., retrieving posts and resolving authors/assets in batch queries).

3. **Authentication & RBAC (Security)**:
   - **JWT Authentication** (`Authorization: Bearer <token>`) for interactive admin/editor dashboards.
   - **API Key Management** (`x-api-key: cms_...`) for client apps (e.g. Next.js, Astro, Remix, mobile apps).
   - Roles:
     - `ADMIN`: Full access to schema changes, user management, and API keys.
     - `EDITOR`: Full access to create, edit, draft, and publish content entries & media.
     - `CONSUMER`: Read-only access strictly to `PUBLISHED` content.

4. **Media Management**:
   - File upload endpoint: `POST /api/upload` (multipart).
   - Static asset serving: `GET /uploads/*`.
   - `Asset` metadata model linking uploaded files to dynamic content entries.

5. **Container Ready**:
   - Includes production-ready `Dockerfile` and `docker-compose.yml`.

---

## ⚡ Quick Start

### 1. Start the Database
The project includes a local PostgreSQL 16 instance. To start or stop it:
```powershell
# Start PostgreSQL:
.\scripts\start-db.ps1

# Stop PostgreSQL:
.\scripts\stop-db.ps1
```

### 2. Install Dependencies & Generate Prisma Client
```bash
npm install
npm run prisma:generate
```

### 3. Sync Database Schema & Seed Initial Data
```bash
# Push schema to PostgreSQL
npm run prisma:push

# Seed demo users, content types, and sample entries
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
The server will boot at:
- **Server**: `http://localhost:4000`
- **GraphiQL Explorer**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`
- **Media Upload**: `http://localhost:4000/api/upload`

---

## 🧪 Running Automated Tests

Run the end-to-end integration test suite:
```bash
npm run test:e2e
```
This tests:
- Server health check
- User registration & JWT generation
- API key creation with role-based scoping
- Dynamic schema definition (`Category` and `Article` types)
- Dynamic entry creation with field validation
- Nested relation resolution via DataLoader
- Consumer client delivery queries using `x-api-key`

---

## 🔑 Default Seeded Credentials

- **Admin User**:
  - Email: `admin@cms.local`
  - Password: `AdminPass123!`
  - Role: `ADMIN`
- **Editor User**:
  - Email: `editor@cms.local`
  - Password: `EditorPass123!`
  - Role: `EDITOR`
- **Frontend Consumer API Key**:
  - Key: `cms_demo_consumer_api_key_777`
  - Role: `CONSUMER` (Read-only access to published content)

---

## 📜 Example GraphQL Queries & Mutations

### 1. Authenticate (Admin / Editor)
```graphql
mutation Login {
  login(input: { email: "admin@cms.local", password: "AdminPass123!" }) {
    token
    user {
      id
      email
      role
    }
  }
}
```

### 2. Fetch Published Entries with Nested Relations (Consumer Client)
Include header: `x-api-key: cms_demo_consumer_api_key_777`
```graphql
query GetBlogPosts {
  entries(contentType: "blog_post") {
    totalCount
    items {
      id
      status
      data
      related(field: "author") {
        id
        data
      }
      asset(field: "cover_image") {
        url
        altText
      }
    }
  }
}
```

### 3. Create a Dynamic Content Type (Admin)
Include header: `Authorization: Bearer <your-admin-token>`
```graphql
mutation CreateProductType {
  createContentType(input: {
    name: "Product",
    slug: "product",
    description: "E-commerce product catalog",
    fields: [
      { name: "Title", slug: "title", type: STRING, isRequired: true },
      { name: "Price", slug: "price", type: FLOAT, isRequired: true },
      { name: "Description", slug: "description", type: TEXT },
      { name: "In Stock", slug: "in_stock", type: BOOLEAN }
    ]
  }) {
    id
    name
    slug
    fields {
      slug
      type
    }
  }
}
```

### 4. Create and Publish an Entry (Editor/Admin)
```graphql
mutation CreateProductEntry {
  createEntry(input: {
    contentType: "product",
    data: {
      title: "Ergonomic Mechanical Keyboard",
      price: 149.99,
      description: "Custom split mechanical keyboard with wireless connectivity.",
      in_stock: true
    },
    status: PUBLISHED
  }) {
    id
    status
    data
    publishedAt
  }
}
```

---

## 🐳 Docker Deployment

To run the entire system (PostgreSQL + CMS backend) using Docker Compose:
```bash
docker compose up -d
```
