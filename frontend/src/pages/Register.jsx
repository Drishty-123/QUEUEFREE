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
      toast('Account created — pick a queue!');
      navigate('/services');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 border-2 border-black p-6 text-center shadow-[6px_6px_0_0_#ea580c]">
          <h1 className="display text-2xl uppercase">Join QueueFree</h1>
          <p className="mt-1 text-sm text-neutral-500">Wait anywhere but the waiting room</p>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {[['customer', '🙋 Customer'], ['staff', '🧑‍💼 Counter staff']].map(([r, label]) => (
            <button type="button" key={r} onClick={() => setForm({ ...form, role: r })}
              className={`border-2 py-3 text-sm font-bold uppercase transition ${form.role === r ? 'border-black bg-safety text-white' : 'border-black/20 bg-white text-neutral-500 hover:border-black'}`}>
              {label}
            </button>
          ))}
        </div>
        {form.role === 'staff' && (
          <p className="mb-4 border-2 border-dashed border-safety/50 bg-safety-soft px-3 py-2 text-xs font-bold text-safety">
            Staff accounts can call tokens, mark no-shows and open/close counters.
          </p>
        )}
        <form onSubmit={submit} className="space-y-4 border-2 border-black p-6">
          {error && <p className="border-2 border-red-600 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}
          <label className="block"><span className="text-sm font-bold">Name</span>
            <input value={form.name} onChange={set('name')} className="mt-1 w-full border-2 border-black px-3 py-2.5 outline-none focus:bg-safety-soft" /></label>
          <label className="block"><span className="text-sm font-bold">Email</span>
            <input type="email" value={form.email} onChange={set('email')} className="mt-1 w-full border-2 border-black px-3 py-2.5 outline-none focus:bg-safety-soft" /></label>
          <label className="block"><span className="text-sm font-bold">Phone (optional)</span>
            <input value={form.phone} onChange={set('phone')} className="mt-1 w-full border-2 border-black px-3 py-2.5 outline-none focus:bg-safety-soft" /></label>
          <label className="block"><span className="text-sm font-bold">Password</span>
            <input type="password" value={form.password} onChange={set('password')} className="mt-1 w-full border-2 border-black px-3 py-2.5 outline-none focus:bg-safety-soft" /></label>
          <button disabled={busy} className="w-full border-2 border-black bg-safety py-2.5 font-bold text-white disabled:opacity-60">{busy ? 'Creating…' : 'Create account'}</button>
          <p className="text-center text-sm text-neutral-500">Have one? <Link to="/login" className="font-bold text-safety underline">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}
