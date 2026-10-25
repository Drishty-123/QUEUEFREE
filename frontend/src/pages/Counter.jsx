import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Counter() {
  const { serviceId } = useParams();
  const toast = useToast();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try { setState((await client.get(`/staff/${serviceId}/console`)).data); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [serviceId]);

  async function callNext() {
    try {
      const r = await client.post(`/staff/${serviceId}/next`, {});
      toast(r.body?.called ? `Called ${r.body.called.display}` : 'Nobody waiting');
      load();
    } catch (err) { toast(err.message, 'error'); }
  }
  async function act(fn, msg) {
    try { await fn(); toast(msg); load(); } catch (err) { toast(err.message, 'error'); }
  }
  async function toggleOpen() {
    try {
      const r = await client.patch(`/staff/services/${serviceId}/open`, {});
      toast(r.data.open ? 'Counter opened' : 'Counter closed — new joins blocked');
      load();
    } catch (err) { toast(err.message, 'error'); }
  }

  if (error) return <div className="scene-grid min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={load} /></main></div>;
  if (!state) return <div className="scene-grid min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-16"><div className="shimmer h-72" /></main></div>;

  const open = state.service.open;

  return (
    <div className="scene-grid min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/services" className="mono text-[10px] font-bold uppercase tracking-[0.3em] text-dim hover:text-sign">← counters</Link>

        {/* console header */}
        <section className="glass mt-4 rounded-[28px] p-7 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mono text-[10px] font-bold uppercase tracking-[0.35em] text-dim">staff console</p>
              <h1 className="display mt-1 text-3xl font-bold tracking-tight">{state.service.name}</h1>
              <p className="mono mt-2 text-xs uppercase tracking-[0.2em] text-dim">{state.waiting.length} waiting · {open ? 'accepting tokens' : 'closed'}</p>
            </div>
            <button onClick={toggleOpen}
              className={`chip border px-4 py-2 font-bold transition ${open ? 'border-live/50 bg-live/10 text-live hover:bg-live/20' : 'border-signal/50 bg-signal/10 text-[#ff9d66] hover:bg-signal/20'}`}>
              {open ? '● open — tap to close' : '○ closed — tap to open'}
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="rounded-2xl bg-void/70 p-5 text-center">
              <p className="mono text-[10px] uppercase tracking-[0.35em] text-dim">now serving</p>
              <p key={state.current?.display ?? 'none'} className="mono digit mx-auto mt-3 grid h-[76px] w-40 place-items-center text-5xl font-bold text-sign glow-amber">
                {state.current?.display || '——'}
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button onClick={callNext} className="btn-primary flex-1 rounded-2xl px-8 py-4 text-base font-bold sm:min-w-[180px]">CALL NEXT →</button>
              {state.current && (
                <div className="flex gap-2">
                  <button onClick={() => act(() => client.patch(`/staff/tokens/${state.current._id}/complete`, {}), 'Visit completed — duration recorded')}
                    className="btn-ghost flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider">Complete</button>
                  <button onClick={() => act(() => client.patch(`/staff/tokens/${state.current._id}/no-show`, {}), 'Marked no-show')}
                    className="btn-danger-ghost flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider">No-show</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* lists */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="glass-soft overflow-hidden rounded-[24px]">
            <p className="mono border-b border-edge/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-dim">waiting ({state.waiting.length})</p>
            <div className="divide-y divide-dashed divide-edge/50">
              {state.waiting.map((t) => (
                <div key={t._id} className={`flex items-center justify-between px-5 py-3.5 text-sm ${t.priority ? 'bg-live/5' : ''}`}>
                  <span className="mono font-bold">
                    {t.priority && <span className="mr-2 rounded bg-live/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-live">priority</span>}
                    <span className="text-ink">{t.display}</span>
                  </span>
                  <span className="text-dim">{t.user?.name}</span>
                </div>
              ))}
              {state.waiting.length === 0 && <p className="px-5 py-10 text-center text-sm text-dim">Nobody waiting.</p>}
            </div>
          </section>
          <section className="glass-soft overflow-hidden rounded-[24px]">
            <p className="mono border-b border-edge/60 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.3em] text-dim">recent</p>
            <div className="divide-y divide-dashed divide-edge/50">
              {state.recent.map((t) => (
                <div key={t._id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                  <span className="mono font-bold text-ink">{t.display}</span>
                  <span className={`mono text-[10px] font-bold uppercase tracking-wider ${t.state === 'done' ? 'text-live' : 'text-[#ff9d66]'}`}>
                    {t.state}{t.durationMin ? ` · ${t.durationMin}m` : ''}
                  </span>
                </div>
              ))}
              {state.recent.length === 0 && <p className="px-5 py-10 text-center text-sm text-dim">No history yet.</p>}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
