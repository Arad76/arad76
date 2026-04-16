import { signalBg, scoreColor, fmt } from '../utils/format'
import type { NumerologyData } from '../hooks/useOilData'

interface Props { numerology: NumerologyData }

const NUMBER_SYMBOLS = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨']
const CYCLE_LABELS = ['', 'Initiation', 'Building', 'Expression', 'Foundation', 'Change',
                      'Harmony', 'Reflection', 'Power', 'Completion']

export default function NumerologyPanel({ numerology }: Props) {
  return (
    <div className="panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>◈</span> Numerology Engine
        </h3>
        <div className={`text-xs border px-2 py-1 rounded font-bold ${signalBg(numerology.signal)}`}>
          {numerology.signal}
        </div>
      </div>

      {/* Interpretation */}
      <div className="panel-sm text-xs text-gray-300 leading-relaxed italic">
        "{numerology.interpretation}"
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 gap-2">
        <div className="metric-card items-center text-center">
          <div className="metric-label">Moment #</div>
          <div className="text-3xl font-black text-white num-float">{numerology.moment_number}</div>
          <div className="text-gray-600 text-xs">vibration</div>
        </div>
        <div className="metric-card items-center text-center">
          <div className="metric-label">Universal Day</div>
          <div className="text-3xl font-black text-amber-400 num-float" style={{ animationDelay: '1s' }}>{numerology.universal_day}</div>
          <div className="text-gray-600 text-xs">day number</div>
        </div>
        <div className="metric-card items-center text-center">
          <div className="metric-label">9-Year Cycle</div>
          <div className="text-3xl font-black text-purple-400 num-float" style={{ animationDelay: '2s' }}>{numerology.cycle_position}</div>
          <div className="text-gray-600 text-xs">{CYCLE_LABELS[numerology.cycle_position] || ''}</div>
        </div>
      </div>

      {/* Number breakdown */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Time Numerology</div>
        {numerology.numbers.map((n, index) => (
          <div key={n.label} className="flex items-center gap-2 py-1.5 px-2 rounded bg-dark-700/50">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-sm font-black shrink-0 num-circle"
              style={{
                backgroundColor: n.color + '30',
                color: n.color,
                border: `1px solid ${n.color}60`,
                '--num-color': n.color,
                '--num-delay': `${index * 0.3}s`,
              } as React.CSSProperties}
            >
              {n.number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-300">{n.label}</span>
                <span className="text-xs font-mono" style={{ color: scoreColor(n.oil_bias * 100) }}>
                  {n.oil_bias >= 0 ? '+' : ''}{(n.oil_bias * 100).toFixed(0)}
                </span>
              </div>
              <div className="text-xs text-gray-600 truncate">{n.energy}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Special patterns */}
      {numerology.special_patterns.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Special Patterns</div>
          {numerology.special_patterns.map((p, i) => (
            <div key={i} className="text-xs text-amber-400 bg-amber-900/20 border border-amber-900/30 rounded px-2 py-1.5">
              ✦ {p}
            </div>
          ))}
        </div>
      )}

      {/* Fibonacci */}
      {numerology.fib_resonant && (
        <div className="text-xs text-purple-400 bg-purple-900/20 border border-purple-900/30 rounded px-2 py-1.5">
          🌀 Fibonacci resonance detected — amplified market potential
        </div>
      )}

      {/* Unix numerology */}
      <div className="panel-sm flex justify-between text-xs">
        <span className="text-gray-500">Unix Timestamp Vibration</span>
        <span className="text-white font-bold">{numerology.unix_numerology}</span>
      </div>

      <div className="text-xs text-gray-600 text-right">
        Pythagorean System • {fmt.time(numerology.timestamp)}
      </div>
    </div>
  )
}
