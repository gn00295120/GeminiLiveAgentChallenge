interface AudioPulseProps {
  level: number // 0 to 1
  isActive: boolean
}

export default function AudioPulse({ level, isActive }: AudioPulseProps) {
  if (!isActive) return null

  const bars = 5
  const heights = Array.from({ length: bars }, (_, i) => {
    const center = Math.abs(i - Math.floor(bars / 2))
    const base = 0.3
    const boost = level * (1 - center * 0.2)
    return Math.max(base, Math.min(1, boost))
  })

  return (
    <div className="flex items-center gap-1 h-12">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-1.5 bg-blue-500 rounded-full transition-all duration-75"
          style={{ height: `${h * 48}px` }}
        />
      ))}
      <span className="ml-3 text-sm text-slate-400">Listening...</span>
    </div>
  )
}
