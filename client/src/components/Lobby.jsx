import React from 'react';

const TEAMS = [
  { key: 'cyan', name: 'The Cyans', sub: 'one sketches · one guesses' },
  { key: 'coral', name: 'The Corals', sub: 'one sketches · one guesses' },
];

const DURATIONS = [
  { ms: 60000, label: '1:00' },
  { ms: 120000, label: '2:00' },
  { ms: 180000, label: '3:00' },
  { ms: 240000, label: '4:00' },
  { ms: 300000, label: '5:00' },
];

function Seat({ p, isMe }) {
  return (
    <div className="seat">
      <span className={`dot ${p.connected ? '' : 'off'}`} />
      <span className="who">{p.name}</span>
      {isMe && <span className="me-tag">YOU</span>}
      {p.isHost && <span className="role-pill">host</span>}
      <span className={`role-pill ${p.role || ''}`}>{p.role || 'no role'}</span>
    </div>
  );
}

export default function Lobby({ state, me, actions, showToast }) {
  const ready =
    state.readiness.cyan.artist && state.readiness.cyan.guesser &&
    state.readiness.coral.artist && state.readiness.coral.guesser;

  const bench = state.players.filter((p) => !p.team);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.code);
      showToast('Room code copied');
    } catch {
      showToast(`Your code is ${state.code}`);
    }
  };
  const copyLink = async () => {
    const url = `${window.location.origin}/?code=${state.code}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Invite link copied');
    } catch {
      showToast(url);
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-head">
        <div className="brand-sm">Are We Friends<span className="q">?</span></div>
        <div className="code-card">
          <div>
            <div className="code-label">room code</div>
            <div className="code-value">{state.code}</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={copyCode}>Copy code</button>
          <button className="btn btn-ghost btn-sm" onClick={copyLink}>Copy invite link</button>
        </div>
      </div>

      <div className="settings-bar">
        <span className="s-label">Turn length</span>
        <div className="dur-opts">
          {DURATIONS.map((d) => (
            <button
              key={d.ms}
              className={`dur ${state.turnMs === d.ms ? 'on' : ''}`}
              disabled={!me.isHost}
              aria-pressed={state.turnMs === d.ms}
              onClick={() => me.isHost && actions.setTurnMs(d.ms)}
            >{d.label}</button>
          ))}
        </div>
        <span className="by">{me.isHost ? 'each team draws for this long per turn' : 'set by the host'}</span>
      </div>

      <div className="teams">
        {TEAMS.map((t) => {
          const members = state.players.filter((p) => p.team === t.key);
          const mineHere = me.team === t.key;
          return (
            <div key={t.key} className={`team-col ${t.key}`}>
              <h3 className="team-title">{t.name}</h3>
              <p className="team-sub">{t.sub}</p>
              <div className="seat-list">
                {members.length === 0 && <div className="seat" style={{ opacity: 0.5 }}><span className="who">empty bench…</span></div>}
                {members.map((p) => <Seat key={p.pid} p={p} isMe={p.pid === me.pid} />)}
              </div>
              <div className="seat-actions">
                <button
                  className={`btn btn-sm ${mineHere && me.role === 'artist' ? (t.key === 'cyan' ? 'btn-cyan' : 'btn-coral') : 'btn-ghost'}`}
                  onClick={() => actions.setSeat(t.key, 'artist')}
                >Be the artist ✎</button>
                <button
                  className={`btn btn-sm ${mineHere && me.role === 'guesser' ? (t.key === 'cyan' ? 'btn-cyan' : 'btn-coral') : 'btn-ghost'}`}
                  onClick={() => actions.setSeat(t.key, 'guesser')}
                >Be a guesser ☆</button>
              </div>
            </div>
          );
        })}
      </div>

      {bench.length > 0 && (
        <div className="no-team">
          <h4>not seated yet</h4>
          <div className="bench">
            {bench.map((p) => <Seat key={p.pid} p={p} isMe={p.pid === me.pid} />)}
          </div>
        </div>
      )}

      <div className="lobby-foot">
        <button className="btn btn-ghost btn-sm" onClick={actions.leaveRoom}>Leave room</button>
        {me.isHost ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            {!ready && <span className="hint">Each team needs one artist and one guesser.</span>}
            <button className="btn btn-cyan" disabled={!ready} onClick={actions.startGame}>Start the game →</button>
          </div>
        ) : (
          <span className="hint">{ready ? 'Waiting for the host to start…' : 'Pick a team and a role above.'}</span>
        )}
      </div>
    </div>
  );
}
