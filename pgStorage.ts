/**
 * PostgreSQL Storage Service
 * Implementa l'interfaccia IStorage per l'uso con PostgreSQL e Drizzle ORM
 */
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { db } from './database';
import * as schema from '../../shared/schema';
import { IStorage } from '../storage';

export class PostgresStorage implements IStorage {
  /**
   * Ottiene un utente tramite il suo ID
   */
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }
  
  /**
   * Ottiene un utente tramite l'email
   */
  async getUserByUsername(email: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }
  
  /**
   * Crea un nuovo utente
   */
  async createUser(user: schema.InsertUser): Promise<schema.User> {
    // Hash della password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    
    // Inserimento dell'utente con la password criptata
    const [newUser] = await db.insert(schema.users)
      .values({
        ...user,
        password: hashedPassword,
      })
      .returning();
    
    return newUser;
  }
  
  /**
   * Ottiene un documento tramite il suo ID
   */
  async getDocument(id: string): Promise<schema.Document | undefined> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return undefined;
    
    const [document] = await db.select().from(schema.documents).where(eq(schema.documents.id, numericId));
    return document;
  }
  
  /**
   * Ottiene tutti i documenti
   */
  async getAllDocuments(): Promise<schema.Document[]> {
    return await db.select().from(schema.documents);
  }
  
  /**
   * Crea un nuovo documento
   */
  async createDocument(doc: schema.InsertDocument): Promise<string> {
    const [newDocument] = await db.insert(schema.documents).values(doc).returning();
    return newDocument.id.toString();
  }
  
  /**
   * Ottiene un codice tramite il suo ID
   */
  async getCode(id: string): Promise<schema.Code | undefined> {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return undefined;
    
    const [code] = await db.select().from(schema.codeSnippets).where(eq(schema.codeSnippets.id, numericId));
    return code;
  }
  
  /**
   * Ottiene tutti i frammenti di codice
   */
  async getAllCodes(): Promise<schema.Code[]> {
    return await db.select().from(schema.codeSnippets);
  }
  
  /**
   * Crea un nuovo frammento di codice
   */
  async createCode(code: schema.InsertCode): Promise<string> {
    const [newCode] = await db.insert(schema.codeSnippets).values(code).returning();
    return newCode.id.toString();
  }
  
  /**
   * Ottiene un progetto tramite il suo ID
   */
  async getProject(id: number): Promise<schema.Project | undefined> {
    const [project] = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    return project;
  }
  
  /**
   * Ottiene tutti i progetti di un utente specifico
   */
  async getProjectsByUserId(userId: number): Promise<schema.Project[]> {
    return await db.select().from(schema.projects).where(eq(schema.projects.userId, userId));
  }
  
  /**
   * Ottiene tutti i progetti
   */
  async getAllProjects(): Promise<schema.Project[]> {
    return await db.select().from(schema.projects);
  }
  
  /**
   * Crea un nuovo progetto
   */
  async createProject(project: schema.InsertProject): Promise<schema.Project> {
    // Aggiungiamo il timestamp updatedAt manualmente
    const [newProject] = await db.insert(schema.projects)
      .values({
        ...project,
        updatedAt: new Date()
      })
      .returning();
    
    return newProject;
  }
  
  /**
   * Aggiorna un progetto esistente
   */
  async updateProject(id: number, project: Partial<schema.InsertProject>): Promise<schema.Project | undefined> {
    const [updatedProject] = await db.update(schema.projects)
      .set({
        ...project,
        updatedAt: new Date()
      })
      .where(eq(schema.projects.id, id))
      .returning();
    
    return updatedProject;
  }
  
  /**
   * Elimina un progetto
   */
  async deleteProject(id: number): Promise<boolean> {
    const result = await db.delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning({ id: schema.projects.id });
    
    return result.length > 0;
  }

  /**
   * Crea un nuovo evento
   */
  async createEvent(event: schema.InsertEvent): Promise<schema.Event> {
    // Assicuriamoci che il tipo dell'evento sia impostato correttamente
    const eventData = {
      ...event,
      // Se il tipo non è definito, impostiamo 'task' come valore di default
      type: event.type || 'task'
    };
    
    const [newEvent] = await db.insert(schema.events)
      .values(eventData)
      .returning();
    
    return newEvent;
  }

  /**
   * Ottiene tutti gli eventi di un utente
   */
  async getUserEvents(userId: number): Promise<schema.Event[]> {
    return await db.select()
      .from(schema.events)
      .where(eq(schema.events.userId, userId))
      .orderBy(schema.events.date);
  }
  
  /**
   * Elimina un evento se appartiene all'utente specificato
   */
  async deleteEvent(eventId: number, userId: number): Promise<boolean> {
    try {
      console.log(`🗑️ Tentativo di eliminazione evento ID: ${eventId} da parte dell'utente ${userId}`);
      
      // Verifichiamo prima che l'evento esista e appartenga all'utente
      const events = await db.select()
        .from(schema.events)
        .where(eq(schema.events.id, eventId));
      
      console.log(`📋 Eventi trovati:`, events);
      
      if (events.length === 0) {
        console.log(`❌ Evento ID: ${eventId} non trovato nel database`);
        return false;
      }
      
      // Elimina l'evento usando drizzle-orm delete
      const result = await db.delete(schema.events)
        .where(
          eq(schema.events.id, eventId)
        )
        .returning();
      
      console.log(`✅ Risultato eliminazione:`, result);
      
      return result.length > 0;
    } catch (error) {
      console.error("❌ Errore eliminazione evento:", error);
      return false;
    }
  }
}