import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket.js';

const COLORS = ['#1b1b1b', '#29d7de', '#ff6f61', '#3ad17a', '#ffd34d', '#8a6cff'];
const SIZES = [1.1, 2.2, 4.2, 7];

export default function Canvas({ canDraw }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const dimRef = useRef({ w: 0, h: 0 });
  const strokesRef = useRef([]); // every segment this turn, for redraw on resize
  const drawingRef = useRef(false);
  const lastRef = useRef(null);

  const [color, setColor] = useState('#1b1b1b');
  const [size, setSize] = useState(2.2);
  const [erase, setErase] = useState(false);
  // keep tool choices readable by the (non-reactive) pointer handlers
  const toolRef = useRef({ color, size, erase });
  useEffect(() => { toolRef.current = { color, size, erase }; }, [color, size, erase]);

  const drawSeg = (seg) => {
    const ctx = ctxRef.current;
    const { w, h } = dimRef.current;
    if (!ctx || !w) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = (seg.size / 100) * Math.min(w, h);
    if (seg.mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = seg.color;
    }
    const p = seg.points;
    ctx.beginPath();
    ctx.moveTo(p[0][0] * w, p[0][1] * h);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0] * w, p[i][1] * h);
    if (p.length === 1) ctx.lineTo(p[0][0] * w + 0.01, p[0][1] * h + 0.01);
    ctx.stroke();
    ctx.restore();
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const { w, h } = dimRef.current;
    if (ctx) ctx.clearRect(0, 0, w, h);
  };
  const redrawAll = () => {
    clearCanvas();
    for (const seg of strokesRef.current) drawSeg(seg);
  };

  const setupSize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctxRef.current = ctx;
    dimRef.current = { w: rect.width, h: rect.height };
    redrawAll();
  };

  useEffect(() => {
    setupSize();
    const ro = new ResizeObserver(setupSize);
    if (canvasRef.current) ro.observe(canvasRef.current);

    const onDraw = (seg) => { strokesRef.current.push(seg); drawSeg(seg); };
    const onClear = () => { strokesRef.current = []; clearCanvas(); };
    const onSync = (segs) => { strokesRef.current = Array.isArray(segs) ? segs.slice() : []; redrawAll(); };

    socket.on('draw', onDraw);
    socket.on('clear', onClear);
    socket.on('canvasSync', onSync);
    socket.emit('requestSync');

    return () => {
      ro.disconnect();
      socket.off('draw', onDraw);
      socket.off('clear', onClear);
      socket.off('canvasSync', onSync);
    };
  }, []);

  // local pointer drawing (artist only)
  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return [
      Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    ];
  };

  const start = (e) => {
    if (!canDraw) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const pt = pos(e);
    lastRef.current = pt;
    const t = toolRef.current;
    const seg = { color: t.color, size: t.size, mode: t.erase ? 'erase' : 'pen', points: [pt] };
    strokesRef.current.push(seg);
    drawSeg(seg);
    socket.emit('draw', seg);
  };
  const move = (e) => {
    if (!canDraw || !drawingRef.current) return;
    e.preventDefault();
    const pt = pos(e);
    const t = toolRef.current;
    const seg = { color: t.color, size: t.size, mode: t.erase ? 'erase' : 'pen', points: [lastRef.current, pt] };
    lastRef.current = pt;
    strokesRef.current.push(seg);
    drawSeg(seg);
    socket.emit('draw', seg);
  };
  const end = () => { drawingRef.current = false; lastRef.current = null; };

  const onClearClick = () => {
    if (!canDraw) return;
    strokesRef.current = [];
    clearCanvas();
    socket.emit('clearCanvas');
  };

  return (
    <>
      <div className={`paper-frame ${canDraw ? '' : 'readonly'}`}>
        {!canDraw && <span className="watch-note">watching your artist…</span>}
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />
      </div>

      {canDraw && (
        <div className="tools">
          <div className="swatches">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${!erase && color === c ? 'on' : ''}`}
                style={{ background: c }}
                aria-label={`pen colour ${c}`}
                onClick={() => { setColor(c); setErase(false); }}
              />
            ))}
          </div>
          <div className="sizes">
            {SIZES.map((s) => (
              <button key={s} className={`size-dot ${!erase && size === s ? 'on' : ''}`} aria-label={`brush size ${s}`} onClick={() => { setSize(s); setErase(false); }}>
                <i style={{ width: `${4 + s * 1.6}px`, height: `${4 + s * 1.6}px` }} />
              </button>
            ))}
          </div>
          <div className="tool-spacer" />
          <button className={`btn btn-sm ${erase ? 'btn-cyan' : 'btn-ghost'}`} onClick={() => setErase((v) => !v)}>Eraser</button>
          <button className="btn btn-ghost btn-sm" onClick={onClearClick}>Clear</button>
        </div>
      )}
    </>
  );
}
