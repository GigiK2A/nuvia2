import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  projectId?: string;
  autoConnect?: boolean;
}

interface SocketState {
  connected: boolean;
  projectId: string | null;
  totalUsers: number;
  error: string | null;
}

/**
 * Hook per gestire la connessione WebSocket per la collaborazione in tempo reale
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { projectId, autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    projectId: null,
    totalUsers: 0,
    error: null
  });

  const connect = () => {
    if (socketRef.current?.connected) {
      return;
    }

    // Crea connessione WebSocket
    const socket = io(window.location.origin, {
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('✅ WebSocket connesso:', socket.id);
      setState(prev => ({ ...prev, connected: true, error: null }));
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnesso:', reason);
      setState(prev => ({ ...prev, connected: false }));
    });

    socket.on('error', (error) => {
      console.error('🔴 Errore WebSocket:', error);
      setState(prev => ({ ...prev, error: error.message }));
    });

    // Project collaboration events
    socket.on('joined-project', (data) => {
      console.log('📂 Entrato nel progetto:', data);
      setState(prev => ({ 
        ...prev, 
        projectId: data.projectId,
        totalUsers: data.totalUsers 
      }));
    });

    socket.on('user-joined', (data) => {
      console.log('👥 Nuovo utente nel progetto:', data);
      setState(prev => ({ ...prev, totalUsers: data.totalUsers }));
    });

    socket.on('user-left', (data) => {
      console.log('👋 Utente ha lasciato il progetto:', data);
      setState(prev => ({ ...prev, totalUsers: data.totalUsers }));
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState({
        connected: false,
        projectId: null,
        totalUsers: 0,
        error: null
      });
    }
  };

  const joinProject = (projectId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket non connesso, impossibile joinare progetto');
      return;
    }

    socketRef.current.emit('join-project', projectId);
  };

  const leaveProject = () => {
    if (!socketRef.current?.connected || !state.projectId) {
      return;
    }

    socketRef.current.emit('leave-project', state.projectId);
    setState(prev => ({ ...prev, projectId: null, totalUsers: 0 }));
  };

  const sendCodeChange = (filePath: string, newContent: string, cursorPosition?: number) => {
    if (!socketRef.current?.connected || !state.projectId) {
      console.warn('Non connesso o progetto non attivo');
      return;
    }

    socketRef.current.emit('code-change', {
      projectId: state.projectId,
      filePath,
      newContent,
      cursorPosition,
      userId: socketRef.current.id
    });
  };

  const sendCursorChange = (filePath: string, cursorPosition: number, selection?: { start: number; end: number }) => {
    if (!socketRef.current?.connected || !state.projectId) {
      return;
    }

    socketRef.current.emit('cursor-change', {
      projectId: state.projectId,
      filePath,
      cursorPosition,
      selection,
      userId: socketRef.current.id
    });
  };

  const onCodeUpdate = (callback: (data: {
    filePath: string;
    newContent: string;
    cursorPosition?: number;
    userId: string;
    timestamp: string;
  }) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('code-update', callback);
    
    // Return cleanup function
    return () => {
      socketRef.current?.off('code-update', callback);
    };
  };

  const onCursorUpdate = (callback: (data: {
    filePath: string;
    cursorPosition: number;
    selection?: { start: number; end: number };
    userId: string;
    timestamp: string;
  }) => void) => {
    if (!socketRef.current) return;

    socketRef.current.on('cursor-update', callback);
    
    return () => {
      socketRef.current?.off('cursor-update', callback);
    };
  };

  // Auto-connect quando il hook viene montato
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Auto-join progetto se specificato
  useEffect(() => {
    if (projectId && state.connected) {
      joinProject(projectId);
    }
  }, [projectId, state.connected]);

  return {
    // State
    ...state,
    socket: socketRef.current,
    
    // Actions
    connect,
    disconnect,
    joinProject,
    leaveProject,
    sendCodeChange,
    sendCursorChange,
    
    // Event listeners
    onCodeUpdate,
    onCursorUpdate
  };
}