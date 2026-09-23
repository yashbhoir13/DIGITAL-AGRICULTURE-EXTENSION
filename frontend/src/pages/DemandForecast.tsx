import { useEffect, useMemo, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart2, LineChart as LineChartIcon, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'

export default function DemandForecast() {
  const [crops, setCrops] = useState<any[]>([])
  const [regions, setRegions] = useState<any[]>([])
  const [cropId, setCropId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/regions')]).then(([c, r]) => {
      setCrops(c.data)
      setRegions(r.data)
      setCropId(String(c.data.find((x: any) => x.name === 'Tomato')?.id || c.data[0]?.id || ''))
      setRegionId(String(r.data[0]?.id || ''))
    })
  }, [])

  async function run() {
    setError(null)
    try {
      const { data } = await api.get('/demand/forecast', { params: { crop_id: cropId, region_id: regionId || undefined, horizon: 6 } })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Forecast failed')
    }
  }

  useEffect(() => { if (cropId) run() }, [cropId, regionId])

  const chart = useMemo(() => {
    if (!result) return []
    return [
      ...result.historical.map((p: any) => ({ date: p.period_date, historical: p.value, forecast: null })),
      ...result.forecast.map((p: any) => ({ date: p.period_date, historical: null, forecast: p.value })),
    ]
  }, [result])

  const lastHistorical = result?.historical?.at(-1)?.value ?? null
  const latestForecast = result?.forecast?.[0]?.value ?? null
  const isTrendingUp = latestForecast !== null && lastHistorical !== null && latestForecast >= lastHistorical

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-emerald-800 via-green-700 to-lime-700 px-6 py-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl p-3">
              <LineChartIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Demand Intelligence &amp; ML Forecast
              </h1>
              <p className="text-emerald-100 text-sm mt-0.5">
                Baseline Ridge + lag features trained on historical series
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white border border-white/30">
              <BarChart2 className="h-3.5 w-3.5" />
              Ridge Regression Model
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-100 border border-emerald-300/40">
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
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[160px]"
                value={cropId}
                onChange={(e) => setCropId(e.target.value)}
              >
                {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">Region</label>
              <select
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[160px]"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <button
              onClick={run}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-5 py-2 text-sm font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Forecast
            </button>
          </div>
        </div>

        {result && (
          <>
            {/* ── Stats Row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className="bg-emerald-50 rounded-xl p-3">
                  <BarChart2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Historical</p>
                  <p className="text-2xl font-bold text-gray-800 mt-0.5">
                    {lastHistorical !== null ? Number(lastHistorical).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                <div className={`rounded-xl p-3 ${isTrendingUp ? 'bg-orange-50' : 'bg-red-50'}`}>
                  {isTrendingUp
                    ? <TrendingUp className="h-6 w-6 text-orange-500" />
                    : <TrendingDown className="h-6 w-6 text-red-500" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Latest Forecast</p>
                  <p className={`text-2xl font-bold mt-0.5 ${isTrendingUp ? 'text-orange-600' : 'text-red-600'}`}>
                    {latestForecast !== null ? Number(latestForecast).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Chart Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">Demand Series &amp; Forecast</h2>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" hide />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                    <Line
                      dataKey="historical"
                      stroke="#2f9e44"
                      strokeWidth={2}
                      name="Historical demand"
                      connectNulls={false}
                      dot={false}
                    />
                    <Line
                      dataKey="forecast"
                      stroke="#e67700"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      name="Forecast"
                      connectNulls={false}
                      dot={{ r: 4, fill: '#e67700' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Model Metrics Card ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-600 mb-4">Model Metrics</h2>
              <p className="text-xs text-gray-400 mb-3">
                Model: <span className="font-medium text-gray-600">{result.model_name}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
                  MAE&nbsp;
                  <span className="font-bold">{result.metrics?.mae ?? 'n/a'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-100 px-4 py-1.5 text-sm font-semibold text-purple-700">
                  RMSE&nbsp;
                  <span className="font-bold">{result.metrics?.rmse ?? 'n/a'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
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
