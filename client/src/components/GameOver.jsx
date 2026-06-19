import React from 'react';

export default function GameOver({ state, me, actions }) {
  const winner = state.winner; // 'cyan' | 'coral'
  const byAssassin = (state.lastReason || '').toLowerCase().includes('assassin');
  const name = winner === 'cyan' ? 'The Cyans' : 'The Corals';
  const iWon = me.team === winner;

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Game over">
      <div className={`result ${byAssassin ? 'assassin' : winner}`}>
        <h2 className="crown">{byAssassin ? 'Assassin!' : `${name} win`}</h2>
        <p className="why">{state.lastReason}</p>
        {me.team && (
          <p className="why" style={{ marginTop: '-0.6rem' }}>
            {iWon ? 'So… still friends? 🎉' : 'Rematch and find out who really knows whom.'}
          </p>
        )}
        <div className="actions">
          {me.isHost ? (
            <>
              <button className="btn btn-cyan" onClick={actions.playAgain}>Rematch ↻</button>
              <button className="btn btn-ghost" onClick={actions.backToLobby}>Back to lobby</button>
            </>
          ) : (
            <span className="hint">Waiting for the host to start a rematch…</span>
          )}
        </div>
      </div>
    </div>
  );
}
