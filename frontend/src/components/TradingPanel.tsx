import { fmt, riskColor, signalBg } from '../utils/format'
import type { Trade, Risk, Signal } from '../hooks/useOilData'

interface Props {
  trade: Trade
  risk: Risk
  signal: Signal
  price: number
}

export default function TradingPanel({ trade, risk, signal, price }: Props) {
  const isLong = trade.direction === 'LONG'
  const directionColor = isLong ? 'text-emerald-400' : 'text-red-400'
  const directionBg = isLong
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : 'bg-red-500/10 border-red-500/30'

  return (
    <div className="panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Trading Tool</h3>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Live • 140x Leverage
        </div>
      </div>

      {/* Direction badge */}
      <div className={`border rounded-lg p-3 ${directionBg} flex items-center justify-between`}>
        <div>
          <div className="text-xs text-gray-400 mb-0.5">Direction</div>
          <div className={`text-2xl font-black ${directionColor}`}>
            {isLong ? '▲ LONG' : '▼ SHORT'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-0.5">Entry</div>
          <div className="text-xl font-bold text-white">{fmt.price(trade.entry_price)}</div>
        </div>
      </div>

      {/* Levels grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="metric-card border border-red-900/30">
          <div className="metric-label text-red-400">Stop Loss</div>
          <div className="metric-value text-red-400">{fmt.price(trade.stop_loss)}</div>
          <div className="metric-sub text-red-500">Max loss: {fmt.usd(trade.max_loss_usd)}</div>
        </div>
        <div className="metric-card border border-emerald-900/30">
          <div className="metric-label text-emerald-400">Take Profit 1</div>
          <div className="metric-value text-emerald-400">{fmt.price(trade.take_profit_1)}</div>
          <div className="metric-sub text-emerald-500">+{fmt.usd(trade.tp1_profit_usd)}</div>
        </div>
        <div className="metric-card border border-dark-500">
          <div className="metric-label">Take Profit 2</div>
          <div className="metric-value text-emerald-300">{fmt.price(trade.take_profit_2)}</div>
          <div className="metric-sub text-emerald-600">+{fmt.usd(trade.tp2_profit_usd)}</div>
        </div>
        <div className="metric-card border border-orange-900/30">
          <div className="metric-label text-orange-400">Margin Call</div>
          <div className="metric-value text-orange-400">{fmt.price(trade.margin_call_at)}</div>
          <div className="metric-sub">Liquidation level</div>
        </div>
      </div>

      {/* Position details */}
      <div className="panel-sm space-y-2">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Position Details</div>
        {[
          ['Leverage',     `${trade.leverage}x`],
          ['Margin Used',  fmt.usd(trade.margin_used)],
          ['Position Size',fmt.usd(trade.position_size)],
          ['Contracts',    `${trade.contracts.toFixed(4)} lots`],
          ['Risk/Reward',  `1:${trade.risk_reward}`],
          ['ATR (5-min)',  `$${trade.atr.toFixed(4)}`],
          ['Pip Value',    fmt.usd(trade.pip_value)],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-white font-mono">{value}</span>
          </div>
        ))}
      </div>

      {/* Risk assessment */}
      <div className="panel-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400 uppercase tracking-wider">Risk Level</div>
          <div className={`font-bold text-sm ${riskColor(risk.risk_label)}`}>{risk.risk_label}</div>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{
              width: `${risk.risk_score}%`,
              backgroundColor: risk.risk_score > 75 ? '#ef4444' : risk.risk_score > 50 ? '#f97316' : risk.risk_score > 25 ? '#f59e0b' : '#10b981',
            }}
          />
        </div>
        {risk.advice.map((a, i) => (
          <div key={i} className="text-xs text-yellow-500/80 bg-yellow-900/20 rounded p-2 border border-yellow-900/30">
            ⚠ {a}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-gray-600 border-t border-dark-600 pt-3 leading-relaxed">
        <strong className="text-gray-500">Risk Disclaimer:</strong> 140x leverage on crude oil futures involves extreme risk.
        Past signals do not guarantee future results. This tool is for educational purposes.
        Never risk more than you can afford to lose. Always use stop-losses.
      </div>
    </div>
  )
}
