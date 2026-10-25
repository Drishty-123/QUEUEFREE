import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-20 max-w-5xl items-center justify-between px-4">
        <Link to="/services" className="display text-2xl uppercase tracking-tight">Queue<span className="text-safety">Free</span></Link>
        <Link to={user ? '/services' : '/register'} className="border-2 border-black bg-safety px-6 py-2.5 text-sm font-bold uppercase text-white shadow-[5px_5px_0_0_#111] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#111]">
          {user ? 'Take a token' : 'Join now'}
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="reveal py-14 text-center sm:py-20">
          <p className="mono mx-auto mb-5 inline-block bg-safety-soft px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] text-safety">live queues · real ETAs</p>
          <h1 className="display mx-auto max-w-3xl text-6xl leading-[0.95] uppercase sm:text-8xl">
            Get a token,<br /><span className="text-safety">not a queue.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg text-neutral-600">
            Physical waiting rooms waste hours. QueueFree issues numbered tokens,
            calls the next person <strong>live</strong>, and predicts your wait from
            the counter's actual service speed.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/services" className="border-2 border-black bg-safety px-9 py-4 font-bold uppercase text-white shadow-[6px_6px_0_0_#111] transition hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0_0_#111]">See live queues →</Link>
            <Link to="/register" className="border-2 border-black bg-white px-9 py-4 font-bold uppercase shadow-[6px_6px_0_0_#ea580c] transition hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-[2px_2px_0_0_#ea580c]">Create account</Link>
          </div>
        </section>

        {/* split-flap board */}
        <section className="reveal mx-auto mb-10 max-w-2xl">
          <div className="float-3d border-4 border-black bg-board p-6 shadow-[10px_10px_0_0_#ea580c] sm:p-8">
            <p className="mono text-center text-xs uppercase tracking-[0.4em] text-neutral-500">now serving</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              {['A', '—', '1', '4'].map((ch, i) => (
                <span key={i} className="flap mono grid h-20 w-14 place-items-center rounded-lg border-2 border-neutral-700 bg-neutral-900 text-5xl font-bold text-safety sm:h-24 sm:w-18 sm:text-6xl" style={{ animationDelay: `${i * 0.12}s` }}>{ch}</span>
              ))}
            </div>
            <div className="mono mt-6 space-y-1.5 text-sm">
              {[['A-12', 'waiting · position #1 · ~6 min'], ['A-13', 'waiting · position #2 · ~12 min'], ['B-02', 'dental · now serving']].map(([tok, st], i) => (
                <div key={i} className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
                  <span className="font-bold text-white">{tok}</span>
                  <span className="text-neutral-500">{st}</span>
                </div>
              ))}
            </div>
            <p className="mono mt-4 flex items-center justify-center gap-2 text-[11px] text-neutral-500"><span className="blink-dot h-2 w-2 rounded-full bg-green-500" /> stream connected · updates over SSE</p>
          </div>
        </section>

        <section className="reveal grid gap-6 pb-16 sm:grid-cols-3">
          {[
            ['📡', 'Live board', 'Server-Sent Events push every call, join and no-show to everyone — no refresh, ever.'],
            ['🧮', 'Honest ETAs', 'Your wait = position × rolling average of the last 10 real service times, with a widening band.'],
            ['↩️', 'No-show grace', 'Missed your call? Rejoin at the back without losing your details or your dignity.'],
          ].map(([icon, t, b]) => (
            <div key={t} className="border-2 border-black bg-white p-7 shadow-[6px_6px_0_0_#111] hover-lift">
              <span className="text-3xl">{icon}</span>
              <h3 className="display mt-3 uppercase">{t}</h3>
              <p className="mt-2 text-sm text-neutral-600">{b}</p>
            </div>
          ))}
        </section>
      </main>

      <div className="border-y-4 border-black bg-board py-3">
        <div className="marquee gap-10 text-sm font-bold text-neutral-400">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex gap-10 pr-10">
              {['NOW SERVING A-14', '·', 'GENERAL OPD ~6 MIN', '·', 'DENTAL ~12 MIN', '·', 'LIVE OVER SSE', '·'].map((t, i) => (
                <span key={i} className={t === '·' ? 'text-safety' : ''}>{t}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="py-10 text-center text-sm font-bold text-neutral-400">QueueFree — departures board for waiting rooms.</footer>
    </div>
  );
}
