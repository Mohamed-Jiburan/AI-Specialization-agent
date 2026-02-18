export default function FeasibilityGauge({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)))
  const angle = (v / 100) * 180

  return (
    <div className="relative w-full max-w-[260px]">
      <div className="h-24 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-40 w-40 -translate-x-1/2 rounded-full border border-slate-200 bg-white" />
        <div
          className="absolute left-1/2 top-24 h-40 w-40 -translate-x-1/2 rounded-full"
          style={{
            background:
              'conic-gradient(from 180deg, rgba(37,99,235,0.0) 0deg, rgba(37,99,235,0.0) 180deg, rgba(37,99,235,0.90) 180deg, rgba(14,165,233,0.90) 360deg)'
          }}
        />
        <div
          className="absolute left-1/2 top-24 h-40 w-40 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(255,255,255,1)_60%)]"
          style={{ transform: 'translateX(-50%) scale(0.86)' }}
        />

        <div
          className="absolute left-1/2 top-24 h-20 w-1 -translate-x-1/2 origin-bottom rounded-full bg-slate-900"
          style={{ transform: `translateX(-50%) rotate(${angle - 90}deg)` }}
        />
      </div>
      <div className="mt-2 text-center">
        <div className="text-lg font-semibold text-slate-900">{v.toFixed(1)}%</div>
      </div>
    </div>
  )
}
