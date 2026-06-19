# Are We Friends? 🕵️‍♀️✎

A real-time party game that mashes up **Codenames** and **Skribbl**. Four friends split into two teams. Each team has one **artist** who secretly knows the key, and one **guesser** who doesn't. The twist: the artist can only **draw** — no words, no letters, no talking — to lead their partner to the right words on a shared 5×5 board.

Find your team's words before the other team finds theirs. Touch the **assassin** card and it's over instantly… *are we still friends?*

## How it plays

1. One person **starts a room** and shares the 4-letter code (or the invite link).
2. Friends **join**, pick a team (Cyan / Coral) and a role (Artist / Guesser).
3. Each team needs **one artist + one guesser** — so the full game is **4 players**.
4. The host starts. Teams alternate **3-minute turns**:
   - The active **artist** sees the colour key and draws clues on a shared canvas.
   - Their **guesser** watches the live sketch and taps words on the board.
   - Right word → keep going. Neutral card or the opponent's card → turn ends.
   - **Assassin** card → the drawing team loses immediately.
5. First team to find **all** of their words wins.

The board has 9 cards for the starting team, 8 for the other, 7 neutral bystanders, and 1 assassin.

## Tech

- **Server:** Node + Express + Socket.IO — authoritative game state, per-room turn timers, anti-cheat (guessers never receive unrevealed card colours).
- **Client:** React + Vite, hand-rolled canvas drawing synced over WebSockets.
- **One service:** the server serves the built client, so it's a single deploy.

## Run it locally

```bash
npm install          # server deps
npm run build        # installs + builds the client into client/dist
npm start            # serves everything on http://localhost:3001
```

Open a few browser tabs (or share over your LAN) and play. Each tab is a separate player.

### Dev mode (hot reload)

```bash
npm install
npm run dev          # server on :3001, Vite client on :5173 (proxied)
```

Then open http://localhost:5173.

## Deploy to Render

This repo ships a `render.yaml` blueprint.

1. Push to GitHub.
2. On [render.com](https://render.com) → **New → Blueprint** → pick this repo.
3. Render runs `npm install && npm run build`, then `npm start`. You get a public URL to share. Done.

Render's free tier supports the WebSocket connection the game needs.

## License

MIT
