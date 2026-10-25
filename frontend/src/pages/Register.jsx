import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    if (form.name.trim().length < 2) return 'Enter your name (2+ characters).';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email address.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))
      return 'Password needs 8+ characters with a letter and a number.';
    return '';
  }

  async function submit(e) {
    e.preventDefault();
    const v = validate();
    setError(v);
    if (v) return;
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast(form.role === 'staff' ? 'Staff account ready — open a counter' : 'Account created — grab a token');
      navigate('/services');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scene-grid relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-24 left-[-6rem] h-96 w-96 rounded-full bg-sign/12 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-80 w-80 rounded-full bg-live/10 blur-[110px]" />

      <div className="glass relative w-full max-w-md rounded-[28px] p-8 sm:p-10">
        <div className="text-center">
          <h1 className="display text-3xl font-bold tracking-tight">Join QueueFree</h1>
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.3em] text-dim">wait anywhere but the waiting room</p>
        </div>

        {/* role picker */}
        <div className="mt-7 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account type">
          {[['customer', '🙋', 'Customer', 'Take tokens, watch live'], ['staff', '🧑‍💼', 'Counter staff', 'Call tokens, run counters']].map(([r, icon, label, sub]) => (
            <button type="button" key={r} onClick={() => setForm({ ...form, role: r })} aria-pressed={form.role === r}
              className={`rounded-2xl border p-4 text-left transition ${form.role === r ? 'border-sign/70 bg-sign/10 shadow-[0_10px_30px_-12px_rgba(255,176,32,.45)]' : 'border-edge/60 bg-void/40 hover:border-dim/50'}`}>
              <span className="text-2xl">{icon}</span>
              <p className={`display mt-2 font-bold ${form.role === r ? 'text-sign' : 'text-ink'}`}>{label}</p>
              <p className="mt-0.5 text-[11px] leading-tight text-dim">{sub}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error && <p className="rounded-xl border border-signal/40 bg-signal/10 px-4 py-2.5 text-sm font-semibold text-[#ff9d66]" role="alert">{error}</p>}
          <label className="block">
            <span className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim">Name</span>
            <input value={form.name} onChange={set('name')} autoComplete="name"
              className="mt-1.5 w-full rounded-xl border border-edge/70 bg-void/70 px-4 py-3 text-ink outline-none transition focus:border-sign/70 focus:ring-2 focus:ring-sign/20" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim">Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email"
                className="mt-1.5 w-full rounded-xl border border-edge/70 bg-void/70 px-4 py-3 text-ink outline-none transition focus:border-sign/70 focus:ring-2 focus:ring-sign/20" />
            </label>
            <label className="block">
              <span className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim">Phone (opt.)</span>
              <input value={form.phone} onChange={set('phone')} autoComplete="tel"
                className="mt-1.5 w-full rounded-xl border border-edge/70 bg-void/70 px-4 py-3 text-ink outline-none transition focus:border-sign/70 focus:ring-2 focus:ring-sign/20" />
            </label>
          </div>
          <label className="block">
            <span className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim">Password</span>
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password"
              className="mt-1.5 w-full rounded-xl border border-edge/70 bg-void/70 px-4 py-3 text-ink outline-none transition focus:border-sign/70 focus:ring-2 focus:ring-sign/20" />
          </label>
          <button disabled={busy} className="btn-primary w-full rounded-xl py-3.5 text-base font-bold disabled:opacity-70">
            {busy ? 'Creating…' : `Create ${form.role === 'staff' ? 'staff' : 'customer'} account`}
          </button>
          <p className="text-center text-sm text-dim">Already have one? <Link to="/login" className="font-semibold text-sign hover:underline">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
