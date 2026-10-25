import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="scene-grid flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="perspective">
        <p className="display float-3d text-8xl font-bold text-gradient sm:text-9xl">404</p>
      </div>
      <h1 className="display text-xl font-bold">This token was never issued</h1>
      <p className="max-w-sm text-dim">The page you\u2019re looking for doesn\u2019t exist — the counter, however, is right this way.</p>
      <Link to="/services" className="btn-primary rounded-full px-8 py-3 font-bold">Back to the board</Link>
    </div>
  );
}
