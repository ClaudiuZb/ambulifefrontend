// Implementare pentru useChatSocket hook

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useChatSocket = (user, notification, setNotification, setOnlineUsers) => {
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Inițializăm conexiunea Socket.IO
    const ENDPOINT = process.env.REACT_APP_API_URL || '';
    const newSocket = io(ENDPOINT, {
      withCredentials: true,
      transports: ['websocket'],
      path: '/socket.io',
    });
    
    setSocket(newSocket);

    // Conexiune la server
    newSocket.on('connect', () => {
      console.log('Socket.IO conectat');
      setSocketConnected(true);
      
      // Anunțăm serverul despre utilizator
      newSocket.emit('setup', user._id);
    });

    // Actualizare utilizatori online
    newSocket.on('online_users', (users) => {
      setOnlineUsers(users);
    });

    // Curățare la deconectare
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, setOnlineUsers]);

  return { socket, socketConnected };
};

export default useChatSocket;