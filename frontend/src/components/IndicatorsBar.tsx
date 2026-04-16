import type { Indicators, PriceTick } from '../hooks/useOilData'
import { fmt, scoreColor } from '../utils/format'

interface Props { indicators: Indicators; price: PriceTick }

export default function IndicatorsBar({ indicators, price }: Props) {
  const rsiColor = indicators.rsi14 > 70 ? '#ef4444' : indicators.rsi14 < 30 ? '#10b981' : '#f59e0b'
  const macdColor = indicators.macd_hist > 0 ? '#10b981' : '#ef4444'
  const trendColor = indicators.trend === 'BULLISH' ? '#10b981' : indicators.trend === 'BEARISH' ? '#ef4444' : '#f59e0b'

  return (
    <div className="panel">
      <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
        {/* Price */}
        <div>
          <div className="text-xs text-gray-500">WTI Crude</div>
          <div className="text-2xl font-black text-white">{fmt.price(price.price)}</div>
          <div className={`text-xs font-mono ${price.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {price.change >= 0 ? '+' : ''}{price.change.toFixed(4)} ({price.change_pct >= 0 ? '+' : ''}{price.change_pct.toFixed(4)}%)
          </div>
        </div>

        <div className="w-px h-10 bg-dark-600 hidden sm:block" />

        {/* Session */}
        <div>
          <div className="text-xs text-gray-500">Session</div>
          <div className="text-sm font-bold text-amber-400">{price.session}</div>
        </div>

        <div className="w-px h-10 bg-dark-600 hidden sm:block" />

        {/* RSI */}
        <div>
          <div className="text-xs text-gray-500">RSI(14)</div>
          <div className="text-sm font-bold" style={{ color: rsiColor }}>
            {indicators.rsi14?.toFixed(1) || '--'}
          </div>
          <div className="text-xs text-gray-600">
            {indicators.rsi14 > 70 ? 'Overbought' : indicators.rsi14 < 30 ? 'Oversold' : 'Neutral'}
          </div>
        </div>

        {/* MACD */}
        <div>
          <div className="text-xs text-gray-500">MACD Hist</div>
          <div className="text-sm font-bold" style={{ color: macdColor }}>
            {indicators.macd_hist >= 0 ? '+' : ''}{indicators.macd_hist?.toFixed(4) || '--'}
          </div>
          <div className="text-xs text-gray-600">{indicators.macd_hist > 0 ? 'Bullish' : 'Bearish'}</div>
        </div>

        {/* EMA */}
        <div>
          <div className="text-xs text-gray-500">EMA 9/21</div>
          <div className="text-sm font-bold text-amber-300">
            {indicators.ema9?.toFixed(2) || '--'} / {indicators.ema21?.toFixed(2) || '--'}
          </div>
          <div className="text-xs" style={{ color: trendColor }}>{indicators.trend || '--'}</div>
        </div>

        {/* Bollinger */}
        <div>
          <div className="text-xs text-gray-500">BB Bands</div>
          <div className="text-sm font-bold text-gray-300">
            {indicators.bb_upper?.toFixed(2) || '--'} / {indicators.bb_lower?.toFixed(2) || '--'}
          </div>
          <div className={`text-xs ${
            indicators.price_vs_bb === 'OVERBOUGHT' ? 'text-red-400' :
            indicators.price_vs_bb === 'OVERSOLD'   ? 'text-emerald-400' : 'text-gray-600'
          }`}>{indicators.price_vs_bb || '--'}</div>
        </div>

        {/* ATR */}
        <div>
          <div className="text-xs text-gray-500">ATR(14)</div>
          <div className="text-sm font-bold text-purple-400">{indicators.atr?.toFixed(4) || '--'}</div>
          <div className="text-xs text-gray-600">volatility</div>
        </div>
      </div>
    </div>
  )
}
