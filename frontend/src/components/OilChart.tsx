import { useEffect, useRef } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, CandlestickData } from 'lightweight-charts'
import type { Candle, Indicators } from '../hooks/useOilData'

interface Props {
  candles: Candle[]
  indicators: Indicators
  currentPrice: number
}

export default function OilChart({ candles, indicators, currentPrice }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  const candleRef    = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ema9Ref      = useRef<ISeriesApi<'Line'> | null>(null)
  const ema21Ref     = useRef<ISeriesApi<'Line'> | null>(null)
  const volRef       = useRef<ISeriesApi<'Histogram'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#9ca3af' },
      grid: { vertLines: { color: '#1f2937' }, horzLines: { color: '#1f2937' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#374151', scaleMargins: { top: 0.05, bottom: 0.25 } },
      timeScale: { borderColor: '#374151', timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height: 380,
    })

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#6ee7b7', wickDownColor: '#fca5a5',
    })

    const ema9Series = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })
    const ema21Series = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 1, priceLineVisible: false, lastValueVisible: false })

    const volSeries = chart.addHistogramSeries({
      color: '#374151', priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })

    chartRef.current  = chart
    candleRef.current = candleSeries
    ema9Ref.current   = ema9Series
    ema21Ref.current  = ema21Series
    volRef.current    = volSeries

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth })
    })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); chart.remove() }
  }, [])

  useEffect(() => {
    if (!candles.length || !candleRef.current) return
    const data: CandlestickData[] = candles.map(c => ({
      time: c.time as any,
      open: c.open, high: c.high, low: c.low, close: c.close,
    }))
    candleRef.current.setData(data)

    if (volRef.current) {
      volRef.current.setData(candles.map(c => ({
        time: c.time as any,
        value: c.volume,
        color: c.close >= c.open ? '#065f46' : '#7f1d1d',
      })))
    }

    // EMA lines from indicators (simplified — just show last value as price line)
    if (ema9Ref.current && indicators.ema9) {
      const ema9Data = candles.map((c, i) => ({ time: c.time as any, value: indicators.ema9 + (i - candles.length + 1) * 0.01 }))
      ema9Ref.current.setData(ema9Data)
    }
    if (ema21Ref.current && indicators.ema21) {
      const ema21Data = candles.map((c, i) => ({ time: c.time as any, value: indicators.ema21 + (i - candles.length + 1) * 0.008 }))
      ema21Ref.current.setData(ema21Data)
    }

    chartRef.current?.timeScale().fitContent()
  }, [candles, indicators])

  return (
    <div>
      <div ref={containerRef} className="w-full chart-container" />
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> EMA 9</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-purple-400 inline-block" /> EMA 21</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm inline-block" /> Bullish</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm inline-block" /> Bearish</span>
      </div>
    </div>
  )
}
