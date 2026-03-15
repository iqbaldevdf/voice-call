import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import socket from './socket';
import JoinScreen from './components/JoinScreen';
import VoiceRoom from './components/VoiceRoom';

function JoinPage({ error, setError }) {
  const navigate = useNavigate();

  function handleJoin({ name, roomId, language }) {
    setError('');
    socket.connect();
    socket.emit('join_room', { roomId, name, language });
  }

  return <JoinScreen onJoin={handleJoin} error={error} />;
}

function RoomPage({ setError }) {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;

  useEffect(() => {
    if (!state?.myInfo || !state?.roomId) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  function handleLeave() {
    navigate('/', { replace: true });
    setError('');
  }

  if (!state?.myInfo || state?.roomId !== roomId) {
    return null;
  }

  return (
    <VoiceRoom
      myInfo={state.myInfo}
      roomId={state.roomId}
      initialParticipants={state.initialParticipants || []}
      onLeave={handleLeave}
    />
  );
}

function AppRoutes() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    socket.on('room_joined', (data) => {
      const initialParticipants = data.participants.filter(
        (p) => p.socketId !== data.you.socketId
      );
      setError('');
      navigate(`/room/${encodeURIComponent(data.roomId)}`, {
        replace: true,
        state: {
          myInfo: data.you,
          roomId: data.roomId,
          initialParticipants,
        },
      });
    });

    socket.on('room_error', (data) => {
      setError(data.message);
    });

    socket.on('connect_error', () => {
      setError('Could not connect to server. Make sure the backend is running.');
    });

    return () => {
      socket.off('room_joined');
      socket.off('room_error');
      socket.off('connect_error');
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<JoinPage error={error} setError={setError} />} />
      <Route path="/room/:roomId" element={<RoomPage setError={setError} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
