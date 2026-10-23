// Dashboard/src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:5500';

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  autoConnect: true
});

socket.on('connect', () => {
  console.log('✓ Connected to STMS Real-Time Socket Server:', socket.id);
  socket.emit('requestInitialData');
});

socket.on('disconnect', (reason) => {
  console.log('✗ Disconnected from STMS Socket Server:', reason);
});

export default socket;
