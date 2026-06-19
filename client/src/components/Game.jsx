import React, { useEffect, useState } from 'react';
import Board from './Board.jsx';
import Canvas from './Canvas.jsx';
import GameOver from './GameOver.jsx';

const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function Game({ state, me, secretKey, actions }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (state.phase !== 'playing' || !state.deadline) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [state.phase, state.deadline]);

  const active = state.activeTeam;
  const isMyTeamActive = me.team === active;
  const amArtist = me.role === 'artist';
  const canDraw = isMyTeamActive && amArtist && state.phase === 'playing';
  const canGuess = isMyTeamActive && me.role === 'guesser' && state.phase === 'playing';
  const canEndTurn = isMyTeamActive && state.phase === 'playing';

  const remaining = state.deadline ? state.deadline - now : state.turnMs;
  const danger = remaining <= 30000 && state.phase === 'playing';

  // find my teammate's name for friendlier prompts
  const teammate = state.players.find((p) => p.team === me.team && p.pid !== me.pid);

  let banner;
  if (!me.team) {
    banner = <>You're <b>spectating</b>. Grab a seat next round.</>;
  } else if (!isMyTeamActive) {
    banner = <>{active === 'cyan' ? 'Cyan' : 'Coral'} is on the clock. Your turn is next — start planning your sketches.</>;
  } else if (amArtist) {
    banner = <><b>You're drawing.</b> Get {teammate ? teammate.name : 'your guesser'} to your team's words. No letters, numbers, or words on the page.</>;
  } else {
    banner = <><b>You're guessing.</b> Read {teammate ? `${teammate.name}'s` : 'the'} sketch and tap a word. A wrong card ends the turn — the assassin ends the game.</>;
  }

  return (
    <div className="game">
      <div className="topbar">
        <div className="brand-sm">Are We Friends<span className="q">?</span></div>
        <div className="right">
          <span className="chip-code">{state.code}</span>
          <button className="btn btn-ghost btn-sm" onClick={actions.leaveRoom}>Leave</button>
        </div>
      </div>

      <div className="scoreline">
        <div className={`score cyan ${active === 'cyan' ? 'active' : ''}`}>
          <span className="num">{state.counts.cyan}</span>
          <span className="lbl">Cyan<br />left</span>
        </div>
        <div className="timer-wrap">
          <span className={`timer ${active} ${danger ? 'danger' : ''}`}>{fmt(remaining)}</span>
          <span className="turn-label">{active === 'cyan' ? 'Cyan' : 'Coral'} drawing</span>
        </div>
        <div className={`score coral ${active === 'coral' ? 'active' : ''}`}>
          <span className="num">{state.counts.coral}</span>
          <span className="lbl">Coral<br />left</span>
        </div>
      </div>

      <div className="stage">
        <div className="canvas-wrap">
          <div className={`role-banner ${me.team || ''}`}>{banner}</div>
          <Canvas canDraw={canDraw} />
        </div>

        <div className="board-wrap">
          <Board board={state.board} secretKey={secretKey} canGuess={canGuess} onGuess={actions.guess} />
          <div className="board-foot">{state.lastReason}</div>
          {canEndTurn && (
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={actions.endTurn}>End our turn / pass →</button>
            </div>
          )}
        </div>
      </div>

      <div className="ribbon">
        {secretKey ? 'You can see the key — you are the artist.' : 'Cards reveal their colour only when guessed.'}
      </div>

      {state.phase === 'gameover' && <GameOver state={state} me={me} actions={actions} />}
    </div>
  );
}
