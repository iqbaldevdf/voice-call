import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

export default function VoiceRoom() {
  const [roomId, setRoomId] = useState('demo');
  const [joined, setJoined] = useState(false);
  const [otherUsers, setOtherUsers] = useState([]);
  const [callStarted, setCallStarted] = useState(false);
  const localAudioRef = useRef();
  const remoteAudioRef = useRef();
  const pcRef = useRef();
  const localStreamRef = useRef();
  const remoteStreamRef = useRef();
  const [status, setStatus] = useState('');

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);

  // Join room
  const handleJoin = () => {
    socket.emit('join-room', roomId);
    setJoined(true);
    setStatus('Joined room.');
  };

  // Listen for signaling events
  useEffect(() => {
    if (!joined) return;

    socket.on('all-users', (users) => {
      // ...existing code...
        socket.emit('ice-candidate', { candidate: event.candidate, to: otherUsers[0] });
      }
    };
    pc.ontrack = (event) => {
      remoteStreamRef.current.addTrack(event.track);
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
    }
  }

  // Start call (create offer)
  const handleStartCall = async () => {
    setStatus('Starting call...');
    // Get mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    if (localAudioRef.current) localAudioRef.current.srcObject = stream;
    await ensurePeerConnection();
    stream.getTracks().forEach(track => pcRef.current.addTrack(track, stream));
    if (otherUsers.length > 0) {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit('offer', { offer, to: otherUsers[0] });
      setStatus('Offer sent. Waiting for answer...');
    } else {
      setStatus('Waiting for another user to join...');
    }
    setCallStarted(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Minimal WebRTC Voice Call (Stage 1)</h2>
      <div>
        <label>Room ID: </label>
        <input value={roomId} onChange={e => setRoomId(e.target.value)} disabled={joined} />
        <button onClick={handleJoin} disabled={joined}>Join Room</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <button onClick={handleStartCall} disabled={!joined || callStarted}>Start Call</button>
      </div>
      <div style={{ marginTop: 16 }}>
        <div>Status: {status}</div>
        <div>Other users: {otherUsers.join(', ')}</div>
      </div>
      <div style={{ marginTop: 24 }}>
        <div>
          <b>Local Audio:</b>
          <audio ref={localAudioRef} autoPlay muted controls style={{ width: 300 }} />
        </div>
        <div>
          <b>Remote Audio:</b>
          <audio ref={remoteAudioRef} autoPlay controls style={{ width: 300 }} />
        </div>
      </div>
    </div>
  );
}
// ...existing code...
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'sans-serif',
    color: '#fff',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#1e293b',
    padding: '14px 24px',
    borderBottom: '1px solid #334155',
  },
  appName: { fontWeight: 'bold', fontSize: '18px' },
  roomBadge: {
    background: '#1d4ed8',
    borderRadius: '20px',
    padding: '4px 16px',
    fontSize: '13px',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  count: { color: '#94a3b8', fontSize: '13px' },
  leaveBtn: {
    background: 'transparent',
    border: '1px solid #ef4444',
    color: '#ef4444',
    borderRadius: '8px',
    padding: '6px 16px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  tilesArea: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '20px',
    padding: '24px',
    alignContent: 'center',
    justifyContent: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    padding: '24px',
    borderTop: '1px solid #1e293b',
  },
  btnMuted: {
    background: '#334155',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '50px',
    padding: '16px 48px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  btnUnmuted: {
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '50px',
    padding: '16px 48px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};
