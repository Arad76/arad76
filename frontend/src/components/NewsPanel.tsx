import { signalBg, scoreColor, fmt } from '../utils/format'
import type { NewsData } from '../hooks/useOilData'

interface Props { news: NewsData }

const PLATFORM_ICONS: Record<string, string> = {
  'Twitter/X': '𝕏',
  'YouTube':   '▶',
  'Reddit':    '●',
  'Instagram': '◉',
}

export default function NewsPanel({ news }: Props) {
  const total = news.bullish_count + news.bearish_count
  const bullishPct = total > 0 ? Math.round(news.bullish_count / total * 100) : 50

  return (
    <div className="panel space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>◉</span> News & Social Sentiment
        </h3>
        <div className={`text-xs border px-2 py-1 rounded font-bold ${signalBg(news.signal)}`}>
          {news.signal}
        </div>
      </div>

      {/* Sentiment bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-400">Bearish ({news.bearish_count})</span>
          <span className="font-mono" style={{ color: scoreColor(news.aggregate_score) }}>
            Score: {news.aggregate_score >= 0 ? '+' : ''}{news.aggregate_score.toFixed(1)}
          </span>
          <span className="text-emerald-400">Bullish ({news.bullish_count})</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-dark-700">
          <div className="bg-red-600/70 transition-all" style={{ width: `${100 - bullishPct}%` }} />
          <div className="bg-emerald-600/70 transition-all" style={{ width: `${bullishPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-0.5">
          <span>{100 - bullishPct}%</span>
          <span>{bullishPct}%</span>
        </div>
      </div>

      {/* Top themes */}
      {news.top_themes.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Top Themes</div>
          <div className="flex flex-wrap gap-1.5">
            {news.top_themes.map(t => (
              <div
                key={t.theme}
                className="text-xs px-2 py-1 rounded border flex items-center gap-1"
                style={{
                  backgroundColor: t.bullish_pct > 50 ? '#065f4630' : '#7f1d1d30',
                  borderColor:     t.bullish_pct > 50 ? '#10b98140' : '#ef444440',
                  color:           t.bullish_pct > 50 ? '#34d399' : '#f87171',
                }}
              >
                {t.theme}
                <span className="text-gray-500">({t.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social media */}
      {news.social?.platforms && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Social Media</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(news.social.platforms).map(([platform, data]) => (
              <div key={platform} className="panel-sm flex items-center gap-2">
                <span className="text-lg">{PLATFORM_ICONS[platform] || '◆'}</span>
                <div className="min-w-0">
                  <div className="text-xs text-gray-400 truncate">{platform}</div>
                  <div className="text-sm font-bold" style={{ color: scoreColor(data.score) }}>
                    {data.score >= 0 ? '+' : ''}{data.score.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {data.trending || data.top_topic || data.sentiment_shift || ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-gray-500">Social Overall</span>
            <span className={`font-bold border px-2 py-0.5 rounded ${signalBg(news.social.signal)}`}>
              {news.social.signal} ({news.social.overall_score >= 0 ? '+' : ''}{news.social.overall_score.toFixed(0)})
            </span>
          </div>
        </div>
      )}

      {/* News headlines */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Latest Headlines</div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {news.articles.map(a => (
            <div key={a.id} className={`text-xs rounded px-2 py-2 border ${
              a.sentiment === 'bullish'
                ? 'bg-emerald-900/20 border-emerald-900/30'
                : 'bg-red-900/20 border-red-900/30'
            }`}>
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 text-base shrink-0 ${a.sentiment === 'bullish' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {a.sentiment === 'bullish' ? '▲' : '▼'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 leading-snug line-clamp-2">{a.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <span>{a.source}</span>
                    <span>•</span>
                    <span>{fmt.ago(a.age_minutes)}</span>
                    {a.simulated && <span className="text-gray-700">[sim]</span>}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-xs" style={{ color: scoreColor(a.score) }}>
                  {a.score >= 0 ? '+' : ''}{a.score.toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
