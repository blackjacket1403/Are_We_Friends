const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { GameServer } = require('./game');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

const game = new GameServer(io);

// Health check for Render.
app.get('/healthz', (_req, res) => res.json({ ok: true, rooms: game.rooms.size }));

// Serve the built client (produced by `npm run build`).
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));

io.on('connection', (socket) => {
  socket.on('createRoom', (payload, ack) => {
    try {
      const code = game.createRoom(socket, payload || {});
      if (typeof ack === 'function') ack({ code });
    } catch (e) {
      if (typeof ack === 'function') ack({ error: 'Could not create a room. Try again.' });
    }
  });

  socket.on('joinRoom', (payload, ack) => {
    const result = game.joinRoom(socket, payload || {});
    if (typeof ack === 'function') ack(result);
  });

  socket.on('setSeat', (payload) => game.setSeat(socket, payload || {}));
  socket.on('startGame', () => game.startGame(socket));
  socket.on('draw', (stroke) => game.draw(socket, stroke));
  socket.on('requestSync', () => game.requestSync(socket));
  socket.on('clearCanvas', () => game.clearCanvas(socket));
  socket.on('guess', (payload) => game.guess(socket, payload || {}));
  socket.on('endTurn', () => game.endTurn(socket));
  socket.on('playAgain', () => game.playAgain(socket));
  socket.on('backToLobby', () => game.backToLobby(socket));
  socket.on('disconnect', () => game.disconnect(socket));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Are We Friends? listening on :${PORT}`);
});
