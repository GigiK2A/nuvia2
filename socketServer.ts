import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

interface CollaborativeSession {
  projectId: string;
  users: Set<string>;
  lastActivity: Date;
}

// Store active collaborative sessions
const activeSessions = new Map<string, CollaborativeSession>();

/**
 * Inizializza il server WebSocket per la collaborazione in tempo reale
 */
export function initializeSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: { 
      origin: '*',
      methods: ['GET', 'POST']
    },
    path: '/socket.io/'
  });

  io.on('connection', (socket) => {
    console.log('✅ Nuovo client connesso:', socket.id);

    // Join progetto collaborativo
    socket.on('join-project', (projectId: string) => {
      if (!projectId) {
        socket.emit('error', { message: 'Project ID richiesto' });
        return;
      }

      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room !== socket.id) {
          socket.leave(room);
        }
      });

      // Join new project room
      const roomName = `project-${projectId}`;
      socket.join(roomName);
      
      // Update session tracking
      if (!activeSessions.has(projectId)) {
        activeSessions.set(projectId, {
          projectId,
          users: new Set(),
          lastActivity: new Date()
        });
      }
      
      const session = activeSessions.get(projectId)!;
      session.users.add(socket.id);
      session.lastActivity = new Date();

      console.log(`📂 Utente ${socket.id} ha joinato project-${projectId}`);
      console.log(`👥 Utenti attivi nel progetto: ${session.users.size}`);

      // Notifica agli altri utenti del progetto
      socket.to(roomName).emit('user-joined', {
        userId: socket.id,
        projectId,
        totalUsers: session.users.size
      });

      // Conferma join al client
      socket.emit('joined-project', {
        projectId,
        roomName,
        totalUsers: session.users.size
      });
    });

    // Aggiornamento codice in tempo reale
    socket.on('code-change', (data: {
      projectId: string;
      filePath: string;
      newContent: string;
      cursorPosition?: number;
      userId?: string;
    }) => {
      const { projectId, filePath, newContent, cursorPosition, userId } = data;

      if (!projectId || !filePath || newContent === undefined) {
        socket.emit('error', { message: 'Dati incompleti per code-change' });
        return;
      }

      const roomName = `project-${projectId}`;
      
      // Update session activity
      const session = activeSessions.get(projectId);
      if (session) {
        session.lastActivity = new Date();
      }

      // Broadcast agli altri utenti del progetto
      socket.to(roomName).emit('code-update', {
        filePath,
        newContent,
        cursorPosition,
        userId: userId || socket.id,
        timestamp: new Date().toISOString()
      });

      console.log(`📝 Code update nel progetto ${projectId}, file: ${filePath}`);
    });

    // Cambio cursore/selezione
    socket.on('cursor-change', (data: {
      projectId: string;
      filePath: string;
      cursorPosition: number;
      selection?: { start: number; end: number };
      userId?: string;
    }) => {
      const { projectId, filePath, cursorPosition, selection, userId } = data;

      const roomName = `project-${projectId}`;
      
      // Broadcast posizione cursore agli altri
      socket.to(roomName).emit('cursor-update', {
        filePath,
        cursorPosition,
        selection,
        userId: userId || socket.id,
        timestamp: new Date().toISOString()
      });
    });

    // Leave progetto
    socket.on('leave-project', (projectId: string) => {
      const roomName = `project-${projectId}`;
      socket.leave(roomName);

      const session = activeSessions.get(projectId);
      if (session) {
        session.users.delete(socket.id);
        
        if (session.users.size === 0) {
          // Rimuovi sessione se non ci sono più utenti
          activeSessions.delete(projectId);
          console.log(`🗑️ Sessione progetto ${projectId} chiusa`);
        } else {
          // Notifica agli altri utenti
          socket.to(roomName).emit('user-left', {
            userId: socket.id,
            projectId,
            totalUsers: session.users.size
          });
        }
      }

      console.log(`📤 Utente ${socket.id} ha lasciato project-${projectId}`);
    });

    // Gestione disconnessione
    socket.on('disconnect', (reason) => {
      console.log(`❌ Client disconnesso: ${socket.id}, motivo: ${reason}`);
      
      // Rimuovi da tutte le sessioni attive
      activeSessions.forEach((session, projectId) => {
        if (session.users.has(socket.id)) {
          session.users.delete(socket.id);
          
          // Notifica agli altri utenti
          socket.to(`project-${projectId}`).emit('user-left', {
            userId: socket.id,
            projectId,
            totalUsers: session.users.size
          });

          // Rimuovi sessione se vuota
          if (session.users.size === 0) {
            activeSessions.delete(projectId);
            console.log(`🗑️ Sessione progetto ${projectId} chiusa per disconnessione`);
          }
        }
      });
    });

    // Ping per mantenere connessione attiva
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Richiesta stato progetto
    socket.on('get-project-status', (projectId: string) => {
      const session = activeSessions.get(projectId);
      socket.emit('project-status', {
        projectId,
        isActive: !!session,
        totalUsers: session?.users.size || 0,
        lastActivity: session?.lastActivity || null
      });
    });
  });

  // Cleanup periodico sessioni inattive (ogni 30 minuti)
  setInterval(() => {
    const now = new Date();
    const timeoutMs = 30 * 60 * 1000; // 30 minuti

    activeSessions.forEach((session, projectId) => {
      if (now.getTime() - session.lastActivity.getTime() > timeoutMs) {
        console.log(`🧹 Pulizia sessione inattiva: progetto ${projectId}`);
        activeSessions.delete(projectId);
      }
    });
  }, 15 * 60 * 1000); // Controlla ogni 15 minuti

  console.log('🟢 WebSocket Server inizializzato per collaborazione in tempo reale');
  
  return io;
}

/**
 * Ottieni statistiche sessioni attive
 */
export function getActiveSessionsStats() {
  const stats = {
    totalSessions: activeSessions.size,
    totalUsers: Array.from(activeSessions.values()).reduce((sum, session) => sum + session.users.size, 0),
    projects: Array.from(activeSessions.entries()).map(([projectId, session]) => ({
      projectId,
      users: session.users.size,
      lastActivity: session.lastActivity
    }))
  };
  
  return stats;
}