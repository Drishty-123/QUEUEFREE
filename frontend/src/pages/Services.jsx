import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// per-counter accent so the board reads as a colorful wall, not one color
const ACCENTS = [
  { band: 'from-sign/25', dot: 'bg-sign', stat: 'text-sign' },
  { band: 'from-live/20', dot: 'bg-live', stat: 'text-live' },
  { band: 'from-violet-400/20', dot: 'bg-violet-400', stat: 'text-violet-300' },
  { band: 'from-rose-400/20', dot: 'bg-rose-400', stat: 'text-rose-300' },
];

function HowItWorks({ role }) {
  const isStaff = role === 'staff';
  const steps = isStaff
    ? [['🎮', 'Open the counter console', 'Your control room: call next, complete visits, mark no-shows'],
       ['📣', 'Call next', 'Priority tokens first — each call records the visit duration for honest ETAs'],
       ['🚪', 'Open / close the counter', 'Closing instantly stops new tokens; insights track your throughput']]
    : [['1️⃣', 'Pick a counter', 'Live waiting counts and average visit times on every card'],
       ['2️⃣', 'Take a token', 'Your boarding pass shows position, ETA and your exact turn time'],
       ['3️⃣', 'Come back when it pulses', '“Almost up” flashes when you are second in line — then walk over']];
  return (
    <div className="glass-soft mt-8 grid gap-4 rounded-3xl p-5 sm:grid-cols-3">
      <p className="mono col-span-full text-[10px] font-bold uppercase tracking-[0.3em] text-dim">
        {isStaff ? 'running a counter' : 'how it works'} · <Link to="/guide" className="text-sign underline decoration-dotted">full guide →</Link>
      </p>
      {steps.map(([icon, t, b], i) => (
        <div key={t} className="flex gap-3" style={{ animation: `fadeUp .6s ${i * 0.08}s both` }}>
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-sm font-bold">{t}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-dim">{b}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  const isStaff = user?.role === 'staff';

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
    <div className="scene-grid relative min-h-screen">
      {/* ambient color field so the logged-in board feels alive, not one color */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-[24rem] w-[24rem] rounded-full bg-sign/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-6rem] top-1/3 h-[20rem] w-[20rem] rounded-full bg-live/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-[22rem] w-[22rem] rounded-full bg-violet-500/10 blur-[120px]" />

      <Navbar />
      <main className="relative mx-auto max-w-5xl px-4 py-10">
        <div className="reveal">
          <p className="mono text-[10px] font-bold uppercase tracking-[0.35em] text-live">
            <span className="live-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-live text-live" />all systems live
          </p>
          <h1 className="display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            {isStaff ? 'Your counters, chief.' : 'Today\u2019s counters'}
          </h1>
          <p className="mt-2 max-w-lg text-dim">
            {isStaff ? 'Open a console to call tokens — or flip a counter open/closed right here.' : 'Pick a counter, take a token, and wait anywhere but the waiting room.'}
          </p>
        </div>

        <HowItWorks role={user?.role} />

        {error && <div className="mt-8"><ErrorState message={error} onRetry={load} /></div>}
        {!error && services === null && (
          <div className="mt-10 space-y-4">{[0, 1].map((i) => <div key={i} className="shimmer h-52" />)}</div>
        )}
        {!error && services !== null && services.length === 0 && (
          <div className="mt-10"><Empty title="No counters yet" hint="A staff member needs to create services first." /></div>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {services?.map((s, idx) => {
            const accent = ACCENTS[idx % ACCENTS.length];
            return (
              <div key={s._id} className="glass tilt-card relative flex flex-col overflow-hidden rounded-[28px]" style={{ animation: `fadeUp .7s ${idx * 0.1}s cubic-bezier(.2,.7,.3,1) both` }}>
                {/* accent header band */}
                <div className={`bg-gradient-to-r ${accent.band} to-transparent px-6 pb-4 pt-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className={`medallion grid h-14 w-14 shrink-0 place-items-center ${s.open ? '' : 'opacity-60 grayscale'}`}>
                        <span className={`mono text-2xl font-bold ${accent.stat}`}>{s.prefix}</span>
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
                  {s.open && s.waiting > 0 && (
                    <span className="mono mt-3 inline-flex items-center gap-2 rounded-full bg-void/70 px-3 py-1 text-[11px] font-bold text-sign">
                      <span className="live-dot h-1.5 w-1.5 rounded-full bg-sign text-sign" />{s.waiting} waiting now
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col px-6 pb-6">
                  <div className="mono mt-2 grid grid-cols-3 gap-2 text-center text-[10px] uppercase tracking-wider text-dim">
                    <div className="rounded-xl bg-void/60 p-3"><p className={`text-xl font-bold ${accent.stat}`}>{s.waiting}</p>waiting</div>
                    <div className="rounded-xl bg-void/60 p-3"><p className="text-xl font-bold text-ink">{s.stats.avg}m</p>avg visit</div>
                    <div className="rounded-xl bg-void/60 p-3"><p className="text-xl font-bold text-dim">±{s.stats.std}m</p>spread</div>
                  </div>

                  <Insights serviceId={s._id} />
                  <div className="flex-1" />

                  <div className="mt-4 space-y-2">
                    {isStaff ? (
                      <>
                        <Link to={`/counter/${s._id}`} className="btn-primary block rounded-full py-3.5 text-center text-sm font-bold">
                          🎮 Counter console — call next →
                        </Link>
                        <div className="flex gap-2">
                          <button onClick={() => toggle(s)}
                            className="mono flex-1 rounded-full border border-dashed border-dim/40 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-dim transition hover:border-sign/60 hover:text-sign">
                            {s.open ? 'close counter' : 'open counter'}
                          </button>
                          <Link to={`/queue/${s._id}`} className="mono flex-1 rounded-full border border-dashed border-dim/40 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-dim transition hover:border-sign/60 hover:text-sign">
                            customer view
                          </Link>
                        </div>
                      </>
                    ) : (
                      <Link to={`/queue/${s._id}`}
                        className={`block rounded-full py-3.5 text-center text-sm font-bold transition ${s.open ? 'btn-primary' : 'pointer-events-none bg-edge/50 font-semibold text-dim'}`}>
                        {!s.open ? 'Counter closed' : 'Open this queue →'}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
