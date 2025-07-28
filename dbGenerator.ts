import { Request, Response } from 'express';
import { generateAIResponse } from './utils/aiClient';
import { getLocalizedPrompt, getUserLanguage, PROMPT_TYPES } from './utils/getLocalizedPrompt';
// AI client is now handled by the unified aiClient

export const generateDatabaseSchema = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description || description.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Descrizione del progetto richiesta' 
      });
    }

    const language = getUserLanguage(req);
    const prompt = getLocalizedPrompt(language, PROMPT_TYPES.GENERATE_DB, { description });

    try {
      const schema = await generateAIResponse(prompt);
      return res.status(200).json({ 
        success: true,
        schema,
        usingAI: true
      });
    } catch (error) {
      console.log("🧪 Fallback to simulation due to AI error");
      const simulatedSchema = generateSimulatedSchema(description);
      return res.status(200).json({ 
        success: true,
        schema: simulatedSchema,
        usingSimulation: true
      });
    }

    const reply = completion.choices[0].message?.content;
    
    if (!reply) {
      throw new Error('Nessuna risposta da OpenAI');
    }

    const parsedResponse = JSON.parse(reply);
    
    res.status(200).json({ 
      success: true,
      schema: formatSchemaResponse(parsedResponse),
      usingSimulation: false
    });

  } catch (err: any) {
    console.error('Errore generazione database:', err.message);
    
    // Fallback alla simulazione in caso di errore
    console.log("🧪 Fallback alla simulazione per errore OpenAI");
    const simulatedSchema = generateSimulatedSchema(req.body.description);
    
    res.status(200).json({ 
      success: true,
      schema: simulatedSchema,
      usingSimulation: true,
      note: 'Generato in modalità simulazione a causa di un errore con OpenAI'
    });
  }
};

function generateSimulatedSchema(description: string): string {
  const lowerDescription = description.toLowerCase();
  
  if (lowerDescription.includes('utent') || lowerDescription.includes('user')) {
    return generateUserManagementSchema();
  }
  
  if (lowerDescription.includes('ecommerce') || lowerDescription.includes('negozio') || lowerDescription.includes('prodott')) {
    return generateEcommerceSchema();
  }
  
  if (lowerDescription.includes('blog') || lowerDescription.includes('articol') || lowerDescription.includes('post')) {
    return generateBlogSchema();
  }
  
  if (lowerDescription.includes('evento') || lowerDescription.includes('calendario') || lowerDescription.includes('appuntament')) {
    return generateEventSchema();
  }
  
  // Schema generico
  return generateGenericSchema(description);
}

function generateUserManagementSchema(): string {
  return `---
🗂 **SCHEMA SQL:**
\`\`\`sql
-- Tabella utenti
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella profili utente
CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella sessioni
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per prestazioni
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
\`\`\`

📦 **MODELLO TYPESCRIPT (Drizzle ORM):**
\`\`\`typescript
import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  text,
  date,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    role: varchar('role', { length: 50 }).default('user'),
    isActive: boolean('is_active').default(true),
    emailVerified: boolean('email_verified').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
  })
);

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    phone: varchar('phone', { length: 20 }),
    dateOfBirth: date('date_of_birth'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_user_profiles_user_id').on(table.userId),
  })
);

export const userSessions = pgTable(
  'user_sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    tokenIdx: index('idx_sessions_token').on(table.token),
    userIdx: index('idx_sessions_user_id').on(table.userId),
  })
);

// Relazioni
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles),
  sessions: many(userSessions),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

// Tipi TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
\`\`\`
---`;
}

