import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3003';

export const useWebSocket = (businessId) => {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!businessId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to WebSocket
    socketRef.current = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [businessId]);

  // Subscribe to event
  const subscribe = useCallback((event, callback) => {
    if (!socketRef.current) return;

    socketRef.current.on(event, callback);

    // Track listener for cleanup
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
      listenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  // Unsubscribe from event
  const unsubscribe = useCallback((event, callback) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, callback);
    listenersRef.current.get(event)?.delete(callback);
  }, []);

  // Join conversation room
  const joinConversation = useCallback((conversationId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join:conversation', conversationId);
  }, []);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave:conversation', conversationId);
  }, []);

  // Send typing indicator
  const startTyping = useCallback((conversationId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing:start', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing:stop', { conversationId });
  }, []);

  // Send message
  const sendMessage = useCallback((conversationId, content, messageType = 'text') => {
    if (!socketRef.current) return;
    socketRef.current.emit('message:send', { conversationId, content, messageType });
  }, []);

  // Accept handoff
  const acceptHandoff = useCallback((conversationId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('handoff:accept', { conversationId });
  }, []);

  // Update status
  const updateStatus = useCallback((status) => {
    if (!socketRef.current) return;
    socketRef.current.emit('status:update', status);
  }, []);

  return {
    subscribe,
    unsubscribe,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    sendMessage,
    acceptHandoff,
    updateStatus,
    isConnected: socketRef.current?.connected || false
  };
};

export default useWebSocket;
