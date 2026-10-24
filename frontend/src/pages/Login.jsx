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
      toast(u.role === 'staff' ? 'Counter console ready' : 'Welcome — grab a token');
      navigate(location.state?.from?.pathname || (u.role === 'staff' ? '/services' : '/services'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 border-2 border-black p-6 text-center shadow-[6px_6px_0_0_#111]">
          <h1 className="display text-2xl uppercase">Log in</h1>
          <p className="mt-1 text-sm text-neutral-500">Customers and counter staff</p>
        </div>
        <form onSubmit={submit} className="space-y-4 border-2 border-black p-6 shadow-[6px_6px_0_0_#ea580c]">
          {error && <p className="border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
          <label className="block"><span className="text-sm font-bold">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email"
              className="mt-1 w-full border-2 border-black px-3 py-2.5 outline-none focus:bg-safety-soft" /></label>
          <label className="block"><span className="text-sm font-bold">Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password"
              className="mt-1 w-full border-2 border-black px-3 py-2.5 outline-none focus:bg-safety-soft" /></label>
          <button disabled={busy} className="w-full border-2 border-black bg-safety py-2.5 font-bold text-white hover:bg-orange-700 disabled:opacity-60">{busy ? 'Checking…' : 'Log in'}</button>
          <p className="text-center text-sm text-neutral-500">New? <Link to="/register" className="font-bold text-safety underline">Take your first token</Link></p>
        </form>
        <p className="mt-4 text-center text-xs text-neutral-400">Demo: priya@demo.com (customer) · counter@demo.com (staff) · Demo@1234</p>
      </div>
    </div>
  );
}
