import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-edge/60 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/services" className="group flex items-center gap-3">
          <span className="medallion grid h-10 w-10 place-items-center">
            <span className="mono text-lg font-bold text-sign">Q</span>
          </span>
          <span className="display text-lg font-bold tracking-tight">
            Queue<span className="text-sign">Free</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <NavLink to="/services" className={({ isActive }) => `rounded-full px-4 py-2 transition ${isActive ? 'bg-sign/15 text-sign' : 'text-dim hover:text-ink hover:bg-white/5'}`}>
            Counters
          </NavLink>
          <NavLink to="/guide" className={({ isActive }) => `rounded-full px-4 py-2 transition ${isActive ? 'bg-sign/15 text-sign' : 'text-dim hover:text-ink hover:bg-white/5'}`}>
            📖 Guide
          </NavLink>
          {user ? (
            <>
              {user?.role === 'staff' && <span className="chip hidden bg-live/15 px-2.5 py-1 font-bold text-live sm:block">STAFF</span>}
              <span className="mono hidden px-2 text-xs text-dim md:block">{user?.name}</span>
              <button onClick={() => { logout(); navigate('/'); }}
                className="btn-ghost ml-1 rounded-full px-4 py-2 text-sm font-semibold">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-dim transition hover:text-ink">Log in</Link>
              <Link to="/register" className="btn-primary rounded-full px-5 py-2 text-sm font-bold">Take a token</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
