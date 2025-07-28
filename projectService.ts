import prisma from '../prisma';

export interface CreateProjectData {
  name: string;
  type: 'chat' | 'document' | 'code';
  userId?: string;
}

export interface CreateChatMessageData {
  projectId: string;
  role: 'user' | 'ai';
  content: string;
}

export interface CreateDocumentData {
  projectId: string;
  content: string;
  format: 'pdf' | 'word';
}

export interface CreateCodeSnippetData {
  projectId: string;
  filename: string;
  code: string;
  language: string;
}

export class ProjectService {
  // Project operations
  async createProject(data: CreateProjectData) {
    return await prisma.project.create({
      data,
      include: {
        chats: true,
        documents: true,
        codes: true,
      },
    });
  }

  async getProject(id: string) {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        chats: {
          orderBy: { createdAt: 'asc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        codes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getProjectsByType(type: 'chat' | 'document' | 'code', userId?: string) {
    return await prisma.project.findMany({
      where: {
        type,
        ...(userId && { userId }),
      },
      include: {
        chats: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        codes: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteProject(id: string) {
    return await prisma.project.delete({
      where: { id },
    });
  }

  // Chat operations
  async addChatMessage(data: CreateChatMessageData) {
    return await prisma.chatMessage.create({
      data,
    });
  }

  async getChatMessages(projectId: string) {
    return await prisma.chatMessage.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Document operations
  async addDocument(data: CreateDocumentData) {
    return await prisma.document.create({
      data,
    });
  }

  async getDocuments(projectId: string) {
    return await prisma.document.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Code operations
  async addCodeSnippet(data: CreateCodeSnippetData) {
    return await prisma.codeSnippet.create({
      data,
    });
  }

  async getCodeSnippets(projectId: string) {
    return await prisma.codeSnippet.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const projectService = new ProjectService();