import { signalBg, scoreColor, fmt } from '../utils/format'
import type { Signal } from '../hooks/useOilData'

interface Props {
  signal: Signal
  price: number
}

const SPARK_ANGLES = [0, 60, 120, 180, 240, 300]

export default function SignalDisplay({ signal, price }: Props) {
  const pct = Math.abs(signal.composite_score)
  const barWidth = `${pct}%`
  const barColor = scoreColor(signal.composite_score)
  const isPositive = signal.composite_score >= 0
  const isStrong = signal.signal === 'STRONG BUY' || signal.signal === 'STRONG SELL'
  const sparkColor = signal.signal === 'STRONG BUY' ? '#34d399' : '#f87171'

  return (
    <div className="panel space-y-4">
      {/* Main signal */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">5-Min Signal</div>
          <div className={isStrong ? 'sparkle-container' : ''}>
            {isStrong && SPARK_ANGLES.map((angle, i) => (
              <span
                key={i}
                className="sparkle-ray"
                style={{
                  '--angle':       `${angle}deg`,
                  '--spark-delay': `${i * 0.26}s`,
                  '--spark-color': sparkColor,
                } as React.CSSProperties}
              >✦</span>
            ))}
            <div className={`text-3xl font-black tracking-tight border px-4 py-2 rounded-lg ${signalBg(signal.signal)}`}>
              {signal.signal}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-gray-400 text-xs mb-1">Composite Score</div>
          <div className="text-4xl font-black" style={{ color: barColor }}>
            {fmt.score(signal.composite_score)}
          </div>
          <div className="text-gray-400 text-xs mt-1">{signal.confidence_label} Confidence ({signal.confidence}%)</div>
        </div>
      </div>

      {/* Score bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>SELL</span>
          <span>NEUTRAL</span>
          <span>BUY</span>
        </div>
        <div className="relative h-3 bg-dark-700 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full bg-gradient-to-l from-transparent to-red-900/40" />
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent to-emerald-900/40" />
          </div>
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-600" />
          <div
            className="absolute top-0.5 h-2 rounded-full transition-all duration-500"
            style={{
              width: barWidth,
              left: isPositive ? '50%' : undefined,
              right: isPositive ? undefined : `${50 + pct / 2}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
      </div>

      {/* Component breakdown */}
      <div className="space-y-2">
        <div className="text-gray-400 text-xs uppercase tracking-wider">Signal Breakdown</div>
        {signal.components.map(c => (
          <div key={c.label} className="flex items-center gap-2">
            <div className="w-28 text-xs text-gray-400 truncate">{c.label}</div>
            <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.abs(c.score))}%`,
                  backgroundColor: scoreColor(c.score),
                  marginLeft: c.score < 0 ? 'auto' : undefined,
                }}
              />
            </div>
            <div className="w-14 text-right text-xs font-mono" style={{ color: scoreColor(c.score) }}>
              {fmt.score(c.score)}
            </div>
          </div>
        ))}
      </div>

      {/* Expected move */}
      <div className="panel-sm flex items-center justify-between">
        <span className="text-gray-400 text-xs">Expected 5-min Move</span>
        <span className="font-mono text-sm font-bold" style={{ color: barColor }}>
          {signal.expected_move_pct >= 0 ? '+' : ''}{(signal.expected_move_pct * 100).toFixed(3)}%
          {' '}(~${Math.abs(signal.expected_move_pct * price).toFixed(3)})
        </span>
      </div>

      <div className="text-xs text-gray-600 text-right">
        Valid until {fmt.time(new Date(new Date(signal.timestamp).getTime() + 5 * 60000).toISOString())}
      </div>
    </div>
  )
}
