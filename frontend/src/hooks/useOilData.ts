import { useState, useEffect, useRef, useCallback } from 'react'

export interface PriceTick {
  price: number
  timestamp: string
  session: string
  change: number
  change_pct: number
}

export interface Candle {
  time: number
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Indicators {
  ema9: number; ema21: number; ema50: number
  rsi14: number; bb_upper: number; bb_middle: number; bb_lower: number
  macd_line: number; macd_signal: number; macd_hist: number
  atr: number; trend: string; price_vs_bb: string
}

export interface SignalComponent {
  label: string; score: number; weight: number; contribution: number
}

export interface Signal {
  composite_score: number; signal: string; color: string
  confidence: number; confidence_label: string
  expected_move_pct: number; components: SignalComponent[]
  timestamp: string; valid_for_minutes: number
}

export interface Trade {
  direction: string; entry_price: number; stop_loss: number
  take_profit_1: number; take_profit_2: number
  leverage: number; margin_used: number; position_size: number
  contracts: number; risk_reward: number
  max_loss_usd: number; tp1_profit_usd: number; tp2_profit_usd: number
  margin_call_at: number; pip_value: number; atr: number
}

export interface Risk {
  risk_score: number; risk_label: string; advice: string[]
  max_concurrent_trades: number; suggested_margin: number
}

export interface PlanetData {
  name: string; symbol: string; sign: string; sign_symbol: string
  longitude: number; degree_in_sign: number
  retrograde: boolean; bullish: boolean; score: number
  moon_phase?: { phase_pct: number; phase_name: string }
}

export interface AstroData {
  timestamp: string
  planets: PlanetData[]
  aspects: Array<{ planet1: string; planet2: string; aspect: string; orb: number; score: number; bullish: boolean }>
  ascendant: { sign: string; symbol: string; longitude: number }
  raw_score: number; signal: string; interpretation: string
}

export interface NumerologyNumber {
  label: string; number: number; energy: string; color: string; oil_bias: number
}

export interface NumerologyData {
  timestamp: string
  numbers: NumerologyNumber[]
  universal_day: number; moment_number: number; unix_numerology: number
  cycle_position: number; fib_resonant: boolean
  special_patterns: string[]
  raw_score: number; signal: string; interpretation: string
}

export interface Article {
  id: string; title: string; source: string
  sentiment: string; score: number; timestamp: string
  age_minutes: number; simulated: boolean
}

export interface NewsData {
  aggregate_score: number; signal: string
  bullish_count: number; bearish_count: number
  top_themes: Array<{ theme: string; count: number; bullish_pct: number }>
  social: {
    platforms: Record<string, { score: number; volume?: number; trending?: string; views_24h?: number; top_topic?: string; posts?: number; sentiment_shift?: string; engagement?: number }>
    overall_score: number; signal: string
  }
  articles: Article[]
}

export interface OilUpdate {
  type: string
  timestamp: string
  price: PriceTick
  candles: Candle[]
  indicators: Indicators
  signal: Signal
  trade: Trade
  risk: Risk
  astro: AstroData
  numerology: NumerologyData
  news: NewsData
}

const WS_URL = `ws://${window.location.hostname}:8000/ws`

export function useOilData() {
  const [data, setData] = useState<OilUpdate | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (mountedRef.current) { setConnected(true); setError(null) }
      }
      ws.onmessage = (e) => {
        if (!mountedRef.current) return
        try {
          const parsed = JSON.parse(e.data)
          if (parsed.type === 'update') setData(parsed)
        } catch { /* ignore malformed */ }
      }
      ws.onclose = () => {
        if (!mountedRef.current) return
        setConnected(false)
        reconnectTimer.current = setTimeout(connect, 3000)
      }
      ws.onerror = () => {
        if (!mountedRef.current) return
        setError('WebSocket connection failed — retrying...')
        ws.close()
      }
    } catch {
      setError('Cannot connect to backend')
      reconnectTimer.current = setTimeout(connect, 5000)
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { data, connected, error }
}
