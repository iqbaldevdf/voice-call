export default function ParticipantTile({ participant, isYou, isSpeaking }) {
  const COLORS = [
    '#2563eb', '#7c3aed', '#db2777',
    '#059669', '#d97706', '#dc2626',
    '#0891b2', '#65a30d',
  ];

  function getColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  }

  function getInitials(name) {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <div style={{
      ...styles.tile,
      boxShadow: isSpeaking
        ? '0 0 0 3px #22c55e, 0 0 20px rgba(34,197,94,0.3)'
        : '0 0 0 3px transparent',
    }}>
      <div style={{
        ...styles.avatar,
        background: getColor(participant.name || ''),
      }}>
        {getInitials(participant.name || '?')}
      </div>

      <p style={styles.name}>
        {participant.name || 'Unknown'}
        {isYou && <span style={styles.youBadge}> you</span>}
      </p>

      <span style={styles.langBadge}>
        {(participant.language || 'en').toUpperCase()}
      </span>

      <div style={styles.muteRow}>
        {participant.isMuted
          ? <span style={styles.mutedIcon}>🔇</span>
          : <span style={styles.unmutedIcon}>🎤</span>
        }
        <span style={styles.muteLabel}>
          {participant.isMuted ? 'Muted' : 'Speaking'}
        </span>
      </div>
    </div>
  );
}

const styles = {
  tile: {
    background: '#1e293b',
    borderRadius: '20px',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    width: '160px',
    transition: 'box-shadow 0.2s ease',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  youBadge: {
    fontSize: '11px',
    color: '#94a3b8',
    fontWeight: 'normal',
  },
  langBadge: {
    fontSize: '11px',
    color: '#94a3b8',
    background: '#334155',
    borderRadius: '8px',
    padding: '2px 10px',
  },
  muteRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  mutedIcon: { fontSize: '16px' },
  unmutedIcon: { fontSize: '16px' },
  muteLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
};
