import { users, type User, type InsertUser, Document, Code, type InsertDocument, type InsertCode, type Project, type InsertProject, type Event, type InsertEvent, type UserSettings, type UpdateUserSettings, type Chat, type InsertChat, type Message, type InsertMessage } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEmail(id: number, email: string): Promise<void>;
  updateUserPassword(id: number, password: string): Promise<void>;
  verifyPassword(userId: number, password: string): Promise<boolean>;
  
  // User Settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  upsertUserSettings(userId: number, settings: Partial<UpdateUserSettings>): Promise<UserSettings>;
  
  // User Data operations
  getUserMessages(userId: number): Promise<any[]>;
  getUserProjects(userId: number): Promise<Project[]>;
  deleteUserData(userId: number): Promise<void>;
  
  // Document operations
  getDocument(id: string): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<string>;
  
  // Code operations
  getCode(id: string): Promise<Code | undefined>;
  getAllCodes(): Promise<Code[]>;
  createCode(code: InsertCode): Promise<string>;
  
  // Project operations
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject?(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject?(id: number): Promise<boolean>;
  
  // Event operations
  createEvent(event: InsertEvent): Promise<Event>;
  getUserEvents(userId: number): Promise<Event[]>;
  deleteEvent(eventId: number, userId: number): Promise<boolean>;
  
  // Chat operations
  createChat(chat: InsertChat): Promise<Chat>;
  getUserChats(userId: number): Promise<Chat[]>;
  getChat(chatId: number): Promise<Chat | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: number): Promise<Message[]>;
  getRecentUserMessages(userId: number, limit?: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userSettings: Map<number, UserSettings>;
  private documents: Map<string, Document>;
  private codes: Map<string, Code>;
  private projects: Map<number, Project>;
  private events: Map<number, Event>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  
  private userCurrentId: number;
  private docCurrentId: number;
  private codeCurrentId: number;
  private projectCurrentId: number;
  private eventCurrentId: number;
  private chatCurrentId: number;
  private messageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.userSettings = new Map();
    this.documents = new Map();
    this.codes = new Map();
    this.projects = new Map();
    this.events = new Map();
    this.chats = new Map();
    this.messages = new Map();
    
    this.userCurrentId = 1;
    this.docCurrentId = 1;
    this.codeCurrentId = 1;
    this.projectCurrentId = 1;
    this.eventCurrentId = 1;
    this.chatCurrentId = 1;
    this.messageCurrentId = 1;
    
    // Crea utente di default per evitare errori
    const defaultUser: User = {
      id: 1,
      username: "admin",
      email: "admin@nuvia.ai",
      password: "$2b$12$QMlpSL8jaWmq0MqrSU5WWOJGETh0otVwT56NjI7JjQdwbf2kIt0le", // admin123
      role: "admin",
      createdAt: new Date()
    };
    this.users.set(1, defaultUser);
    
    // Progetto di esempio
    const exampleProject: Project = {
      id: this.projectCurrentId++,
      userId: 1,
      name: "Sito Avvocato",
      description: "Un sito web per uno studio legale",
      files: JSON.stringify({
        "index.html": "<!DOCTYPE html><html><head><title>Studio Legale</title></head><body><h1>Benvenuti</h1></body></html>",
        "style.css": "body { font-family: Arial, sans-serif; }",
        "app.js": "console.log('Sito Studio Legale');"
      }),
      thumbnail: null,
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(exampleProject.id, exampleProject);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async verifyPassword(userId: number, password: string): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    // Import bcrypt dynamically to verify password
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, user.password);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    // Assicuriamoci che il ruolo e la data di creazione siano sempre presenti
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "user",
      createdAt: insertUser.createdAt || new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserEmail(id: number, email: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.email = email;
      this.users.set(id, user);
    }
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = password;
      this.users.set(id, user);
    }
  }
  
  // Document operations
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async createDocument(doc: InsertDocument): Promise<string> {
    const id = `doc_${this.docCurrentId++}`;
    const document: Document = { ...doc, id };
    this.documents.set(id, document);
    return id;
  }
  
  // Code operations
  async getCode(id: string): Promise<Code | undefined> {
    return this.codes.get(id);
  }
  
  async getAllCodes(): Promise<Code[]> {
    return Array.from(this.codes.values());
  }
  
  async createCode(code: InsertCode): Promise<string> {
    const id = `code_${this.codeCurrentId++}`;
    const codeEntry: Code = { ...code, id };
    this.codes.set(id, codeEntry);
    return id;
  }
  
  // Project operations
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.userId === userId
    );
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectCurrentId++;
    const newProject: Project = { ...project, id };
    this.projects.set(id, newProject);
    return newProject;
  }

  // Event operations
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.eventCurrentId++;
    // Assicuriamoci che tutti i campi obbligatori siano presenti
    const newEvent: Event = { 
      ...event, 
      id,
      userId: event.userId || 1, // Valore di default se non specificato
      type: event.type || 'task', // Tipo di default
      description: event.description || null, // Descrizione può essere null
      createdAt: event.createdAt || new Date() 
    };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async getUserEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values())
      .filter(event => event.userId === userId)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Ordina per data
  }
  
  /**
   * Elimina un evento se appartiene all'utente specificato
   */
  async deleteEvent(eventId: number, userId: number): Promise<boolean> {
    const event = this.events.get(eventId);
    
    // Verifica che l'evento esista e appartenga all'utente
    if (!event || event.userId !== userId) {
      return false;
    }
    
    // Elimina l'evento
    return this.events.delete(eventId);
  }

  // User Settings methods
  async updateUserEmail(id: number, email: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.email = email;
      this.users.set(id, user);
    }
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = password;
      this.users.set(id, user);
    }
  }

  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    return this.userSettings.get(userId);
  }

  async upsertUserSettings(userId: number, settings: Partial<UpdateUserSettings>): Promise<UserSettings> {
    const existing = this.userSettings.get(userId);
    
    const newSettings: UserSettings = {
      id: existing?.id || Date.now(),
      userId: userId,
      avatarUrl: settings.avatarUrl ?? existing?.avatarUrl ?? null,
      firstName: settings.firstName ?? existing?.firstName ?? null,
      lastName: settings.lastName ?? existing?.lastName ?? null,
      language: settings.language ?? existing?.language ?? 'it',
      theme: settings.theme ?? existing?.theme ?? 'light',
      aiModel: settings.aiModel ?? existing?.aiModel ?? 'gpt-4',
      aiResponseStyle: settings.aiResponseStyle ?? existing?.aiResponseStyle ?? 'conversational',
      customSystemPrompt: settings.customSystemPrompt ?? existing?.customSystemPrompt ?? null,
      twoFactorEnabled: settings.twoFactorEnabled ?? existing?.twoFactorEnabled ?? false,
      twoFactorSecret: settings.twoFactorSecret ?? existing?.twoFactorSecret ?? null,
      emailReminders: settings.emailReminders ?? existing?.emailReminders ?? true,
      aiUpdates: settings.aiUpdates ?? existing?.aiUpdates ?? false,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date()
    };

    this.userSettings.set(userId, newSettings);
    return newSettings;
  }

  async getUserMessages(userId: number): Promise<any[]> {
    // Implementazione semplificata per ora
    return [];
  }

  async deleteUserData(userId: number): Promise<void> {
    // Elimina tutti i dati dell'utente
    this.users.delete(userId);
    this.userSettings.delete(userId);
    
    // Elimina progetti dell'utente
    const userProjects = Array.from(this.projects.entries())
      .filter(([_, project]) => project.userId === userId);
    userProjects.forEach(([id, _]) => this.projects.delete(id));
    
    // Elimina eventi dell'utente
    const userEvents = Array.from(this.events.entries())
      .filter(([_, event]) => event.userId === userId);
    userEvents.forEach(([id, _]) => this.events.delete(id));
    
    // Elimina chat dell'utente
    const userChats = Array.from(this.chats.entries())
      .filter(([_, chat]) => chat.userId === userId);
    userChats.forEach(([id, _]) => this.chats.delete(id));
    
    // Elimina messaggi delle chat dell'utente
    userChats.forEach(([chatId, _]) => {
      const chatMessages = Array.from(this.messages.entries())
        .filter(([_, message]) => message.chatId === chatId);
      chatMessages.forEach(([messageId, _]) => this.messages.delete(messageId));
    });
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    const userProjects = Array.from(this.projects.values())
      .filter(project => project.userId === userId);
    return userProjects;
  }

  // Chat operations
  async createChat(chat: InsertChat): Promise<Chat> {
    const newChat: Chat = {
      id: this.chatCurrentId++,
      userId: chat.userId,
      title: chat.title || 'Nuova chat',
      createdAt: new Date(),
    };
    
    this.chats.set(newChat.id, newChat);
    return newChat;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    const userChats = Array.from(this.chats.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return userChats;
  }

  async getChat(chatId: number): Promise<Chat | undefined> {
    return this.chats.get(chatId);
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.messageCurrentId++,
      chatId: message.chatId,
      content: message.content,
      role: message.role,
      createdAt: new Date(),
    };
    
    this.messages.set(newMessage.id, newMessage);
    return newMessage;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    const chatMessages = Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return chatMessages;
  }

  async getRecentUserMessages(userId: number, limit: number = 10): Promise<Message[]> {
    // Trova tutte le chat dell'utente
    const userChats = Array.from(this.chats.values())
      .filter(chat => chat.userId === userId);
    
    if (userChats.length === 0) return [];
    
    const chatIds = userChats.map(chat => chat.id);
    
    // Trova tutti i messaggi delle chat dell'utente
    const userMessages = Array.from(this.messages.values())
      .filter(message => chatIds.includes(message.chatId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    
    return userMessages;
  }
}

export const storage = new MemStorage();
