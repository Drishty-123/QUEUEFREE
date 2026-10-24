import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Queue() {
  const { serviceId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [live, setLive] = useState(null);
  const [mine, setMine] = useState(undefined); // undefined = not loaded yet
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const esRef = useRef(null);

  async function loadMine() {
    try { setMine((await client.get(`/queues/${serviceId}/me`)).data); }
    catch { setMine(null); }
  }

  useEffect(() => {
    loadMine();
    const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5106/api').replace(/\/api$/, '');
    const es = new EventSource(`${apiUrl}/api/queues/${serviceId}/stream`);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('state', (e) => {
      try { setLive(JSON.parse(e.data)); } catch { /* ignore */ }
    });
    return () => es.close();
  }, [serviceId]);

  async function join() {
    if (!user) { toast('Log in to take a token', 'info'); return; }
    try {
      const r = await client.post(`/queues/${serviceId}/join`, {});
      toast(`Token ${r.data.display} issued — you're #${r.data.position} in line`);
      loadMine();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function leave() {
    try {
      await client.delete(`/queues/${serviceId}/me`);
      toast('You left the queue');
      loadMine();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function rejoin() {
    try {
      const r = await client.post(`/queues/${serviceId}/rejoin`, {});
      toast(`Back in line as ${r.data.display}`);
      loadMine();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  if (error) return <div className="min-h-screen"><Navbar /><main className="mx-auto max-w-4xl px-4 py-10"><ErrorState message={error} onRetry={() => window.location.reload()} /></main></div>;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/services" className="text-sm font-bold text-neutral-400 hover:text-safety">← All queues</Link>
        <div className="mt-3 flex items-center justify-between">
          <h1 className="display text-4xl uppercase">{live?.service?.name || 'Queue'}</h1>
          <span className={`mono rounded-full px-3 py-1 text-xs font-bold uppercase ${connected ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-400'}`}>
            {connected ? '● live' : '○ connecting'}
          </span>
        </div>

        {/* Now serving board */}
        <section className="mt-6 bg-board p-8 text-center text-white shadow-lg">
          <p className="mono text-xs uppercase tracking-[0.3em] text-neutral-500">now serving</p>
          <p className={`display mt-2 text-7xl ${live ? 'blink' : ''}`} key={live?.nowServing?.display}>
            {live?.nowServing?.display || '——'}
          </p>
          <p className="mono mt-2 text-sm text-neutral-400">{live?.waiting ?? '…'} waiting · avg visit {live?.stats?.avg ?? '–'} min</p>
        </section>

        {/* My token */}
        <section className="mt-6">
          {mine === undefined && <Loading label="Checking your token…" />}
          {mine === null && (
            <div className="border-2 border-black p-6 text-center shadow-[6px_6px_0_0_#ea580c]">
              <p className="font-bold">You're not in this queue.</p>
              <button onClick={join} className="mt-3 w-full border-2 border-black bg-safety py-3 font-bold text-white hover:bg-orange-700">Take a token</button>
            </div>
          )}
          {mine && (
            <div className={`border-2 border-black p-6 text-center shadow-[6px_6px_0_0_#111] ${mine.state === 'called' ? 'bg-safety-soft' : ''}`}>
              <p className="mono text-xs uppercase tracking-widest text-neutral-400">your token</p>
              <p className="display text-6xl">{mine.display}</p>
              {mine.state === 'waiting' ? (
                <>
                  <p className="mt-2 text-lg font-bold">Position #{mine.position}</p>
                  <p className="text-sm text-neutral-500">
                    estimated wait <strong>{mine.stats.minutes} min</strong> (range {mine.stats.low}–{mine.stats.high})
                  </p>
                </>
              ) : (
                <p className="mt-2 text-lg font-bold text-safety">It's your turn — head to the counter!</p>
              )}
              <div className="mt-4 flex gap-2">
                {mine.state === 'waiting' && (
                  <button onClick={leave} className="flex-1 border-2 border-black py-2.5 text-sm font-bold hover:bg-black hover:text-white">Leave queue</button>
                )}
                {mine.state === 'called' && <p className="flex-1 py-2 text-sm font-bold">Show this number at the counter.</p>}
              </div>
            </div>
          )}
          {mine?.state === 'no-show' && (
            <button onClick={rejoin} className="mt-3 w-full border-2 border-black bg-safety-soft py-2.5 text-sm font-bold hover:bg-safety hover:text-white">
              Missed your call? Rejoin at the back
            </button>
          )}
        </section>

        {/* Live board rows */}
        <section className="mt-8 overflow-hidden border-2 border-black">
          <div className="flex bg-board px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
            <span className="flex-1">token</span><span className="flex-1">status</span>
          </div>
          {live?.board?.length ? live.board.map((t, i) => (
            <div key={t._id} className={`flex items-center px-4 py-2.5 text-sm ${t.state === 'called' ? 'bg-safety-soft font-bold' : i % 2 ? 'bg-neutral-50' : ''}`}>
              <span className="mono flex-1 font-bold">{t.display}</span>
              <span className={`flex-1 uppercase ${t.state === 'called' ? 'text-safety' : 'text-neutral-500'}`}>{t.state}</span>
            </div>
          )) : <p className="px-4 py-6 text-center text-sm text-neutral-400">Queue is empty.</p>}
        </section>
      </main>
    </div>
  );
}
