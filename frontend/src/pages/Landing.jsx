import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const FEATURES = [
  { icon: '📡', title: 'Live over SSE', body: 'Every call, join and no-show streams to your screen instantly. No refresh — ever.', },
  { icon: '🧮', title: 'Honest ETAs', body: 'Waits predicted from the counter’s real service-speed history, with an uncertainty band that grows with distance.', },
  { icon: '♿', title: 'Priority lane', body: 'Elderly, pregnant and accessibility tokens are called first — flagged, never hidden.', },
  { icon: '↩️', title: 'No-show grace', body: 'Missed your call? Rejoin from the board without losing your details or dignity.', },
];

const STATS = [
  ['38%', 'less time physically waiting'],
  ['±1.6m', 'typical ETA accuracy'],
  ['10', 'real service times per estimate'],
];

function BoardingPass({ className = '' }) {
  return (
    <div className={`pass w-[340px] p-5 sm:w-[380px] ${className}`} aria-hidden="true">
      <div className="flex items-center justify-between">
        <span className="chip bg-sign/15 px-2.5 py-1 font-bold text-sign">QUEUE PASS · GENERAL OPD</span>
        <span className="mono text-[10px] tracking-[0.3em] text-dim">LIVE</span>
      </div>
      <div className="mt-5 flex">
        <div className="flex-1 pr-5">
          <p className="mono text-[10px] uppercase tracking-[0.3em] text-dim">your token</p>
          <p className="mono mt-1 text-5xl font-bold tracking-tight text-ink glow-amber">A-14</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">position</p><p className="mono text-xl font-bold text-live">#3</p></div>
            <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">est. wait</p><p className="mono text-xl font-bold text-ink">~18m</p></div>
            <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">turn at</p><p className="mono text-xl font-bold text-ink">3:42 PM</p></div>
            <div><p className="mono text-[9px] uppercase tracking-[0.25em] text-dim">status</p><p className="mono text-xl font-bold text-sign">WAITING</p></div>
          </div>
        </div>
        <div className="pass-divider pl-5">
          <div className="flex h-full flex-col items-center justify-between py-1">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-signal/20 text-lg">🩺</span>
            <div className="flex flex-col items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-dim/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-dim/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-dim/60" />
            </div>
            <span className="mono rotate-90 text-[9px] tracking-[0.3em] text-dim">QF</span>
          </div>
        </div>
      </div>
      <p className="mono mt-5 border-t border-dashed border-edge/70 pt-3 text-[10px] tracking-[0.2em] text-dim">
        NOW SERVING <span className="text-sign">A-11</span> · SSE CONNECTED · UPDATES LIVE
      </p>
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="scene-grid relative min-h-screen overflow-hidden">
      {/* glow field */}
      <div className="pointer-events-none absolute -top-32 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-sign/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10rem] left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-live/10 blur-[120px]" />

      <header className="relative mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="medallion grid h-10 w-10 place-items-center"><span className="mono text-lg font-bold text-sign">Q</span></span>
          <span className="display text-lg font-bold tracking-tight">Queue<span className="text-sign">Free</span></span>
        </div>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          {user ? (
            <Link to="/services" className="btn-primary rounded-full px-6 py-2.5">Open the board</Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-5 py-2.5 text-dim transition hover:text-ink">Log in</Link>
              <Link to="/register" className="btn-primary rounded-full px-6 py-2.5 font-bold">Get started — free</Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative mx-auto max-w-6xl px-4">
        {/* ── hero ── */}
        <section className="reveal grid items-center gap-14 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="mono mb-6 inline-flex items-center gap-2 rounded-full border border-live/30 bg-live/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-live">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-live text-live" /> live token queues
            </p>
            <h1 className="display text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
              The waiting room,<br />
              <span className="text-gradient">reinvented.</span>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-dim">
              Take a numbered token and walk away. QueueFree predicts your turn from the
              counter’s <strong className="text-ink">actual pace</strong>, streams the board
              live to your phone, and calls you when it’s time.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/services" className="btn-primary rounded-full px-9 py-4 text-base font-bold">See live counters →</Link>
              <Link to="/register" className="btn-ghost rounded-full px-9 py-4 font-semibold">Create account</Link>
            </div>
            <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
              {STATS.map(([n, l]) => (
                <div key={l} className="glass-soft rounded-2xl px-4 py-4 text-center">
                  <p className="mono text-2xl font-bold text-sign">{n}</p>
                  <p className="mt-1 text-[11px] leading-tight text-dim">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3D pass stack */}
          <div className="perspective relative mx-auto flex h-[430px] w-full max-w-md items-center justify-center">
            <div className="absolute h-[340px] w-[300px] rotate-[-8deg] rounded-[22px] border border-edge/60 bg-panel/60 blur-[1px] sm:w-[330px]" style={{ transform: 'perspective(1200px) rotateY(16deg) rotateZ(-7deg) translateY(26px)' }} />
            <div className="absolute h-[340px] w-[300px] rounded-[22px] border border-edge/40 bg-panel/30 sm:w-[330px]" style={{ transform: 'perspective(1200px) rotateY(8deg) rotateZ(-3deg) translateY(10px)' }} />
            <BoardingPass className="float-3d relative z-10" />
          </div>
        </section>

        {/* ── split-flap board ── */}
        <section className="reveal glass mx-auto mb-14 max-w-2xl rounded-[28px] p-7 sm:p-9">
          <div className="flex items-center justify-between">
            <p className="mono text-[10px] uppercase tracking-[0.35em] text-dim">departure board · now serving</p>
            <span className="mono flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-live">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-live text-live" /> streaming
            </span>
          </div>
          <div className="mt-5 flex items-center justify-center gap-2.5">
            {['A', '-', '1', '4'].map((ch, i) => (
              <span key={`${ch}-${i}`} className={`digit grid place-items-center text-5xl font-bold sm:text-6xl ${ch === '-' ? 'text-dim' : 'text-sign glow-amber'}`}
                style={{ width: ch === '-' ? 28 : 58, height: 84, animationDelay: `${i * 0.1}s` }}>
                {ch}
              </span>
            ))}
          </div>
          <div className="mono mt-6 space-y-1.5 text-sm">
            {[['A-12', 'position #1 · ~6 min', 'text-live'], ['A-13', 'position #2 · ~12 min', 'text-dim'], ['B-02', 'dental · now serving', 'text-sign']].map(([tok, st, tone], i) => (
              <div key={i} className="flex items-center justify-between border-b border-dashed border-edge/60 pb-1.5">
                <span className="font-bold text-ink">{tok}</span>
                <span className={tone}>{st}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── features ── */}
        <section className="reveal grid gap-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass tilt-card rounded-3xl p-6">
              <span className="medallion grid h-11 w-11 place-items-center text-xl">{f.icon}</span>
              <h3 className="display mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dim">{f.body}</p>
            </div>
          ))}
        </section>
      </main>

      {/* ── marquee ── */}
      <div className="relative border-y border-sign/25 bg-gradient-to-r from-sign/10 via-signal/10 to-live/10 py-3">
        <div className="marquee mono gap-12 text-xs font-semibold uppercase tracking-[0.3em] text-sign/80">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-12 pr-12">
              {['NOW SERVING A-14', 'GENERAL OPD ~6 MIN', 'DENTAL ~12 MIN', 'PRIORITY LANE OPEN', 'LIVE OVER SSE', 'HONEST ETAS'].map((t) => (
                <span key={t} className="flex items-center gap-12">{t} <span className="text-signal">●</span></span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="relative py-12 text-center">
        <p className="mono text-xs uppercase tracking-[0.3em] text-dim">QueueFree — your time, tokenized</p>
      </footer>
    </div>
  );
}
