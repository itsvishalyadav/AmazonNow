import './index.css'

function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-black"
          style={{ backgroundColor: 'var(--amazon-orange)', color: 'var(--amazon-navy)' }}
        >
          A
        </div>
        <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--amazon-text)' }}>
          Amazon <span style={{ color: 'var(--amazon-orange)' }}>Now</span>
        </span>
      </div>

      {/* Tag line */}
      <p className="text-center text-sm" style={{ color: 'var(--amazon-muted)' }}>
        Delivery is fast. Now shopping is too.
      </p>

      {/* Status badge */}
      <div
        className="px-4 py-2 rounded-full text-xs font-semibold tracking-wide"
        style={{
          background: 'rgba(61, 220, 132, 0.15)',
          border: '1px solid rgba(61, 220, 132, 0.3)',
          color: 'var(--amazon-success)',
        }}
      >
        ✓ Phase 0 — Scaffold running
      </div>

      <p className="text-xs text-center" style={{ color: 'var(--amazon-muted)' }}>
        Frontend: React + Vite + Tailwind v4 &nbsp;·&nbsp; Backend: Express + TypeScript on port 4000
      </p>
    </div>
  )
}

export default App
