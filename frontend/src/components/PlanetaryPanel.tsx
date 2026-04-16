import { signalBg, fmt, scoreColor } from '../utils/format'
import type { AstroData } from '../hooks/useOilData'

interface Props { astro: AstroData }

export default function PlanetaryPanel({ astro }: Props) {
  return (
    <div className="panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>✦</span> Planetary Analysis
        </h3>
        <div className={`text-xs border px-2 py-1 rounded font-bold ${signalBg(astro.signal)}`}>
          {astro.signal}
        </div>
      </div>

      {/* Interpretation */}
      <div className="panel-sm text-xs text-gray-300 leading-relaxed italic">
        "{astro.interpretation}"
      </div>

      {/* Ascendant */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">Rising Sign:</span>
        <span className="text-white font-bold">{astro.ascendant.symbol} {astro.ascendant.sign}</span>
        <span className="text-gray-500 text-xs">{astro.ascendant.longitude.toFixed(1)}°</span>
      </div>

      {/* Planet grid */}
      <div className="space-y-1.5">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Planetary Positions</div>
        <div className="grid grid-cols-1 gap-1">
          {astro.planets.map(p => (
            <div key={p.name}
              className="flex items-center gap-2 py-1.5 px-2 rounded bg-dark-700/50 hover:bg-dark-700 transition-colors"
            >
              <span className="text-lg w-6 text-center">{p.symbol}</span>
              <span className="w-14 text-xs text-gray-300 font-medium">{p.name}</span>
              <span className="text-xs">{p.sign_symbol} {p.sign}</span>
              <span className="text-xs text-gray-500 ml-auto">{p.degree_in_sign.toFixed(1)}°</span>
              {p.retrograde && (
                <span className="text-orange-400 text-xs" title="Retrograde">℞</span>
              )}
              <div
                className="w-1.5 h-1.5 rounded-full ml-1"
                style={{ backgroundColor: p.bullish ? '#10b981' : '#ef4444' }}
                title={p.bullish ? 'Bullish for oil' : 'Bearish for oil'}
              />
              <div className="w-10 text-right text-xs font-mono" style={{ color: scoreColor(p.score) }}>
                {p.score >= 0 ? '+' : ''}{p.score.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Moon phase */}
      {astro.planets.find(p => p.name === 'Moon')?.moon_phase && (() => {
        const moon = astro.planets.find(p => p.name === 'Moon')!
        const phase = moon.moon_phase!
        const pct = phase.phase_pct
        return (
          <div className="panel-sm flex items-center gap-3">
            <div className="text-3xl">
              {pct < 12.5 ? '🌑' : pct < 37.5 ? '🌒' : pct < 62.5 ? '🌓' : pct < 87.5 ? '🌔' : pct < 112.5 ? '🌕' : pct < 137.5 ? '🌖' : pct < 162.5 ? '🌗' : '🌘'}
            </div>
            <div>
              <div className="text-xs text-gray-400">{phase.phase_name}</div>
              <div className="text-sm text-white font-medium">Moon in {moon.sign} — {phase.phase_pct.toFixed(0)}% illuminated</div>
            </div>
          </div>
        )
      })()}

      {/* Aspects */}
      {astro.aspects.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Active Aspects</div>
          {astro.aspects.slice(0, 5).map((a, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs py-1 px-2 rounded ${a.bullish ? 'bg-emerald-900/20' : 'bg-red-900/20'}`}>
              <span className="text-gray-300">{a.planet1}</span>
              <span className="text-gray-500">—</span>
              <span className={`font-medium ${a.bullish ? 'text-emerald-400' : 'text-red-400'}`}>{a.aspect}</span>
              <span className="text-gray-500">—</span>
              <span className="text-gray-300">{a.planet2}</span>
              <span className="text-gray-600 ml-auto">orb {a.orb.toFixed(1)}°</span>
              <span className="font-mono" style={{ color: scoreColor(a.score) }}>
                {a.score >= 0 ? '+' : ''}{a.score}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-600 text-right">
        Western Tropical Astrology • {fmt.time(astro.timestamp)}
      </div>
    </div>
  )
}
