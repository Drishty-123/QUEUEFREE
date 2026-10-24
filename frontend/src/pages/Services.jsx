import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { Loading, Empty, ErrorState } from '../components/states.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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
                </div>
                <span className="mono display grid h-14 w-14 place-items-center bg-board text-2xl text-white">{s.prefix}</span>
              </div>
              <div className="mono mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold uppercase">
                <div className="bg-neutral-100 p-2"><p className="text-lg">{s.waiting}</p><p className="text-neutral-400">waiting</p></div>
                <div className="bg-neutral-100 p-2"><p className="text-lg">{s.stats.avg}m</p><p className="text-neutral-400">avg visit</p></div>
                <div className="bg-safety-soft p-2 text-safety"><p className="text-lg">±{s.stats.std}m</p><p className="text-neutral-400">spread</p></div>
              </div>
              <Link to={`/queue/${s._id}`} className="mt-4 block border-2 border-black bg-safety py-2.5 text-center font-bold text-white hover:bg-orange-700">
                {user ? 'Open this queue' : 'Log in to join'}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
