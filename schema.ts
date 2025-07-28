/**
 * Schema del database per l'applicazione
 * Questo file definisce la struttura delle tabelle nel database PostgreSQL
 */
import { pgTable, serial, text, varchar, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enum per i ruoli utente
export const userRoleEnum = pgEnum('user_role', ['admin', 'user']);

// Enum per i tipi di evento
export const eventTypeEnum = pgEnum('event_type', ['meeting', 'task', 'reminder']);

// Tabella eventi calendario
export const calendarEvents = pgTable('calendar_events', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  time: varchar('time', { length: 5 }), // HH:MM format
  location: varchar('location', { length: 255 }),
  color: varchar('color', { length: 50 }).notNull().default('hsl(var(--primary))'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabella utenti
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella preferenze utente per le impostazioni
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull().unique(),
  // Profilo
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  // Preferenze
  preferredLanguage: varchar('preferred_language', { length: 10 }).notNull().default('it'),
  systemPrompt: text('system_prompt'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabella impostazioni utente (legacy)
export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  // Profilo
  avatarUrl: varchar('avatar_url', { length: 500 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  // Preferenze generali
  language: varchar('language', { length: 10 }).notNull().default('it'),
  theme: varchar('theme', { length: 20 }).notNull().default('light'),
  // Impostazioni AI
  aiModel: varchar('ai_model', { length: 50 }).notNull().default('gpt-4'),
  aiResponseStyle: varchar('ai_response_style', { length: 50 }).notNull().default('conversational'),
  customSystemPrompt: text('custom_system_prompt'),
  // Sicurezza
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 255 }),
  // Notifiche
  emailReminders: boolean('email_reminders').notNull().default(true),
  aiUpdates: boolean('ai_updates').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabella documenti
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  format: varchar('format', { length: 50 }).notNull(),
  userId: serial('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella codice
export const codeSnippets = pgTable('code_snippets', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  language: varchar('language', { length: 50 }).notNull(),
  code: text('code').notNull(),
  userId: serial('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella progetti
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  files: text('files').notNull(), // JSON stringificato con la struttura del progetto
  thumbnail: text('thumbnail'), // URL o base64 della miniatura
  userId: serial('user_id').references(() => users.id),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tabella chat
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull().default('Nuova chat'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella messaggi
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  chatId: serial('chat_id').references(() => chats.id),
  content: text('content').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'user', 'assistant', 'system'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tabella eventi
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  userId: serial('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }).notNull(), // TIMESTAMP WITH TIME ZONE
  type: eventTypeEnum('type').notNull().default('task'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schema per inserimento utenti
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Schema per inserimento documenti
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Schema per inserimento codice
export const insertCodeSchema = createInsertSchema(codeSnippets).omit({ id: true });
export type InsertCode = z.infer<typeof insertCodeSchema>;
export type Code = typeof codeSnippets.$inferSelect;

// Schema per inserimento progetti
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, updatedAt: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Schema per inserimento chat
export const insertChatSchema = createInsertSchema(chats).omit({ id: true });
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

// Schema per inserimento messaggi
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Schema per inserimento eventi
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Tipi per le preferenze utente (nuovo sistema)
export type InsertUserPreferences = typeof userPreferences.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Schema Zod per validazione preferenze
export const insertUserPreferencesSchema = createInsertSchema(userPreferences);
export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial().omit({ id: true, userId: true, createdAt: true });

export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;

// Tipi per le impostazioni utente (legacy)
export type InsertUserSettings = typeof userSettings.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;

// Schema Zod per validazione
export const insertUserSettingsSchema = createInsertSchema(userSettings);
export const updateUserSettingsSchema = insertUserSettingsSchema.partial().omit({ id: true, userId: true, createdAt: true });

export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;