import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3002', {
  autoConnect: false,
  transports: ['websocket'],
});

export default socket;
