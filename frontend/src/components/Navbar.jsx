import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b-4 border-board bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/services" className="display text-xl uppercase tracking-tight">
          Queue<span className="text-safety">Free</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-bold">
          <Link to="/services" className="rounded-full px-3 py-2 hover:text-safety">Queues</Link>
          {user ? (
            <>
              {user.role === 'staff' && <span className="mono rounded bg-board px-2 py-1 text-[10px] uppercase text-white">staff</span>}
              <button onClick={() => { logout(); navigate('/services'); }} className="rounded-full border-2 border-black px-4 py-1.5 hover:bg-black hover:text-white">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 hover:text-safety">Log in</Link>
              <Link to="/register" className="rounded-full bg-safety px-4 py-2 text-white hover:bg-orange-700">Take a token</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
