export const fmt = {
  price: (v: number) => `$${v.toFixed(2)}`,
  pct:   (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`,
  score: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}`,
  usd:   (v: number) => `$${v.toFixed(2)}`,
  time:  (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  date:  (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  ago:   (mins: number) => mins < 1 ? 'just now' : mins < 60 ? `${Math.round(mins)}m ago` : `${Math.round(mins/60)}h ago`,
}

export function signalClass(signal: string): string {
  if (signal.includes('STRONG BUY'))  return 'signal-strong-buy'
  if (signal.includes('BUY'))         return 'signal-buy'
  if (signal.includes('NEUTRAL'))     return 'signal-neutral'
  if (signal.includes('STRONG SELL')) return 'signal-strong-sell'
  if (signal.includes('SELL'))        return 'signal-sell'
  return 'text-gray-400'
}

export function signalBg(signal: string): string {
  if (signal.includes('STRONG BUY'))  return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
  if (signal.includes('BUY'))         return 'bg-green-500/20 border-green-500/50 text-green-400'
  if (signal.includes('NEUTRAL'))     return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
  if (signal.includes('STRONG SELL')) return 'bg-red-600/20 border-red-600/50 text-red-400'
  if (signal.includes('SELL'))        return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
  return 'bg-gray-500/20 border-gray-500/50 text-gray-400'
}

export function scoreColor(score: number): string {
  if (score > 40)  return '#10b981'
  if (score > 15)  return '#34d399'
  if (score > -15) return '#f59e0b'
  if (score > -40) return '#f97316'
  return '#ef4444'
}

export function riskColor(label: string): string {
  switch (label) {
    case 'LOW':      return 'text-emerald-400'
    case 'MODERATE': return 'text-yellow-400'
    case 'HIGH':     return 'text-orange-400'
    case 'EXTREME':  return 'text-red-500'
    default: return 'text-gray-400'
  }
}
