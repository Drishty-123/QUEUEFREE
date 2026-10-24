import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Counter() {
  const { serviceId } = useParams();
  const toast = useToast();
  const [state, setState] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    try { setState((await client.get(`/staff/${serviceId}/console`)).data); }
    catch (err) { setError(err.message); }
  }
  useEffect(() => { load(); }, [serviceId]);

  async function act(fn, msg) {
    try { await fn(); toast(msg); load(); } catch (err) { toast(err.message, 'error'); }
  }

  if (error) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={load} /></main></div>;
  if (!state) return <div className="min-h-screen"><Navbar /><Loading label="Opening the counter…" /></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/services" className="text-sm font-bold text-neutral-400 hover:text-safety">← All queues</Link>
        <div className="mt-3 bg-board p-6 text-white">
          <p className="mono text-xs uppercase tracking-[0.3em] text-neutral-500">{state.service.name} counter</p>
          <div className="mt-2 flex items-end justify-between">
            <p className="display text-6xl">{state.current?.display || '——'}</p>
            <p className="mono text-sm text-neutral-400">{state.waiting.length} waiting</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={() => act(() => client.post(`/staff/${serviceId}/next`, {}), state.current ? 'Called next — previous closed' : 'Called next')}
            className="flex-1 border-2 border-black bg-safety py-4 text-lg font-bold uppercase text-white hover:bg-orange-700">
            Call next
          </button>
          {state.current && (
            <>
              <button onClick={() => act(() => client.patch(`/staff/tokens/${state.current._id}/complete`, {}), 'Visit completed — duration recorded')}
                className="flex-1 border-2 border-black bg-white py-4 text-lg font-bold uppercase hover:bg-neutral-100">Complete</button>
              <button onClick={() => act(() => client.patch(`/staff/tokens/${state.current._id}/no-show`, {}), 'Marked no-show')}
                className="flex-1 border-2 border-red-600 bg-red-50 py-4 text-lg font-bold uppercase text-red-700 hover:bg-red-100">No-show</button>
            </>
          )}
        </div>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="border-2 border-black">
            <p className="mono border-b-2 border-black bg-board px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">waiting ({state.waiting.length})</p>
            {state.waiting.map((t) => (
              <div key={t._id} className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 text-sm last:border-0">
                <span className="mono font-bold">{t.display}</span>
                <span className="text-neutral-500">{t.user?.name}</span>
              </div>
            ))}
            {state.waiting.length === 0 && <p className="px-4 py-6 text-center text-sm text-neutral-400">Nobody waiting.</p>}
          </div>
          <div className="border-2 border-black">
            <p className="mono border-b-2 border-black bg-board px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">recent</p>
            {state.recent.map((t) => (
              <div key={t._id} className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 text-sm last:border-0">
                <span className="mono font-bold">{t.display}</span>
                <span className={`uppercase ${t.state === 'done' ? 'text-green-600' : 'text-red-500'}`}>{t.state}{t.durationMin ? ` · ${t.durationMin}m` : ''}</span>
              </div>
            ))}
            {state.recent.length === 0 && <p className="px-4 py-6 text-center text-sm text-neutral-400">No history yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
