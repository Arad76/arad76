import { memo } from 'react'

const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  top:   `${(i * 37 + 13) % 100}%`,
  left:  `${(i * 61 + 7)  % 100}%`,
  size:  i % 5 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1,
  dur:   2 + (i % 5),
  delay: (i * 0.13) % 8,
  color: i % 8 === 0 ? '#ffe082' : i % 11 === 0 ? '#c4b5fd' : 'white',
}))

const OIL_DROPS = [
  { left: '8%',  size: 10, dur: 18, delay: 0,  opacity: 0.12, color: '#f59e0b' },
  { left: '22%', size:  8, dur: 22, delay: 4,  opacity: 0.08, color: '#fbbf24' },
  { left: '45%', size: 12, dur: 16, delay: 8,  opacity: 0.10, color: '#d97706' },
  { left: '63%', size:  9, dur: 20, delay: 2,  opacity: 0.07, color: '#f59e0b' },
  { left: '78%', size: 11, dur: 24, delay: 12, opacity: 0.09, color: '#fbbf24' },
  { left: '91%', size:  8, dur: 19, delay: 6,  opacity: 0.06, color: '#d97706' },
]

export default memo(function StarfieldBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {STARS.map(s => (
        <span
          key={s.id}
          className="star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            '--star-dur':   `${s.dur}s`,
            '--star-delay': `${s.delay}s`,
            '--star-color': s.color,
          } as React.CSSProperties}
        />
      ))}
      {OIL_DROPS.map((d, i) => (
        <span
          key={i}
          className="oil-drop"
          style={{
            left: d.left,
            top: '92%',
            '--drop-dur':     `${d.dur}s`,
            '--drop-delay':   `${d.delay}s`,
            '--drop-opacity': d.opacity,
            '--drop-color':   d.color,
            '--drop-size':    `${d.size}px`,
          } as React.CSSProperties}
        >●</span>
      ))}
    </div>
  )
})
