const { WORDS } = require('./words');

const BOARD_SIZE = 25;
const TURN_MS = 180000; // default: 3 minutes per turn
const TURN_OPTIONS = [60000, 120000, 180000, 240000, 300000]; // 1–5 min, host-selectable
const RECONNECT_GRACE_MS = 60000; // keep a slot warm for a minute after a drop
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid 1/0 confusion

const other = (team) => (team === 'cyan' ? 'coral' : 'cyan');

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 25 cards: starting team 9, other team 8, neutral 7, assassin 1.
function makeBoard() {
  const startingTeam = Math.random() < 0.5 ? 'cyan' : 'coral';
  const second = other(startingTeam);
  const colors = [
    ...Array(9).fill(startingTeam),
    ...Array(8).fill(second),
    ...Array(7).fill('neutral'),
    'assassin',
  ];
  const shuffledColors = shuffle(colors);
  const words = shuffle(WORDS).slice(0, BOARD_SIZE);
  const board = words.map((word, i) => ({
    word,
    color: shuffledColors[i],
    revealed: false,
  }));
  return {
    board,
    startingTeam,
    counts: { cyan: board.filter((c) => c.color === 'cyan').length, coral: board.filter((c) => c.color === 'coral').length },
  };
}

class GameServer {
  constructor(io) {
    this.io = io;
    this.rooms = new Map(); // code -> room
    this.socketIndex = new Map(); // socketId -> { code, pid }
    this.timers = new Map(); // code -> { interval, cleanup }
  }

