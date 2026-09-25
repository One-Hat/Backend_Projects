export const typeDefs = /* GraphQL */ `
  scalar JSON

  enum Role {
    ADMIN
    EDITOR
    CONSUMER
  }

  enum FieldType {
    STRING
    TEXT
    INTEGER
    FLOAT
    BOOLEAN
    DATETIME
    JSON
    MEDIA
    RELATION
  }

  enum RelationCardinality {
    ONE_TO_ONE
    ONE_TO_MANY
    MANY_TO_MANY
  }

  enum EntryStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type ApiKey {
    id: ID!
    name: String!
    role: Role!
    expiresAt: String
    lastUsedAt: String
    createdAt: String!
  }

  type ApiKeyCreated {
    apiKey: ApiKey!
    plainKey: String!
  }

  type FieldDefinition {
    id: ID!
    name: String!
    slug: String!
    type: FieldType!
    isRequired: Boolean!
    isUnique: Boolean!
    defaultValue: String
    targetContentTypeId: String
    relationCardinality: RelationCardinality
    createdAt: String!
    updatedAt: String!
  }

  type ContentType {
    id: ID!
    name: String!
    slug: String!
    description: String
    fields: [FieldDefinition!]!
    entryCount: Int!
    createdAt: String!
    updatedAt: String!
  }

  type Asset {
    id: ID!
    filename: String!
    originalName: String!
    mimeType: String!
    size: Int!
    url: String!
    altText: String
    createdAt: String!
    updatedAt: String!
  }

  type EntryRelation {
    fieldSlug: String!
    targetEntry: Entry!
  }

  type EntryAsset {
    fieldSlug: String!
    asset: Asset!
  }

  type Entry {
    id: ID!
    contentType: ContentType!
    status: EntryStatus!
    data: JSON!
    publishedAt: String
    createdAt: String!
    updatedAt: String!
    relations: [EntryRelation!]!
    assets: [EntryAsset!]!
    related(field: String!): [Entry!]!
    asset(field: String!): Asset
  }

  type EntryConnection {
    items: [Entry!]!
    totalCount: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPrevPage: Boolean!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    role: Role
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateApiKeyInput {
    name: String!
    role: Role
    expiresAt: String
  }

  input CreateFieldInput {
    name: String!
    slug: String
    type: FieldType!
    isRequired: Boolean
    isUnique: Boolean
    defaultValue: String
    targetContentTypeId: String
    relationCardinality: RelationCardinality
  }

  input CreateContentTypeInput {
    name: String!
    slug: String
    description: String
    fields: [CreateFieldInput!]
  }

  input EntryRelationInput {
    fieldSlug: String!
    targetEntryId: String!
  }

  input EntryAssetInput {
    fieldSlug: String!
    assetId: String!
  }

  input CreateEntryInput {
    contentType: String!
    data: JSON!
    status: EntryStatus
    relations: [EntryRelationInput!]
    assets: [EntryAssetInput!]
  }

  input UpdateEntryInput {
    id: ID!
    data: JSON
    status: EntryStatus
    relations: [EntryRelationInput!]
    assets: [EntryAssetInput!]
  }

  input EntryFilterInput {
    status: EntryStatus
    searchTerm: String
  }

  input EntryPaginationInput {
    page: Int
    limit: Int
  }

  input EntrySortInput {
    field: String
    order: String
  }

  type Query {
    me: User
    contentTypes: [ContentType!]!
    contentType(idOrSlug: String!): ContentType
    entries(
      contentType: String!
      filter: EntryFilterInput
      pagination: EntryPaginationInput
      sort: EntrySortInput
    ): EntryConnection!
    entry(id: ID!): Entry
    assets(limit: Int, skip: Int): [Asset!]!
    apiKeys: [ApiKey!]!
  }

  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createApiKey(input: CreateApiKeyInput!): ApiKeyCreated!
    revokeApiKey(id: ID!): Boolean!

    # Content Type & Schema
    createContentType(input: CreateContentTypeInput!): ContentType!
    addField(contentTypeIdOrSlug: String!, field: CreateFieldInput!): FieldDefinition!
    deleteContentType(idOrSlug: String!): Boolean!

    # Entries
    createEntry(input: CreateEntryInput!): Entry!
    updateEntry(input: UpdateEntryInput!): Entry!
    publishEntry(id: ID!): Entry!
    unpublishEntry(id: ID!): Entry!
    deleteEntry(id: ID!): Boolean!

    # Assets
    deleteAsset(id: ID!): Boolean!
  }
`;
