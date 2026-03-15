import { useState, useEffect, useRef } from 'react';
import socket from './socket';

export default function VoiceRoom() {
  const [roomId, setRoomId] = useState('demo');
  const [joined, setJoined] = useState(false);
  const [otherUsers, setOtherUsers] = useState([]);
  const [callStarted, setCallStarted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const localAudioRef = useRef();
  const localStreamRef = useRef();
  const [status, setStatus] = useState('');
  // Multi-user: peer connections and remote audio refs
  const peerConnections = useRef({}); // { [socketId]: RTCPeerConnection }
  const remoteAudioRefs = useRef({}); // { [socketId]: React ref }
  const remoteStreams = useRef({}); // { [socketId]: MediaStream }

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
      console.log('[Signaling] Received all-users:', users);
      setOtherUsers(users);
      setStatus('Users in room: ' + users.join(', '));
      // For each existing user, create a peer connection and initiate offer
      if (callStarted && localStreamRef.current) {
        users.forEach(remoteId => {
          if (!peerConnections.current[remoteId]) {
            createPeerConnection(remoteId, true);
          }
        });
      }
    });
    socket.on('user-joined', (id) => {
      console.log('[Signaling] User joined:', id);
      setOtherUsers((prev) => [...prev, id]);
      // If call started, create peer connection and initiate offer
      if (callStarted && localStreamRef.current && !peerConnections.current[id]) {
        createPeerConnection(id, true);
      }
    });
    socket.on('user-left', (id) => {
      console.log('[Signaling] User left:', id);
      setOtherUsers((prev) => prev.filter(uid => uid !== id));
      // Cleanup peer connection and audio
      if (peerConnections.current[id]) {
        peerConnections.current[id].close();
        delete peerConnections.current[id];
      }
      if (remoteAudioRefs.current[id]) {
        delete remoteAudioRefs.current[id];
      }
      if (remoteStreams.current[id]) {
        delete remoteStreams.current[id];
      }
    });

    // Offer from remote
    socket.on('offer', async ({ offer, from }) => {
      console.log('[Signaling] Received offer from', from);
      if (!peerConnections.current[from]) {
        createPeerConnection(from, false);
      }
      await peerConnections.current[from].setRemoteDescription(new window.RTCSessionDescription(offer));
      const answer = await peerConnections.current[from].createAnswer();
      await peerConnections.current[from].setLocalDescription(answer);
      socket.emit('answer', { answer, to: from });
      setStatus('Received offer, sent answer.');
      console.log('[Signaling] Sent answer to', from);
    });

    // Answer from remote
    socket.on('answer', async ({ answer, from }) => {
      console.log('[Signaling] Received answer from', from);
      if (peerConnections.current[from]) {
        await peerConnections.current[from].setRemoteDescription(new window.RTCSessionDescription(answer));
        setStatus('Call established with ' + from);
      }
    });

    // ICE candidate
    socket.on('ice-candidate', async ({ candidate, from }) => {
      console.log('[Signaling] Received ICE candidate from', from);
      if (peerConnections.current[from]) {
        try {
          await peerConnections.current[from].addIceCandidate(new window.RTCIceCandidate(candidate));
          console.log('[Signaling] Added ICE candidate for', from);
        } catch (e) {
          console.warn('[Signaling] Failed to add ICE candidate', e);
        }
      }
    });

    return () => {
      socket.off('all-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [joined, callStarted]);

  // Create a peer connection for a remote user
  function createPeerConnection(remoteId, isInitiator) {
    console.log('[WebRTC] Creating peer connection for', remoteId, 'initiator:', isInitiator);
    const pc = new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerConnections.current[remoteId] = pc;
    remoteStreams.current[remoteId] = new window.MediaStream();
    if (!remoteAudioRefs.current[remoteId]) {
      remoteAudioRefs.current[remoteId] = { current: null };
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] Sending ICE candidate to', remoteId);
        socket.emit('ice-candidate', { candidate: event.candidate, to: remoteId });
      }
    };
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track from', remoteId, event.track);
      remoteStreams.current[remoteId].addTrack(event.track);
      if (remoteAudioRefs.current[remoteId].current) {
        remoteAudioRefs.current[remoteId].current.srcObject = remoteStreams.current[remoteId];
      }
    };

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[WebRTC] Adding local track to', remoteId, track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // If initiator, create offer
    if (isInitiator) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', { offer, to: remoteId });
          setStatus('Offer sent to ' + remoteId);
        } catch (err) {
          console.error('[WebRTC] Negotiation error:', err);
        }
      };
    }
  }

  // Create peer connection
  async function ensurePeerConnection() {
    if (pcRef.current) return;
    console.log('[WebRTC] Creating new RTCPeerConnection');
    const pc = new window.RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    remoteStreamRef.current = new window.MediaStream();
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;

    pc.onicecandidate = (event) => {
      if (event.candidate && otherUsers.length > 0) {
        console.log('[WebRTC] Sending ICE candidate to', otherUsers[0]);
        socket.emit('ice-candidate', { candidate: event.candidate, to: otherUsers[0] });
      }
    };
    pc.ontrack = (event) => {
      console.log('[WebRTC] Received remote track', event.track);
      remoteStreamRef.current.addTrack(event.track);
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStreamRef.current;
    };

    // Add local tracks only once, after stream is set
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('[WebRTC] Adding local track', track.kind);
        pc.addTrack(track, localStreamRef.current);
      });
    }
  }

  // Start call (create offers to all users)
  const handleStartCall = async () => {
    setStatus('Starting call...');
    console.log('[WebRTC] Requesting microphone access...');
    // Get mic
    const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    if (localAudioRef.current) localAudioRef.current.srcObject = stream;
    setMicMuted(false);
    setCallStarted(true);
    // For each other user, create a peer connection and initiate offer
    otherUsers.forEach(remoteId => {
      if (!peerConnections.current[remoteId]) {
        createPeerConnection(remoteId, true);
      }
    });
  };

  // Toggle mic mute/unmute
  const handleToggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) return;
    if (micMuted) {
      audioTracks.forEach(track => track.enabled = true);
      setMicMuted(false);
      setStatus('Mic unmuted');
      console.log('[Mic] Unmuted');
    } else {
      audioTracks.forEach(track => track.enabled = false);
      setMicMuted(true);
      setStatus('Mic muted');
      console.log('[Mic] Muted');
    }
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
        {callStarted && (
          <button onClick={handleToggleMute} style={{ marginLeft: 12 }}>
            {micMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>
        )}
      </div>
      <div style={{ marginTop: 16 }}>
        <div>Status: {status}</div>
        <div>Other users: {otherUsers.join(', ')}</div>
        <div>Mic: <b>{micMuted ? 'Muted' : 'Unmuted'}</b></div>
      </div>
      <div style={{ marginTop: 24 }}>
        <div>
          <b>Local Audio:</b>
          <audio ref={localAudioRef} autoPlay muted controls style={{ width: 300 }} />
        </div>
        <div>
          <b>Remote Audio:</b>
          {otherUsers.map(uid => (
            <div key={uid} style={{ marginBottom: 8 }}>
              <span>{uid.slice(-6)}:</span>
              <audio
                ref={el => {
                  if (el) {
                    if (!remoteAudioRefs.current[uid]) remoteAudioRefs.current[uid] = { current: null };
                    remoteAudioRefs.current[uid].current = el;
                  }
                }}
                autoPlay
                controls
                style={{ width: 300 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