  generateCode() {
    let code;
    do {
      code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  // ---- room lifecycle ---------------------------------------------------

  createRoom(socket, { name, pid }) {
    const code = this.generateCode();
    const room = {
      code,
      phase: 'lobby',
      players: new Map(),
      turnMs: TURN_MS,
      board: [],
      startingTeam: null,
      counts: { cyan: 0, coral: 0 },
      activeTeam: null,
      deadline: null,
      strokes: [],
      winner: null,
      lastReason: null,
      log: [],
    };
    this.rooms.set(code, room);
    this.addPlayer(room, socket, { name, pid, isHost: true });
    this.broadcast(room);
    return code;
  }

  joinRoom(socket, { code, name, pid }) {
    code = (code || '').trim().toUpperCase();
    const room = this.rooms.get(code);
    if (!room) return { error: "No room with that code. Double-check the four letters." };

    const existing = room.players.get(pid);
    if (existing) {
      // reconnect — keep team/role, swap in the new socket
      existing.socketId = socket.id;
      existing.connected = true;
      existing.name = name || existing.name;
      if (existing.dropTimer) { clearTimeout(existing.dropTimer); existing.dropTimer = null; }
    } else {
      if (room.phase !== 'lobby') {
        // late arrivals join as benchwarmers (no team) — they can spectate
        this.addPlayer(room, socket, { name, pid, isHost: false });
      } else {
        this.addPlayer(room, socket, { name, pid, isHost: false });
      }
    }
    socket.join(code);
    this.socketIndex.set(socket.id, { code, pid });
    this.broadcast(room);
    if (room.phase === 'playing') this.io.to(socket.id).emit('canvasSync', room.strokes);
    return { code };
  }

  addPlayer(room, socket, { name, pid, isHost }) {
    const player = {
      pid,
      name: (name || 'Player').slice(0, 18),
      socketId: socket.id,
      team: null,
      role: null,
      connected: true,
      isHost: isHost && room.players.size === 0,
      dropTimer: null,
    };
    room.players.set(pid, player);
    socket.join(room.code);
    this.socketIndex.set(socket.id, { code: room.code, pid });
    return player;
  }

  setSeat(socket, { team, role }) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(ctx.pid);
    if (!player) return;
    if (team !== null && team !== 'cyan' && team !== 'coral') return;
    if (role !== null && role !== 'artist' && role !== 'guesser') return;
    // only one artist per team — if claiming artist, bump the current one to guesser
    if (team && role === 'artist') {
      for (const p of room.players.values()) {
        if (p.pid !== player.pid && p.team === team && p.role === 'artist') p.role = 'guesser';
      }
    }
    player.team = team;
    player.role = role;
    this.broadcast(room);
  }

  setTurnMs(socket, { ms }) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room || room.phase !== 'lobby') return;
    const player = room.players.get(ctx.pid);
    if (!player || !player.isHost) return;
    if (!TURN_OPTIONS.includes(ms)) return;
    room.turnMs = ms;
    this.broadcast(room);
  }

  teamReadiness(room) {
    const status = {
      cyan: { artist: false, guesser: false, count: 0 },
      coral: { artist: false, guesser: false, count: 0 },
    };
    for (const p of room.players.values()) {
      if (p.team && status[p.team]) {
        status[p.team].count++;
        if (p.role === 'artist') status[p.team].artist = true;
        if (p.role === 'guesser') status[p.team].guesser = true;
      }
    }
    return status;
  }

  startGame(socket) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    const player = room.players.get(ctx.pid);
    if (!player || !player.isHost) return this.io.to(socket.id).emit('toast', 'Only the host can start the game.');

    const r = this.teamReadiness(room);
    const missing = [];
    for (const team of ['cyan', 'coral']) {
      if (!r[team].artist) missing.push(`${team === 'cyan' ? 'Cyan' : 'Coral'} needs an artist`);
      if (!r[team].guesser) missing.push(`${team === 'cyan' ? 'Cyan' : 'Coral'} needs a guesser`);
    }
    if (missing.length) return this.io.to(socket.id).emit('toast', missing.join(' · '));

    this.dealNewRound(room);
  }

  dealNewRound(room) {
    const { board, startingTeam, counts } = makeBoard();
    room.board = board;
    room.startingTeam = startingTeam;
    room.counts = counts;
    room.activeTeam = startingTeam;
    room.phase = 'playing';
    room.winner = null;
    room.lastReason = `${startingTeam === 'cyan' ? 'Cyan' : 'Coral'} starts — they have the extra card.`;
    room.strokes = [];
    room.log = [];
    this.startTimer(room);
    this.io.to(room.code).emit('clear');
    this.broadcast(room);
  }

  // ---- turn timer -------------------------------------------------------

  startTimer(room) {
    this.clearTimer(room.code);
    room.deadline = Date.now() + room.turnMs;
    const interval = setInterval(() => {
      if (room.phase !== 'playing') return this.clearTimer(room.code);
      if (Date.now() >= room.deadline) {
        room.lastReason = `Time! ${room.activeTeam === 'cyan' ? 'Cyan' : 'Coral'} ran out the clock.`;
        this.switchTurn(room);
      }
    }, 1000);
    this.timers.set(room.code, interval);
  }

  clearTimer(code) {
    const t = this.timers.get(code);
    if (t) { clearInterval(t); this.timers.delete(code); }
  }

  switchTurn(room) {
    room.activeTeam = other(room.activeTeam);
    room.strokes = [];
    this.io.to(room.code).emit('clear');
    this.startTimer(room);
    this.broadcast(room);
  }

  // ---- in-game actions --------------------------------------------------

  activePlayer(room, socket, wantRole) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return null;
    const player = room.players.get(ctx.pid);
    if (!player) return null;
    if (room.phase !== 'playing') return null;
    if (player.team !== room.activeTeam) return null;
    if (wantRole && player.role !== wantRole) return null;
    return player;
  }

  draw(socket, stroke) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    if (!this.activePlayer(room, socket, 'artist')) return;
    if (!stroke || !Array.isArray(stroke.points)) return;
    room.strokes.push(stroke);
    if (room.strokes.length > 5000) room.strokes.shift();
    socket.to(room.code).emit('draw', stroke);
  }

  requestSync(socket) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    this.io.to(socket.id).emit('canvasSync', room.strokes);
  }

  clearCanvas(socket) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    if (!this.activePlayer(room, socket, 'artist')) return;
    room.strokes = [];
    this.io.to(room.code).emit('clear');
  }

  guess(socket, { index }) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    const player = this.activePlayer(room, socket, 'guesser');
    if (!player) return;
    const card = room.board[index];
    if (!card || card.revealed) return;

    card.revealed = true;
    const team = room.activeTeam;
    const opp = other(team);
    let endsTurn = false;

    if (card.color === team) {
      room.counts[team]--;
      room.log.push({ pid: player.pid, name: player.name, word: card.word, color: card.color });
      room.lastReason = `${player.name} nailed "${card.word}". Keep going!`;
      if (room.counts[team] <= 0) return this.endGame(room, team, `${team === 'cyan' ? 'Cyan' : 'Coral'} found every word!`);
    } else if (card.color === 'assassin') {
      room.log.push({ pid: player.pid, name: player.name, word: card.word, color: card.color });
      return this.endGame(room, opp, `"${card.word}" was the assassin. Are we still friends?`);
    } else {
      if (card.color === opp) {
        room.counts[opp]--;
        room.lastReason = `Ouch — "${card.word}" belonged to ${opp === 'cyan' ? 'Cyan' : 'Coral'}.`;
        if (room.counts[opp] <= 0) return this.endGame(room, opp, `${opp === 'cyan' ? 'Cyan' : 'Coral'} got the last word handed to them!`);
      } else {
        room.lastReason = `"${card.word}" was a bystander. Turn over.`;
      }
      endsTurn = true;
    }
    room.log.push({ pid: player.pid, name: player.name, word: card.word, color: card.color });
    if (endsTurn) this.switchTurn(room);
    else this.broadcast(room);
  }

  endTurn(socket) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    const player = this.activePlayer(room, socket);
    if (!player) return;
    room.lastReason = `${room.activeTeam === 'cyan' ? 'Cyan' : 'Coral'} passed the turn.`;
    this.switchTurn(room);
  }

  endGame(room, winner, reason) {
    room.phase = 'gameover';
    room.winner = winner;
    room.lastReason = reason;
    room.deadline = null;
    this.clearTimer(room.code);
    // reveal the whole board on game over
    room.board.forEach((c) => { c.revealed = true; });
    this.broadcast(room);
  }

  playAgain(socket) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    const player = room.players.get(ctx.pid);
    if (!player || !player.isHost) return this.io.to(socket.id).emit('toast', 'Only the host can start a rematch.');
    this.dealNewRound(room);
  }

  backToLobby(socket) {
    const ctx = this.socketIndex.get(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    const player = room.players.get(ctx.pid);
    if (!player || !player.isHost) return;
    this.clearTimer(room.code);
    room.phase = 'lobby';
    room.board = [];
    room.winner = null;
    room.deadline = null;
    room.strokes = [];
    room.lastReason = null;
    this.io.to(room.code).emit('clear');
    this.broadcast(room);
  }

  // ---- disconnect -------------------------------------------------------

  disconnect(socket) {
    const ctx = this.socketIndex.get(socket.id);
    this.socketIndex.delete(socket.id);
    if (!ctx) return;
    const room = this.rooms.get(ctx.code);
    if (!room) return;
    const player = room.players.get(ctx.pid);
    if (!player) return;
    player.connected = false;
    this.broadcast(room);
    // give them a grace window to reconnect, then drop the slot
    player.dropTimer = setTimeout(() => {
      const current = room.players.get(ctx.pid);
      if (current && !current.connected) {
        const wasHost = current.isHost;
        room.players.delete(ctx.pid);
        if (room.players.size === 0) {
          this.clearTimer(room.code);
          this.rooms.delete(room.code);
          return;
        }
        if (wasHost) {
          const next = [...room.players.values()].find((p) => p.connected) || [...room.players.values()][0];
          if (next) next.isHost = true;
        }
        this.broadcast(room);
      }
    }, RECONNECT_GRACE_MS);
  }

  // ---- serialization ----------------------------------------------------

  publicState(room) {
    return {
      code: room.code,
      phase: room.phase,
      activeTeam: room.activeTeam,
      startingTeam: room.startingTeam,
      counts: room.counts,
      deadline: room.deadline,
      winner: room.winner,
      lastReason: room.lastReason,
      turnMs: room.turnMs,
      players: [...room.players.values()].map((p) => ({
        pid: p.pid, name: p.name, team: p.team, role: p.role, connected: p.connected, isHost: p.isHost,
      })),
      readiness: this.teamReadiness(room),
      // guessers never receive unrevealed colors — only the word + reveal state
      board: room.board.map((c) => ({ word: c.word, revealed: c.revealed, color: c.revealed ? c.color : null })),
      log: room.log.slice(-12),
    };
  }

  broadcast(room) {
    const state = this.publicState(room);
    this.io.to(room.code).emit('state', state);
    // artists additionally receive the secret key (full colors), like a spymaster
    const fullColors = room.board.map((c) => c.color);
    for (const p of room.players.values()) {
      if (p.connected && p.role === 'artist' && room.board.length) {
        this.io.to(p.socketId).emit('key', fullColors);
      }
    }
  }
}

module.exports = { GameServer, TURN_MS };
