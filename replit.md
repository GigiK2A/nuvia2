# Nuvia AI Agent - Replit Configuration

## Overview

This repository contains Nuvia AI Agent, a comprehensive AI-powered personal assistant application designed for engineering professionals. The system combines multiple AI capabilities including chat, document generation, code creation, calendar management, and email reminders. It's built with a full-stack architecture using React frontend and Express backend with PostgreSQL database integration.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Components**: Radix UI and Tailwind CSS for modern, accessible interfaces
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized production builds
- **CSS Framework**: Tailwind CSS with custom design tokens

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **Database ORM**: Drizzle ORM for PostgreSQL interactions
- **Authentication**: JWT-based authentication system
- **File Processing**: Multer for file uploads with support for PDF, DOCX, and text files
- **Real-time Features**: Socket.io for collaborative features

### AI Integration
- **Primary Provider**: Google Gemini AI with fallback to OpenAI
- **Capabilities**: 
  - Contextual chat responses
  - Code generation and editing
  - Document creation
  - Legal document drafting
  - Creative writing assistance
  - Data analysis and research

## Key Components

### 1. AI Chat System
- Multi-provider AI support (Gemini/OpenAI)
- Context-aware responses with memory
- Role-based prompting (document writer, code expert, legal assistant)
- Web search integration for current information

### 2. Code Generation Service
- Language-specific code generation
- Inline code editing capabilities
- Full project scaffolding
- Code quality analysis
- Template system for reusable code patterns

### 3. Document Processing
- PDF and DOCX file upload and analysis
- Text extraction and summarization
- Document generation in multiple formats
- Export capabilities (ZIP, PDF)

### 4. Calendar Management
- Event creation and management
- Timezone-aware scheduling (Europe/Rome)
- Automated email reminders via Gmail
- Natural language event parsing

### 5. User Management
- JWT-based authentication
- User preferences and settings
- Role-based access control
- Session management

## Data Flow

1. **User Authentication**: JWT tokens validate user sessions
2. **AI Requests**: Routed through centralized AI service with provider selection
3. **Data Persistence**: PostgreSQL stores user data, events, and preferences
4. **File Processing**: Uploaded files processed in-memory for security
5. **Real-time Updates**: Socket.io enables collaborative features
6. **Email Notifications**: Automated reminders sent via Gmail SMTP

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL with Drizzle ORM
- **AI Providers**: Google Gemini AI (primary), OpenAI (fallback)
- **Email Service**: Gmail SMTP for automated reminders
- **File Processing**: PDF-parse, Mammoth for document handling

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESBuild**: Production bundling
- **Vite**: Development server and build tool
- **Tailwind CSS**: Utility-first styling

### External Integrations
- **Vercel**: Deployment platform for project hosting
- **Google OAuth**: Authentication provider
- **Web Scraping**: Cheerio for content extraction
- **Cron Jobs**: Node-cron for scheduled tasks

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Development Command**: `npm run dev`

### Production Build
- **Build Process**: Vite frontend build + ESBuild backend bundle
- **Deployment Target**: Autoscale deployment on Replit
- **Start Command**: `npm run start`
- **Environment Variables**: Configured via `.env` file

### Database Setup
- **Schema Management**: Drizzle migrations in `./migrations`
- **Connection**: Neon PostgreSQL with WebSocket support
- **Push Command**: `npm run db:push`

## Changelog

- July 28, 2025: Fixed export functionality with proper ZIP file streaming and HTTP headers
- July 28, 2025: Added comprehensive migration documentation and export system
- July 28, 2025: Implemented automatic internet search for AI chat with source citations
- July 28, 2025: Completed document agent selective text editing functionality
- June 26, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.