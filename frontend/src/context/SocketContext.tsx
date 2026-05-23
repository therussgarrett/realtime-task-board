/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  const socket = useMemo<Socket | null>(() => {
    if (!token) return null;

    const s = io(API_URL, {
      auth: { token },
      autoConnect: false,
    });

    return s;
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('🟢 SOCKET CONNECTED:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 SOCKET DISCONNECTED');
    });

    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be within SocketProvider');
  return context;
};
