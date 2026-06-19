import React, { useEffect, useRef, useState } from 'react';
import { socket, pid } from './socket.js';
import Landing from './components/Landing.jsx';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';

export default function App() {
  const [state, setState] = useState(null); // server room state
  const [key, setKey] = useState(null); // artist's secret colour map
  const [toast, setToast] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  };

  useEffect(() => {
    const onState = (s) => {
      setState(s);
      setConnecting(false);
      // if we are no longer an artist, drop the secret key
      const me = s.players.find((p) => p.pid === pid);
      if (!me || me.role !== 'artist') setKey(null);
    };
    const onKey = (k) => setKey(k);
    const onToast = (m) => showToast(m);

    const tryRejoin = () => {
      const code = sessionStorage.getItem('awf-room');
      const name = sessionStorage.getItem('awf-name');
      if (code && name) socket.emit('joinRoom', { code, name, pid });
    };

    socket.on('state', onState);
    socket.on('key', onKey);
    socket.on('toast', onToast);
    socket.on('connect', tryRejoin);

    if (socket.connected) tryRejoin();

    return () => {
      socket.off('state', onState);
      socket.off('key', onKey);
      socket.off('toast', onToast);
      socket.off('connect', tryRejoin);
    };
  }, []);

  const createRoom = (name) => {
    setConnecting(true);
    sessionStorage.setItem('awf-name', name);
    socket.emit('createRoom', { name, pid }, (res) => {
      if (res?.error) { setConnecting(false); return showToast(res.error); }
      sessionStorage.setItem('awf-room', res.code);
    });
  };

  const joinRoom = (code, name) => {
    setConnecting(true);
    code = code.trim().toUpperCase();
    sessionStorage.setItem('awf-name', name);
    socket.emit('joinRoom', { code, name, pid }, (res) => {
      if (res?.error) { setConnecting(false); return showToast(res.error); }
      sessionStorage.setItem('awf-room', res.code);
    });
  };

  const leaveRoom = () => {
    sessionStorage.removeItem('awf-room');
    setState(null);
    setKey(null);
    socket.disconnect();
    socket.connect();
  };

  const actions = {
    setSeat: (team, role) => socket.emit('setSeat', { team, role }),
    startGame: () => socket.emit('startGame'),
    guess: (index) => socket.emit('guess', { index }),
    endTurn: () => socket.emit('endTurn'),
    playAgain: () => socket.emit('playAgain'),
    backToLobby: () => socket.emit('backToLobby'),
    leaveRoom,
  };

  const me = state?.players.find((p) => p.pid === pid) || null;

  let screen;
  if (!state || !me) {
    screen = <Landing onCreate={createRoom} onJoin={joinRoom} connecting={connecting} />;
  } else if (state.phase === 'lobby') {
    screen = <Lobby state={state} me={me} actions={actions} showToast={showToast} />;
  } else {
    screen = <Game state={state} me={me} secretKey={key} actions={actions} showToast={showToast} />;
  }

  return (
    <div className="app">
      <div className="grain" aria-hidden="true" />
      {screen}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
