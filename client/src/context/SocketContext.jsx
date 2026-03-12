import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const url =
      import.meta.env.VITE_SERVER_URL ||
      (import.meta.env.PROD ? window.location.origin : 'http://localhost:3001');

    const s = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
