import React from 'react';

export default function Board({ board, secretKey, canGuess, onGuess }) {
  return (
    <div className="board" role="grid" aria-label="Word board">
      {board.map((card, i) => {
        const revealed = card.revealed;
        const keyColor = !revealed && secretKey ? secretKey[i] : null;
        const cls = [
          'card',
          revealed ? `revealed reveal-anim rev-${card.color}` : '',
          keyColor ? `key-${keyColor}` : '',
          canGuess && !revealed ? 'clickable' : '',
        ].filter(Boolean).join(' ');

        const clickable = canGuess && !revealed;
        return (
          <div
            key={i}
            className={cls}
            role={clickable ? 'button' : 'gridcell'}
            tabIndex={clickable ? 0 : -1}
            aria-label={revealed ? `${card.word}, ${card.color}` : card.word}
            onClick={() => clickable && onGuess(i)}
            onKeyDown={(e) => { if (clickable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onGuess(i); } }}
          >
            {keyColor && <span className="key-tab" />}
            {revealed && card.color !== 'assassin' && <span className="stamp">✓</span>}
            <span className="word">{card.word}</span>
          </div>
        );
      })}
    </div>
  );
}
