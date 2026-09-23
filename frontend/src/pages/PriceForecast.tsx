import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart2, IndianRupee, LineChart as LineChartIcon, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'

function TrendBadge({ trend }: { trend: string }) {
  const t = (trend || '').toUpperCase()
  if (t === 'RISING') {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl bg-green-100 border border-green-200 px-5 py-2 text-base font-bold text-green-700">
        <TrendingUp className="h-5 w-5" /> RISING
      </span>
    )
  }
  if (t === 'FALLING') {
    return (
      <span className="inline-flex items-center gap-2 rounded-2xl bg-red-100 border border-red-200 px-5 py-2 text-base font-bold text-red-700">
        <TrendingDown className="h-5 w-5" /> FALLING
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 border border-slate-200 px-5 py-2 text-base font-bold text-slate-600">
      STABLE
    </span>
  )
}

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-lg px-4 py-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-semibold">
          {entry.name}:{' '}
          <span>
            ₹{Number(entry.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </p>
      ))}
    </div>
  )
}

export default function PriceForecast() {
  const [crops, setCrops] = useState<any[]>([])
  const [markets, setMarkets] = useState<any[]>([])
  const [cropId, setCropId] = useState('')
  const [marketId, setMarketId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/markets')]).then(([c, m]) => {
      setCrops(c.data)
      setMarkets(m.data)
      setCropId(String(c.data.find((x: any) => x.name === 'Onion')?.id || c.data[0]?.id || ''))
      setMarketId(String(m.data[0]?.id || ''))
    })
  }, [])

  async function run() {
    setError(null)
    try {
      const { data } = await api.get('/prices/forecast', { params: { crop_id: cropId, market_id: marketId || undefined, horizon: 6 } })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Forecast failed')
    }
  }

  useEffect(() => { if (cropId) run() }, [cropId, marketId])

  const chart = useMemo(() => {
    if (!result) return []
    return [
      ...result.historical.map((p: any) => ({ date: p.period_date, historical: p.value, forecast: null })),
      ...result.forecast.map((p: any) => ({ date: p.period_date, historical: null, forecast: p.value })),
    ]
  }, [result])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-slate-700 px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl p-3">
              <IndianRupee className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Price Intelligence &amp; Mandi Forecast
              </h1>
              <p className="text-blue-200 text-sm mt-0.5">
                Baseline price trend from historical mandi statistics
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white border border-white/30">
              <BarChart2 className="h-3.5 w-3.5" />
              Historical Mandi Analogues
            </span>
            <span className="inline-flex items-center rounded-full bg-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-100 border border-indigo-300/40">
              Historical Series
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        <ErrorBox message={error} />

        {/* ── Filter Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Filters
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Crop</label>
              <select
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
              >
                {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Market</label>
              <select
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
              >
                {markets.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <button
              onClick={run}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white px-5 py-2 text-sm font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* ── Price Trend Badge ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <LineChartIcon className="h-5 w-5 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-500 mr-2">Price Trend (last vs horizon):</span>
              <TrendBadge trend={result.price_trend || ''} />
            </div>

            {/* ── Chart Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">Price Series &amp; Forecast</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" hide />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                    />
                    <Tooltip content={<PriceTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Line
                      dataKey="historical"
                      stroke="#1c7ed6"
                      strokeWidth={2}
                      name="Historical price"
                      dot={false}
                      connectNulls={false}
                    />
                    <Line
                      dataKey="forecast"
                      stroke="#c92a2a"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="Forecast"
                      dot={{ r: 4, fill: '#c92a2a' }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Forecast Table ── */}
            {result.forecast?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-sm font-semibold text-gray-600 mb-4">Upcoming Forecast Periods</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 rounded-xl">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-l-xl">
                          Date
                        </th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-r-xl">
                          Forecasted Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.forecast.map((p: any, i: number) => (
                        <tr key={p.period_date} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                          <td className="px-4 py-2.5 text-gray-700 font-medium">{p.period_date}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {Number(p.value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Model Metrics Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">Model Metrics</h2>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
                  MAE&nbsp;
                  <span className="font-bold">{result.metrics?.mae ?? 'n/a'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
                  RMSE&nbsp;
                  <span className="font-bold">{result.metrics?.rmse ?? 'n/a'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700">
                  R²&nbsp;
                  <span className="font-bold">{result.metrics?.r2 ?? 'n/a'}</span>
                </span>
              </div>
            </div>

            {/* ── Amber Disclaimer ── */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800">
              <span className="font-semibold">⚠ Disclaimer: </span>
              {result.disclaimer}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
