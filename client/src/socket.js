import { io } from 'socket.io-client';

// A per-tab identity so a refresh reconnects you to the same seat, while a
// second tab counts as a different player (handy for testing with friends).
function getPid() {
  let pid = sessionStorage.getItem('awf-pid');
  if (!pid) {
    pid = (crypto.randomUUID && crypto.randomUUID()) || `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('awf-pid', pid);
  }
  return pid;
}

export const pid = getPid();

// Same-origin in production; Vite proxies to :3001 in dev.
export const socket = io('/', { autoConnect: true });
