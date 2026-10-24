import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="display text-8xl text-safety">404</p>
      <h1 className="display text-xl uppercase">Wrong counter</h1>
      <p className="text-neutral-500">The page you're looking for doesn't exist.</p>
      <Link to="/services" className="border-2 border-black bg-safety px-6 py-2.5 font-bold text-white">Back to the board</Link>
    </div>
  );
}
