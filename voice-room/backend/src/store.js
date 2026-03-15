const rooms = new Map();

function joinRoom(roomId, socketId, name, language) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { roomId, participants: [] });
  }
  const room = rooms.get(roomId);
  const existing = room.participants.find(p => p.socketId === socketId);
  if (existing) return { success: true, room };
  room.participants.push({
    socketId,
    name,
    language,
    isMuted: true,
  });
  return { success: true, room };
}

function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;
  room.participants = room.participants.filter(p => p.socketId !== socketId);
  if (room.participants.length === 0) rooms.delete(roomId);
}

function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

function getParticipant(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  return room.participants.find(p => p.socketId === socketId) || null;
}

function setMute(roomId, socketId, isMuted) {
  const p = getParticipant(roomId, socketId);
  if (p) p.isMuted = isMuted;
}

function getOthers(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return room.participants.filter(p => p.socketId !== socketId);
}

module.exports = {
  joinRoom,
  leaveRoom,
  getRoom,
  getParticipant,
  setMute,
  getOthers,
};
