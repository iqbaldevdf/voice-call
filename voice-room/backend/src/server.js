require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const {
  joinRoom,
  leaveRoom,
  getRoom,
  setMute,
} = require('./store');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Minimal in-memory room for two users
const rooms = {};

io.on('connection', (socket) => {
  console.log('Connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);
    // Notify others in the room
    socket.to(roomId).emit('user-joined', socket.id);
    // Send back list of other users
    socket.emit('all-users', rooms[roomId].filter(id => id !== socket.id));
    socket.roomId = roomId;
  });

  socket.on('offer', ({ offer, to }) => {
    io.to(to).emit('offer', { offer, from: socket.id });
  });

  socket.on('answer', ({ answer, to }) => {
    io.to(to).emit('answer', { answer, from: socket.id });
  });

  socket.on('ice-candidate', ({ candidate, to }) => {
    io.to(to).emit('ice-candidate', { candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    const { roomId } = socket;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
      socket.to(roomId).emit('user-left', socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    console.log('Disconnected:', socket.id);
  });
    socket.emit('room_joined', {
      roomId,
      you: me,
      participants: room.participants,
    });

    // Tell all other users in the room that this person joined
    socket.to(roomId).emit('participant_joined', {
      participant: me,
    });

    console.log(`${name} joined room ${roomId}. Total: ${room.participants.length}`);
  });

  // Receive raw audio binary and forward to all others in the room immediately
  socket.on('voice_data', (buffer) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    socket.to(roomId).emit('voice_data', {
      buffer,
      fromSocketId: socket.id,
    });
  });

  socket.on('mute', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    setMute(roomId, socket.id, true);
    io.to(roomId).emit('mute_update', {
      socketId: socket.id,
      isMuted: true,
    });
  });

  socket.on('unmute', () => {
    const roomId = socket.roomId;
    if (!roomId) return;
    setMute(roomId, socket.id, false);
    io.to(roomId).emit('mute_update', {
      socketId: socket.id,
      isMuted: false,
    });
  });

  socket.on('leave_room', () => {
    handleLeave(socket);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    handleLeave(socket);
  });
});

function handleLeave(socket) {
  const roomId = socket.roomId;
  if (!roomId) return;
  leaveRoom(roomId, socket.id);
  socket.to(roomId).emit('participant_left', {
    socketId: socket.id,
  });
  socket.leave(roomId);
  socket.roomId = null;
  console.log(`${socket.id} left room ${roomId}`);
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Voice room server running on port ${PORT}`);
});
