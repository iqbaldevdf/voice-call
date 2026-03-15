import { useState } from 'react';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Portuguese', value: 'pt' },
];

export default function JoinScreen({ onJoin, error }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [language, setLanguage] = useState('en');
  const [localError, setLocalError] = useState('');

  function handleJoin() {
    if (!name.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      setLocalError('Please enter a room ID');
      return;
    }
    setLocalError('');
    onJoin({ name: name.trim(), roomId: roomId.trim(), language });
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        <div style={styles.iconWrap}>🎙️</div>
        <h1 style={styles.title}>VoiceRoom</h1>
        <p style={styles.subtitle}>Join a voice chat room</p>

        <div style={styles.field}>
          <label style={styles.label}>Your Name</label>
          <input
            style={styles.input}
            placeholder="e.g. Alice"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Room ID</label>
          <input
            style={styles.input}
            placeholder="e.g. room123"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Your Language</label>
          <select
            style={styles.input}
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        {(localError || error) && (
          <p style={styles.error}>{localError || error}</p>
        )}

        <button style={styles.btn} onClick={handleJoin}>
          Join Room
        </button>

        <p style={styles.hint}>
          Share the same Room ID with others to join your room
        </p>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    padding: '16px',
  },
  card: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  iconWrap: {
    fontSize: '36px',
    background: '#1d4ed8',
    borderRadius: '50%',
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { margin: 0, fontSize: '28px', fontWeight: 'bold', color: '#fff' },
  subtitle: { margin: 0, color: '#94a3b8', fontSize: '14px' },
  field: { width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', color: '#94a3b8' },
  input: {
    background: '#334155',
    border: '1px solid #475569',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  error: { color: '#f87171', margin: 0, fontSize: '13px' },
  btn: {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 0',
    width: '100%',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  hint: { color: '#64748b', fontSize: '12px', margin: 0, textAlign: 'center' },
};
