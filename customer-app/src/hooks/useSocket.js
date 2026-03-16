import { useEffect, useRef } from 'react';
import { io }                from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = (namespace = '/ride') => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(SOCKET_URL + namespace, {
      auth:       { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    });

    socket.on('connect',       () => console.log('[socket] connected:', namespace));
    socket.on('connect_error', (err) => console.warn('[socket] error:', err.message));
    socket.on('disconnect',    (reason) => console.log('[socket] disconnected:', reason));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [namespace]);

  return socketRef;
};

export default useSocket;