import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Queue() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [live, setLive] = useState(null);
  const [mine, setMine] = useState(undefined);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  async function loadMine() {
    try { setMine((await client.get(`/queues/${serviceId}/me`)).data); }
    catch { setMine(null); }
  }

  useEffect(() => {
    loadMine();
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5106/api').replace(/\/api$/, '');
    const es = new EventSource(`${apiUrl}/api/queues/${serviceId}/stream`);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('state', (e) => {
      try { setLive(JSON.parse(e.data)); } catch { /* ignore */ }
      loadMine();
    });
    return () => es.close();
  }, [serviceId]);

  async function join(priority = false) {
    if (!user) { toast('Log in to take a token', 'info'); return; }
    try {
      const r = await client.post(`/queues/${serviceId}/join`, { priority });
      toast(`Token ${r.data.display} issued — #${r.data.position} in line`);
      loadMine();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function leave() {
    try {
      await client.delete(`/queues/${serviceId}/me`);
      toast('You left the queue');
      loadMine();
    } catch (err) { toast(err.message, 'error'); }
  }

  async function rejoin() {
    try {
      const r = await client.post(`/queues/${serviceId}/rejoin`, {});
      toast(`Back in line as ${r.data.display}`);
      loadMine();
    } catch (err) { toast(err.message, 'error'); }
  }

  const digits = String(live?.nowServing?.display ?? '——').split('');

  return (
    <div className="scene-grid min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/services" className="mono text-[10px] font-bold uppercase tracking-[0.3em] text-dim transition hover:text-sign">← all counters</Link>

        {user?.role === 'staff' && (
          <div className="glass-soft mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-sign/30 px-5 py-3.5">
            <p className="text-sm text-dim">You are signed in as <strong className="text-sign">counter staff</strong> — manage this queue from the console.</p>
            <Link to={`/counter/${serviceId}`} className="btn-primary rounded-full px-5 py-2 text-xs font-bold">🎮 Open console →</Link>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <h1 className="display text-3xl font-bold tracking-tight sm:text-4xl">{live?.service?.name || 'Loading…'}</h1>
          <span className={`chip flex items-center gap-2 border px-3 py-1.5 font-bold ${connected ? 'border-live/40 text-live' : 'border-dim/30 text-dim'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'live-dot bg-live text-live' : 'bg-dim'}`} />
            {connected ? 'LIVE' : 'RECONNECTING'}
          </span>
        </div>

        {/* ── NOW SERVING board ── */}
        <section className="glass mt-6 rounded-[28px] p-7 text-center sm:p-9">
          <p className="mono text-[10px] uppercase tracking-[0.4em] text-dim">now serving</p>
          <div className="mt-4 flex items-center justify-center gap-2" aria-live="polite">
            {digits.map((ch, i) => (
              <span key={`${ch}-${i}-${live?.nowServing?.display ?? ''}`}
                className={`digit grid place-items-center text-4xl font-bold sm:text-5xl ${ch === '-' || ch === '—' ? 'w-7 text-dim' : 'w-12 sm:w-14'} h-[72px] ${ch === '-' || ch === '—' ? '' : 'text-sign glow-amber'}`}
                style={{ animationDelay: `${i * 0.08}s` }}>
                {ch}
              </span>
            ))}
          </div>
          <p className="mono mt-5 text-xs uppercase tracking-[0.25em] text-dim">
            {live?.waiting ?? '…'} waiting · avg visit {live?.stats?.avg ?? '–'} min
          </p>
        </section>

        {/* ── my pass ── */}
        <section className="mt-8">
          {mine === undefined && <div className="shimmer h-64" />}

          {mine === null && (
            <div className="glass tilt-card rounded-[28px] p-7 text-center">
              <p className="display text-lg font-semibold">You’re not in this queue</p>
              {live?.service?.open === false ? (
                <p className="mono mt-4 rounded-xl border border-signal/40 bg-signal/10 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#ff9d66]">counter closed — check back later</p>
              ) : (
                <>
                  <button onClick={() => join(false)} className="btn-primary mt-5 w-full rounded-full py-4 text-base font-bold">Take a token</button>
                  <button onClick={() => join(true)} className="btn-ghost mt-3 w-full rounded-full border-dashed py-3.5 text-sm font-semibold text-live transition hover:border-live/60 hover:bg-live/5">
                    ♿ Priority assistance — elderly · pregnant · accessibility
                  </button>
                </>
              )}
            </div>
          )}

          {mine && (
            <div className="pass float-3d mx-auto max-w-lg p-6 sm:p-7">
              {mine.priority && <span className="ribbon mono absolute -top-3 right-6 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">Priority</span>}
              <div className="flex items-center justify-between">
                <span className="chip bg-sign/15 px-2.5 py-1 font-bold text-sign">YOUR QUEUE PASS</span>
                <span className="mono text-[10px] tracking-[0.3em] text-dim">{mine.state === 'called' ? 'AT COUNTER' : 'WAITING'}</span>
              </div>
              <p className="mono mt-4 text-6xl font-bold tracking-tight text-ink glow-amber sm:text-7xl">{mine.display}</p>

              {mine.state === 'waiting' ? (
                mine.position <= 2 ? (
                  <p className="mono mt-4 animate-pulse text-lg font-bold uppercase tracking-[0.15em] text-live">⚡ you’re almost up — get ready</p>
                ) : (
                  <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-3">
                    <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">position</p><p className="mono text-2xl font-bold text-live">#{mine.position}</p></div>
                    <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">est. wait</p><p className="mono text-2xl font-bold text-ink">{mine.stats.minutes}m <span className="text-xs text-dim">({mine.stats.low}–{mine.stats.high})</span></p></div>
                    {mine.estimatedTurnAt && (
                      <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">turn at</p><p className="mono text-2xl font-bold text-sign">{new Date(mine.estimatedTurnAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p></div>
                    )}
                  </div>
                )
              ) : (
                <p className="display mt-4 text-2xl font-bold text-sign glow-amber">It’s your turn — head to the counter!</p>
              )}

              <div className="mt-6 flex gap-3 border-t border-dashed border-edge/70 pt-5">
                {mine.state === 'waiting' && <button onClick={leave} className="btn-danger-ghost flex-1 rounded-full py-3 text-sm font-bold">Leave queue</button>}
                {mine.state === 'waiting' && mine.position <= 2 && <span className="mono flex-1 py-3 text-center text-xs uppercase tracking-[0.2em] text-dim">stay nearby</span>}
              </div>
            </div>
          )}

          {mine?.state === 'no-show' && (
            <button onClick={rejoin} className="btn-ghost mt-3 w-full rounded-full py-3.5 text-sm font-semibold text-live">
              Missed your call? Rejoin at the back ↩
            </button>
          )}
        </section>

        {/* ── upcoming rail ── */}
        <section className="glass-soft mt-8 overflow-hidden rounded-[24px]">
          <p className="mono border-b border-edge/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-dim">upcoming tokens</p>
          <div className="divide-y divide-dashed divide-edge/50">
            {live?.board?.length ? live.board.map((t, i) => (
              <div key={t._id} className={`flex items-center justify-between px-5 py-3 text-sm transition ${t.state === 'called' ? 'bg-sign/10' : ''}`}>
                <span className="mono font-bold text-ink">
                  {t.priority && <span className="mr-2 rounded bg-live/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-live">priority</span>}
                  {t.display}
                </span>
                <span className={`mono text-[10px] font-bold uppercase tracking-[0.2em] ${t.state === 'called' ? 'text-sign' : 'text-dim'}`}>{t.state}</span>
              </div>
            )) : <p className="px-5 py-8 text-center text-sm text-dim">Queue is empty — you’d be first.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
