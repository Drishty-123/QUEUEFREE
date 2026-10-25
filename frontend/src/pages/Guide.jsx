import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

const CUSTOMER = [
  ['1', 'Pick a counter', 'The Counters page shows every queue live: how many are waiting, the average visit time, and whether it is open.'],
  ['2', 'Take a token', 'Open a queue and tap “Take a token”. Need priority assistance (elderly, pregnant, accessibility)? Use the green priority button — you will be called first.'],
  ['3', 'Walk away — your pass is live', 'Your boarding pass shows your position, estimated wait and the exact time your turn is expected. It updates live without refreshing.'],
  ['4', 'Head back when “almost up”', 'When you are within 2 of the counter, your pass pulses “get ready”. When NOW SERVING shows your token, go to the counter.'],
  ['5', 'Life happens', 'Leaving? Tap “Leave queue”. Missed your call? Tap “Rejoin at the back”. No shame, no lost spot history.'],
];

const STAFF = [
  ['1', 'Open the counter console', 'On the Counters page, every queue has a “🎮 Counter console” button for staff. That is your control room.'],
  ['2', 'Call next', 'The console shows who is at the counter with a big CALL NEXT button. Calling auto-closes the previous visit and records its duration — which keeps everyone’s ETA honest.'],
  ['3', 'Complete or no-show', 'Finish a visit with Complete, or mark a no-show if they vanished. Priority tokens are called before everyone else — automatically.'],
  ['4', 'Open / close the counter', 'Closing a counter instantly stops new tokens with a friendly message; reopening restores them. Insights show your no-show rate and hourly throughput.'],
];

export default function Guide() {
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const steps = isStaff ? STAFF : CUSTOMER;
  return (
    <div className="scene-grid min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <p className="mono text-[10px] font-bold uppercase tracking-[0.35em] text-live">1-minute guide</p>
        <h1 className="display mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          How Queue<span className="text-sign">Free</span> works
          <span className="text-dim"> — for {isStaff ? 'counter staff' : 'customers'}</span>
        </h1>

        <ol className="mt-10 space-y-4">
          {steps.map(([n, title, body], i) => (
            <li key={n} className="glass flex gap-5 rounded-3xl p-5" style={{ animation: `fadeUp .6s ${i * 0.07}s both` }}>
              <span className="mono grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sign text-lg font-bold text-[#1c1200]">{n}</span>
              <div>
                <h3 className="display text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-dim">{body}</p>
              </div>
            </li>
          ))}
        </ol>

        {!isStaff && (
          <div className="glass mt-8 rounded-3xl border-live/30 p-5">
            <p className="text-sm text-dim">
              💡 <strong className="text-ink">Staff?</strong> Register with the “Counter staff” option to unlock the
              console — call tokens, mark no-shows and open/close counters.
            </p>
          </div>
        )}

        <div className="mt-10 flex gap-3">
          <Link to="/services" className="btn-primary rounded-full px-7 py-3 font-bold">Go to the counters →</Link>
        </div>
      </main>
    </div>
  );
}