function generateBlogSchema(): string {
  return `---
🗂 **SCHEMA SQL:**
\`\`\`sql
-- Tabella articoli
CREATE TABLE articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    status VARCHAR(50) DEFAULT 'draft',
    featured_image VARCHAR(500),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella commenti
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    author_name VARCHAR(100),
    author_email VARCHAR(255),
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella tag
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella associazione articoli-tag
CREATE TABLE article_tags (
    article_id INTEGER REFERENCES articles(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- Indici
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_tags_slug ON tags(slug);
\`\`\`

📦 **MODELLO TYPESCRIPT (Drizzle ORM):**
\`\`\`typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const articles = pgTable(
  'articles',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    authorId: integer('author_id').references(() => users.id),
    categoryId: integer('category_id').references(() => categories.id),
    status: varchar('status', { length: 50 }).default('draft'),
    featuredImage: varchar('featured_image', { length: 500 }),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_articles_slug').on(table.slug),
    authorIdx: index('idx_articles_author').on(table.authorId),
    categoryIdx: index('idx_articles_category').on(table.categoryId),
    statusIdx: index('idx_articles_status').on(table.status),
  })
);

export const comments = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    articleId: integer('article_id').references(() => articles.id, { onDelete: 'cascade' }),
    authorName: varchar('author_name', { length: 100 }),
    authorEmail: varchar('author_email', { length: 255 }),
    content: text('content').notNull(),
    isApproved: boolean('is_approved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    articleIdx: index('idx_comments_article').on(table.articleId),
  })
);

export const tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    slugIdx: index('idx_tags_slug').on(table.slug),
  })
);

export const articleTags = pgTable(
  'article_tags',
  {
    articleId: integer('article_id').references(() => articles.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.articleId, table.tagId] }),
  })
);

// Relazioni
export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  articleTags: many(articleTags),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  articleTags: many(articleTags),
}));

export const articleTagsRelations = relations(articleTags, ({ one }) => ({
  article: one(articles, {
    fields: [articleTags.articleId],
    references: [articles.id],
  }),
  tag: one(tags, {
    fields: [articleTags.tagId],
    references: [tags.id],
  }),
}));

// Tipi TypeScript
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
\`\`\`
---`;
}

function generateEventSchema(): string {
  return `---
🗂 **SCHEMA SQL:**
\`\`\`sql
-- Tabella eventi
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location VARCHAR(255),
    organizer_id INTEGER REFERENCES users(id),
    max_participants INTEGER,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella partecipazioni
CREATE TABLE event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'registered',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Tabella promemoria
CREATE TABLE event_reminders (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reminder_time TIMESTAMP NOT NULL,
    message TEXT,
    sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_participants_event ON event_participants(event_id);
CREATE INDEX idx_participants_user ON event_participants(user_id);
CREATE INDEX idx_reminders_time ON event_reminders(reminder_time);
\`\`\`

📦 **MODELLO TYPESCRIPT (Drizzle ORM):**
\`\`\`typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    location: varchar('location', { length: 255 }),
    organizerId: integer('organizer_id').references(() => users.id),
    maxParticipants: integer('max_participants'),
    isPublic: boolean('is_public').default(true),
    status: varchar('status', { length: 50 }).default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    startDateIdx: index('idx_events_start_date').on(table.startDate),
    organizerIdx: index('idx_events_organizer').on(table.organizerId),
    statusIdx: index('idx_events_status').on(table.status),
  })
);

export const eventParticipants = pgTable(
  'event_participants',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).default('registered'),
    registeredAt: timestamp('registered_at').defaultNow(),
  },
  (table) => ({
    eventIdx: index('idx_participants_event').on(table.eventId),
    userIdx: index('idx_participants_user').on(table.userId),
    uniqueParticipant: unique().on(table.eventId, table.userId),
  })
);

export const eventReminders = pgTable(
  'event_reminders',
  {
    id: serial('id').primaryKey(),
    eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
    reminderTime: timestamp('reminder_time').notNull(),
    message: text('message'),
    sent: boolean('sent').default(false),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timeIdx: index('idx_reminders_time').on(table.reminderTime),
  })
);

// Relazioni
export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(users, {
    fields: [events.organizerId],
    references: [users.id],
  }),
  participants: many(eventParticipants),
  reminders: many(eventReminders),
}));

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventParticipants.userId],
    references: [users.id],
  }),
}));

export const eventRemindersRelations = relations(eventReminders, ({ one }) => ({
  event: one(events, {
    fields: [eventReminders.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventReminders.userId],
    references: [users.id],
  }),
}));

// Tipi TypeScript
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type InsertEventParticipant = typeof eventParticipants.$inferInsert;
export type EventReminder = typeof eventReminders.$inferSelect;
export type InsertEventReminder = typeof eventReminders.$inferInsert;
\`\`\`
---`;
}

