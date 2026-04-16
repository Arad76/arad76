import { useState } from 'react'
import { useOilData } from './hooks/useOilData'
import OilChart from './components/OilChart'
import SignalDisplay from './components/SignalDisplay'
import TradingPanel from './components/TradingPanel'
import PlanetaryPanel from './components/PlanetaryPanel'
import NumerologyPanel from './components/NumerologyPanel'
import NewsPanel from './components/NewsPanel'
import IndicatorsBar from './components/IndicatorsBar'
import StarfieldBackground from './components/StarfieldBackground'
import { fmt, signalBg } from './utils/format'

type Tab = 'chart' | 'signal' | 'trade' | 'astro' | 'numerology' | 'news'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'chart',     label: 'Chart',      icon: '📈' },
  { id: 'signal',    label: 'Signal',     icon: '⚡' },
  { id: 'trade',     label: 'Trade',      icon: '💼' },
  { id: 'astro',     label: 'Astrology',  icon: '✦' },
  { id: 'numerology',label: 'Numerology', icon: '◈' },
  { id: 'news',      label: 'News',       icon: '◉' },
]

export default function App() {
  const { data, connected, error } = useOilData()
  const [tab, setTab] = useState<Tab>('chart')
  const [now, setNow] = useState(new Date())

  // Update clock
  useState(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  })

  const signalColor = data?.signal.color || '#f59e0b'

  return (
    <div
      className="min-h-screen bg-dark-900 text-gray-100 flex flex-col relative overflow-hidden"
      style={{ '--signal-color': signalColor } as React.CSSProperties}
    >
      <StarfieldBackground />

      {/* Header */}
      <header className="border-b border-dark-600 bg-dark-800/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛢</span>
              <div>
                <div className="text-lg font-black tracking-tight text-white">
                  OIL<span className="text-amber-400">ORACLE</span>
                </div>
                <div className="text-xs text-gray-500">WTI Crude · 5-Min Prediction System</div>
              </div>
            </div>

            {/* Live price ticker */}
            {data && (
              <div className="hidden md:flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-gray-500">WTI Crude Oil</div>
                  <div className="text-2xl font-black text-white">{fmt.price(data.price.price)}</div>
                  <div className={`text-xs font-mono ${data.price.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {data.price.change >= 0 ? '▲' : '▼'} {Math.abs(data.price.change_pct).toFixed(4)}%
                  </div>
                </div>
                <div
                  className={`text-lg font-black border-2 px-4 py-2 rounded-xl ${signalBg(data.signal.signal)}`}
                  style={{ borderColor: signalColor + '80' }}
                >
                  {data.signal.signal}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-500">UTC</div>
                <div className="text-sm font-mono text-white">{now.toUTCString().slice(17, 25)}</div>
              </div>
              <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border ${
                connected
                  ? 'text-emerald-400 border-emerald-900/50 bg-emerald-900/20'
                  : 'text-red-400 border-red-900/50 bg-red-900/20'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {connected ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-900/30 rounded px-3 py-1.5">
              {error} — Make sure the backend is running on port 8000.
            </div>
          )}
        </div>
        <div className="aurora-bar" />
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden border-b border-dark-600 bg-dark-800 sticky top-[73px] z-40">
        <div className="flex overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      {!data ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl animate-spin">🛢</div>
            <div className="text-xl font-bold text-amber-400">Connecting to OilOracle...</div>
            <div className="text-gray-500 text-sm">
              {error
                ? 'Backend unreachable. Start the Python backend on port 8000.'
                : 'Establishing real-time connection...'}
            </div>
            <div className="text-xs text-gray-600 max-w-sm">
              Run: <code className="bg-dark-700 px-2 py-0.5 rounded">cd backend && uvicorn main:app --reload</code>
            </div>
          </div>
        </div>
      ) : (
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4">

          {/* Desktop: full layout */}
          <div className="hidden md:grid grid-cols-12 gap-4">

            {/* Left column: chart + indicators */}
            <div className="col-span-8 space-y-4">
              <IndicatorsBar indicators={data.indicators} price={data.price} />
              <div className="panel">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-white">WTI Crude Oil · 5-Min Chart</div>
                  <div className="text-xs text-gray-500">{data.candles.length} candles · 140x leverage mode</div>
                </div>
                <OilChart candles={data.candles} indicators={data.indicators} currentPrice={data.price.price} />
              </div>

              {/* Bottom row: signal + news */}
              <div className="grid grid-cols-2 gap-4">
                <SignalDisplay signal={data.signal} price={data.price.price} />
                <NewsPanel news={data.news} />
              </div>
            </div>

            {/* Right column: trade + astro + numerology */}
            <div className="col-span-4 space-y-4">
              <TradingPanel trade={data.trade} risk={data.risk} signal={data.signal} price={data.price.price} />
              <PlanetaryPanel astro={data.astro} />
              <NumerologyPanel numerology={data.numerology} />
            </div>
          </div>

          {/* Mobile: tabbed layout */}
          <div className="md:hidden">
            {tab === 'chart' && (
              <div className="space-y-4">
                <IndicatorsBar indicators={data.indicators} price={data.price} />
                <div className="panel">
                  <OilChart candles={data.candles} indicators={data.indicators} currentPrice={data.price.price} />
                </div>
              </div>
            )}
            {tab === 'signal' && <SignalDisplay signal={data.signal} price={data.price.price} />}
            {tab === 'trade'  && <TradingPanel trade={data.trade} risk={data.risk} signal={data.signal} price={data.price.price} />}
            {tab === 'astro'  && <PlanetaryPanel astro={data.astro} />}
            {tab === 'numerology' && <NumerologyPanel numerology={data.numerology} />}
            {tab === 'news'   && <NewsPanel news={data.news} />}
          </div>

        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-dark-600 bg-dark-800/50 py-3 px-4 text-center">
        <div className="text-xs text-gray-600">
          OilOracle v1.0 — AI + Astrology + Numerology + News Sentiment · WTI Crude Oil ·
          {' '}<span className="text-amber-700">Educational purposes only. Not financial advice.</span>
        </div>
      </footer>
    </div>
  )
}
