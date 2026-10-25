import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast(u?.role === 'staff' ? 'Counter console ready' : 'Welcome — grab a token');
      navigate(location.state?.from?.pathname || '/services');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scene-grid relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-24 right-[-6rem] h-96 w-96 rounded-full bg-sign/15 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-8rem] left-[-6rem] h-80 w-80 rounded-full bg-live/10 blur-[110px]" />

      <div className="glass relative w-full max-w-md rounded-[28px] p-8 sm:p-10">
        <div className="text-center">
          <span className="medallion mx-auto grid h-14 w-14 place-items-center"><span className="mono text-2xl font-bold text-sign">Q</span></span>
          <h1 className="display mt-5 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mono mt-2 text-[10px] uppercase tracking-[0.3em] text-dim">customers & counter staff</p>
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {error && <p className="rounded-xl border border-signal/40 bg-signal/10 px-4 py-2.5 text-sm font-semibold text-[#ff9d66]" role="alert">{error}</p>}
          <label className="block">
            <span className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-edge/70 bg-void/70 px-4 py-3 text-ink outline-none transition focus:border-sign/70 focus:ring-2 focus:ring-sign/20" />
          </label>
          <label className="block">
            <span className="mono text-[10px] font-bold uppercase tracking-[0.25em] text-dim">Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-edge/70 bg-void/70 px-4 py-3 text-ink outline-none transition focus:border-sign/70 focus:ring-2 focus:ring-sign/20" />
          </label>
          <button disabled={busy} className="btn-primary w-full rounded-xl py-3.5 text-base font-bold disabled:opacity-70">
            {busy ? 'Checking…' : 'Log in'}
          </button>
          <p className="text-center text-sm text-dim">New here? <Link to="/register" className="font-semibold text-sign hover:underline">Take your first token</Link></p>
        </form>
        <p className="mono mt-6 rounded-xl border border-dashed border-edge/60 bg-void/40 px-4 py-2.5 text-center text-[10px] leading-relaxed tracking-wider text-dim">
          DEMO · priya@demo.com (customer) · counter@demo.com (staff) · Demo@1234
        </p>
      </div>
    </div>
  );
}
