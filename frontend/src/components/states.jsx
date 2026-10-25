export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16" role="status" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2.5 w-2.5 animate-bounce rounded-full bg-sign" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="mono text-xs uppercase tracking-[0.25em] text-dim">{label}</p>
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="glass-soft rounded-3xl px-8 py-16 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-sign/10 text-2xl">🎫</div>
      <p className="display text-lg font-semibold text-ink">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-sm text-sm text-dim">{hint}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-signal/40 bg-signal/10 px-8 py-10 text-center" role="alert">
      <p className="display font-semibold text-signal">Something went wrong</p>
      <p className="mt-2 text-sm text-dim">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-5 rounded-full px-6 py-2 text-sm font-semibold">Retry</button>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`shimmer ${className}`} />;
}
