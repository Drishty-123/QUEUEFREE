import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function QueueAnalytics({ serviceId }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    client.get(`/services/${serviceId}/analytics`).then((r) => setData(r.data)).catch(() => {});
  }, [open, serviceId]);
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(!open)} className="mono text-[11px] font-bold uppercase text-neutral-400 hover:text-safety">
        {open ? '▾ hide insights' : '▸ insights'}
      </button>
      {open && data && (
        <div className="mono mt-2 grid grid-cols-3 gap-2 rounded-lg bg-board p-3 text-center text-[10px] uppercase text-neutral-400">
          <div><p className="text-sm text-white">{data.tokensIssued}</p>tokens</div>
          <div><p className="text-sm text-safety">{data.noShowRate}%</p>no-show</div>
          <div><p className="text-sm text-white">{data.avgWaitMin ?? '—'}m</p>avg wait</div>
        </div>
      )}
    </div>
  );
}

export default function Services() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/services').then((r) => setServices(r.data)).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="display text-4xl uppercase">Today's queues</h1>
        <p className="mt-2 text-neutral-500">Pick a counter. Your token updates live while you wait anywhere else.</p>

        {error && <div className="mt-6"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>}
        {!error && services === null && <Loading label="Reading the board…" />}
        {!error && services !== null && services.length === 0 && (
          <div className="mt-6"><Empty title="No counters configured" hint="A staff member needs to create services first." /></div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {services?.map((s) => (
            <div key={s._id} className="border-2 border-black p-6 shadow-[6px_6px_0_0_#111]">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="display text-2xl uppercase">{s.name}</h3>
                  <p className="text-sm text-neutral-500">{s.description}</p>
                  <span className={`mono mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${s.open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {s.open ? '● open' : '○ closed'}
                  </span>
                </div>
                <span className={`mono display grid h-14 w-14 place-items-center text-2xl text-white ${s.open ? 'bg-board' : 'bg-neutral-400'}`}>{s.prefix}</span>
              </div>
              <div className="mono mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase">
                <div className="bg-neutral-100 p-2"><p className="text-lg">{s.waiting}</p><p className="text-neutral-400">waiting</p></div>
                <div className="bg-neutral-100 p-2"><p className="text-lg">{s.stats.avg}m</p><p className="text-neutral-400">avg visit</p></div>
                <div className="bg-safety-soft p-2 text-safety"><p className="text-lg">±{s.stats.std}m</p><p className="text-neutral-400">spread</p></div>
              </div>
              <QueueAnalytics serviceId={s._id} />
              {user?.role === 'staff' && (
                <button onClick={async () => { try { await client.patch(`/staff/services/${s._id}/open`, { open: !s.open }); load(); } catch (err) { alert(err.message); } }}
                  className="mono mt-4 w-full border-2 border-black bg-white py-2 text-xs font-bold uppercase hover:bg-neutral-100">
                  {s.open ? 'close counter' : 'open counter'}
                </button>
              )}
              <Link to={`/queue/${s._id}`} className={`mt-2 block border-2 border-black py-2.5 text-center font-bold text-white ${s.open ? 'bg-safety hover:bg-orange-700' : 'pointer-events-none bg-neutral-300 text-neutral-500'}`}>
                {!s.open ? 'Counter closed' : user ? 'Open this queue' : 'Log in to join'}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
