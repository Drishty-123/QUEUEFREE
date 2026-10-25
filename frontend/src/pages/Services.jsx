import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

function Insights({ serviceId }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || data) return;
    client.get(`/services/${serviceId}/analytics`).then((r) => setData(r.data)).catch(() => {});
  }, [open, serviceId, data]);
  const maxServed = data ? Math.max(...data.hourly.map((h) => h.served), 1) : 1;
  return (
    <div className="mt-3 border-t border-dashed border-edge/60 pt-3">
      <button onClick={() => setOpen(!open)} className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim transition hover:text-sign">
        {open ? '▾ hide insights' : '▸ counter insights'}
      </button>
      {open && (
        data ? (
          <div className="mono mt-3 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-dim">
            <div className="rounded-xl bg-void/60 p-3"><p className="text-lg font-bold text-ink">{data.tokensIssued}</p>tokens</div>
            <div className="rounded-xl bg-void/60 p-3"><p className="text-lg font-bold text-signal">{data.noShowRate}%</p>no-show</div>
            <div className="rounded-xl bg-void/60 p-3"><p className="text-lg font-bold text-live">{data.avgWaitMin ?? '—'}m</p>avg wait</div>
            {data.hourly.length > 0 && (
              <div className="col-span-3 mt-1 flex h-16 items-end gap-1.5 rounded-xl bg-void/60 p-3">
                {data.hourly.map((h) => (
                  <div key={h.hour} className="flex-1 rounded-t bg-gradient-to-t from-sign/40 to-sign" style={{ height: `${(h.served / maxServed) * 100}%`, minHeight: 3 }} title={`${h.hour}:00 — ${h.served} served`} />
                ))}
              </div>
            )}
          </div>
        ) : <div className="shimmer mt-3 h-20" />
      )}
    </div>
  );
}

export default function Services() {
  const { user } = useAuth();
  const toast = useToast();
  const [services, setServices] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setError('');
    try { setServices((await client.get('/services')).data); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, []);

  async function toggle(s) {
    try {
      const r = await client.patch(`/staff/services/${s._id}/open`, { open: !s.open });
      toast(r.data.open ? `${s.name} opened` : `${s.name} closed — joins blocked`);
      load();
    } catch (err) { toast(err.message, 'error'); }
  }

  return (
    <div className="scene-grid min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="reveal">
          <p className="mono text-[10px] font-bold uppercase tracking-[0.35em] text-live"><span className="live-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-live text-live" />all systems live</p>
          <h1 className="display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Today\u2019s counters</h1>
          <p className="mt-2 max-w-lg text-dim">Pick a counter, take a token, and wait anywhere but the waiting room. Your position streams live.</p>
        </div>

        {error && <div className="mt-8"><ErrorState message={error} onRetry={load} /></div>}
        {!error && services === null && (
          <div className="mt-10 space-y-4">
            {[0, 1].map((i) => <div key={i} className="shimmer h-52" />)}
          </div>
        )}
        {!error && services !== null && services.length === 0 && (
          <div className="mt-10"><Empty title="No counters yet" hint="A staff member needs to create services first." /></div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {services?.map((s, idx) => (
            <div key={s._id} className="glass tilt-card flex flex-col rounded-[28px] p-6" style={{ animation: `fadeUp .7s ${idx * 0.1}s cubic-bezier(.2,.7,.3,1) both` }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className={`medallion grid h-14 w-14 shrink-0 place-items-center ${s.open ? '' : 'opacity-60 grayscale'}`}>
                    <span className="mono text-2xl font-bold text-sign">{s.prefix}</span>
                  </span>
                  <div>
                    <h3 className="display text-2xl font-bold tracking-tight">{s.name}</h3>
                    <p className="text-sm text-dim">{s.description}</p>
                  </div>
                </div>
                <span className={`chip shrink-0 border px-2.5 py-1 font-bold ${s.open ? 'border-live/40 bg-live/10 text-live' : 'border-signal/40 bg-signal/10 text-[#ff9d66]'}`}>
                  {s.open ? '● open' : '○ closed'}
                </span>
              </div>

              <div className="mono mt-5 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-dim">
                <div className="rounded-xl bg-void/60 p-3"><p className="text-xl font-bold text-ink">{s.waiting}</p>waiting</div>
                <div className="rounded-xl bg-void/60 p-3"><p className="text-xl font-bold text-sign">{s.stats.avg}m</p>avg visit</div>
                <div className="rounded-xl bg-void/60 p-3"><p className="text-xl font-bold text-dim">±{s.stats.std}m</p>spread</div>
              </div>

              <Insights serviceId={s._id} />

              <div className="mt-4 flex-1" />
              {user?.role === 'staff' && (
                <button onClick={() => toggle(s)}
                  className="mono mb-2 w-full rounded-full border border-dashed border-dim/40 py-2.5 text-[10px] font-bold uppercase tracking-[0.25em] text-dim transition hover:border-sign/60 hover:text-sign">
                  {s.open ? 'close counter' : 'open counter'}
                </button>
              )}
              <Link to={`/queue/${s._id}`}
                className={`rounded-full py-3.5 text-center text-sm font-bold transition ${s.open ? 'btn-primary' : 'pointer-events-none bg-edge/50 font-semibold text-dim'}`}>
                {!s.open ? 'Counter closed' : user ? 'Open this queue →' : 'Log in to join →'}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
