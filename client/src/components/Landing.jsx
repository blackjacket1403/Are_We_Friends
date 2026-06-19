import React, { useState } from 'react';

const linkCode = (new URLSearchParams(window.location.search).get('code') || '')
  .toUpperCase()
  .replace(/[^A-Z]/g, '')
  .slice(0, 4);

export default function Landing({ onCreate, onJoin, connecting }) {
  const [mode, setMode] = useState(linkCode ? 'join' : 'create'); // 'create' | 'join'
  const [name, setName] = useState(sessionStorage.getItem('awf-name') || '');
  const [code, setCode] = useState(linkCode);

  const canCreate = name.trim().length > 0;
  const canJoin = name.trim().length > 0 && code.trim().length === 4;

  const submit = (e) => {
    e.preventDefault();
    if (mode === 'create' && canCreate) onCreate(name.trim());
    if (mode === 'join' && canJoin) onJoin(code.trim(), name.trim());
  };

  return (
    <div className="landing">
      {/* ambient sketch doodles */}
      <svg className="doodle d1" viewBox="0 0 100 100"><circle cx="42" cy="42" r="30" strokeWidth="4" /><line x1="64" y1="64" x2="92" y2="92" strokeWidth="6" strokeLinecap="round" /></svg>
      <svg className="doodle d2" viewBox="0 0 120 80"><path d="M6 40 Q20 8 40 38 T78 38 T114 40" strokeWidth="4" strokeLinecap="round" /></svg>
      <svg className="doodle d3" viewBox="0 0 60 80"><path d="M14 24 Q14 6 32 6 Q50 6 50 24 Q50 38 32 44 L32 56" strokeWidth="6" strokeLinecap="round" /><circle cx="32" cy="70" r="4" fill="currentColor" stroke="none" /></svg>

      <div className="landing-inner">
        <p className="eyebrow">a draw-&amp;-guess spy game · 4 friends, 2 teams</p>
        <h1 className="wordmark">Are We <span className="accent">Friends</span><span className="q">?</span></h1>
        <svg className="underline-scribble" viewBox="0 0 400 22" preserveAspectRatio="none">
          <path d="M4 14 C 70 4, 130 20, 200 11 S 330 4, 396 13" />
        </svg>
        <p className="tagline">One of you knows the answers but can only <em>draw</em>. Lead your partner to the right words — and don't draw the assassin.</p>

        <form className="panel" onSubmit={submit}>
          <div className="toggle" role="tablist" aria-label="Create or join">
            <button type="button" role="tab" aria-selected={mode === 'create'} className={mode === 'create' ? 'on' : ''} onClick={() => setMode('create')}>Start a room</button>
            <button type="button" role="tab" aria-selected={mode === 'join'} className={mode === 'join' ? 'on' : ''} onClick={() => setMode('join')}>Join a game</button>
          </div>

          <div className="stack">
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input id="name" className="input" value={name} maxLength={18} placeholder="e.g. Satpal" onChange={(e) => setName(e.target.value)} autoComplete="off" />
            </div>

            {mode === 'join' && (
              <div className="field">
                <label htmlFor="code">Room code</label>
                <input id="code" className="input code-input" value={code} maxLength={4} placeholder="ABCD" onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))} autoComplete="off" inputMode="text" />
              </div>
            )}

            <button className="btn btn-cyan full" type="submit" disabled={connecting || (mode === 'create' ? !canCreate : !canJoin)}>
              {connecting ? 'Connecting…' : mode === 'create' ? 'Create the room →' : 'Join the room →'}
            </button>
          </div>
        </form>

        <p className="fineprint">Share the 4-letter code · 2 teams · 1 artist + 1 guesser each · 3-minute turns</p>
      </div>
    </div>
  );
}
