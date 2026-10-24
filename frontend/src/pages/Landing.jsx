import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/services" className="display text-xl uppercase">Queue<span className="text-safety">Free</span></Link>
        <Link to={user ? '/services' : '/register'} className="rounded-full bg-safety px-5 py-2 text-sm font-bold text-white">{user ? 'Take a token' : 'Join now'}</Link>
      </header>
      <main className="mx-auto max-w-5xl px-4">
        <section className="py-20 text-center">
          <p className="mono mx-auto mb-4 w-fit rounded-full bg-safety-soft px-4 py-1 text-xs font-bold uppercase tracking-widest text-safety">live queues · real ETAs</p>
          <h1 className="display mx-auto max-w-3xl text-6xl leading-none uppercase">
            Get a token,<br />not a queue.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-600">
            Physical waiting rooms waste hours. QueueFree issues numbered tokens,
            calls the next person live, and predicts your wait from the counter's
            actual service speed — not guesswork.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            <Link to="/services" className="rounded-full bg-safety px-8 py-3 font-bold text-white shadow-lg shadow-orange-200">See live queues</Link>
            <Link to="/register" className="rounded-full border-2 border-black px-8 py-3 font-bold hover:bg-black hover:text-white">Create account</Link>
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {[
            ['Live board', 'Server-Sent Events push every call, join and no-show to everyone instantly — no refresh.'],
            ['Honest ETAs', 'Your wait = your position × the rolling average of the last 10 real service times.'],
            ['No-show grace', 'Missed your call? Rejoin from the board without losing your details or your dignity.'],
          ].map(([t, b]) => (
            <div key={t} className="rounded-2xl border-2 border-black p-6 shadow-[6px_6px_0_0_#111]">
              <h3 className="display uppercase">{t}</h3>
              <p className="mt-2 text-sm text-neutral-600">{b}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t-4 border-board py-6 text-center text-sm font-bold text-neutral-400">QueueFree — departures board for waiting rooms.</footer>
    </div>
  );
}