function generateEcommerceSchema(): string {
  return `---
🗂 **SCHEMA SQL:**
\`\`\`sql
-- Tabella categorie prodotti
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella prodotti
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    sku VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella ordini
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    billing_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella dettagli ordine
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
\`\`\`

📦 **MODELLO TYPESCRIPT (Drizzle ORM):**
\`\`\`typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentId: integer('parent_id').references(() => categories.id),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    stockQuantity: integer('stock_quantity').default(0),
    categoryId: integer('category_id').references(() => categories.id),
    sku: varchar('sku', { length: 100 }).unique(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    categoryIdx: index('idx_products_category').on(table.categoryId),
    skuIdx: index('idx_products_sku').on(table.sku),
  })
);

export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50 }).default('pending'),
    shippingAddress: text('shipping_address'),
    billingAddress: text('billing_address'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_orders_user').on(table.userId),
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').references(() => products.id),
    quantity: integer('quantity').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    orderIdx: index('idx_order_items_order').on(table.orderId),
    productIdx: index('idx_order_items_product').on(table.productId),
  })
);

// Relazioni
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// Tipi TypeScript
export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;
\`\`\`
---`;
}

function generateGenericSchema(description: string): string {
  return `---
🗂 **SCHEMA SQL:**
\`\`\`sql
-- Schema generato per: ${description}

-- Tabella principale entità
CREATE TABLE main_entities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella attributi personalizzati
CREATE TABLE entity_attributes (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER REFERENCES main_entities(id) ON DELETE CASCADE,
    attribute_name VARCHAR(100) NOT NULL,
    attribute_value TEXT,
    attribute_type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici
CREATE INDEX idx_main_entities_status ON main_entities(status);
CREATE INDEX idx_entity_attributes_entity ON entity_attributes(entity_id);
CREATE INDEX idx_entity_attributes_name ON entity_attributes(attribute_name);
\`\`\`

📦 **MODELLO TYPESCRIPT (Drizzle ORM):**
\`\`\`typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const mainEntities = pgTable(
  'main_entities',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).default('active'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    statusIdx: index('idx_main_entities_status').on(table.status),
  })
);

export const entityAttributes = pgTable(
  'entity_attributes',
  {
    id: serial('id').primaryKey(),
    entityId: integer('entity_id').references(() => mainEntities.id, { onDelete: 'cascade' }),
    attributeName: varchar('attribute_name', { length: 100 }).notNull(),
    attributeValue: text('attribute_value'),
    attributeType: varchar('attribute_type', { length: 50 }).default('text'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    entityIdx: index('idx_entity_attributes_entity').on(table.entityId),
    nameIdx: index('idx_entity_attributes_name').on(table.attributeName),
  })
);

// Relazioni
export const mainEntitiesRelations = relations(mainEntities, ({ many }) => ({
  attributes: many(entityAttributes),
}));

export const entityAttributesRelations = relations(entityAttributes, ({ one }) => ({
  entity: one(mainEntities, {
    fields: [entityAttributes.entityId],
    references: [mainEntities.id],
  }),
}));

// Tipi TypeScript
export type MainEntity = typeof mainEntities.$inferSelect;
export type InsertMainEntity = typeof mainEntities.$inferInsert;
export type EntityAttribute = typeof entityAttributes.$inferSelect;
export type InsertEntityAttribute = typeof entityAttributes.$inferInsert;
\`\`\`
---

**Nota:** Schema generico generato per "${description}". Personalizza in base alle tue esigenze specifiche.`;
}

function formatSchemaResponse(parsedResponse: any): string {
  return `---
🗂 **SCHEMA SQL:**
\`\`\`sql
${parsedResponse.sql}
\`\`\`

📦 **MODELLO TYPESCRIPT:**
\`\`\`typescript
${parsedResponse.typescript}
\`\`\`
---`;
}