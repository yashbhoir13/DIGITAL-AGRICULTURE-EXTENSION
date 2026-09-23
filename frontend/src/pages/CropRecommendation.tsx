import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../services/api'
import { ErrorBox } from '../components/ui'
import { Cpu, Sparkles, BarChart2 } from 'lucide-react'

export default function CropRecommendation() {
  const [farms, setFarms] = useState<any[]>([])
  const [farmId, setFarmId] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/farms').then((r) => {
      setFarms(r.data)
      if (r.data[0]) setFarmId(String(r.data[0].id))
    })
  }, [])

  async function run() {
    if (!farmId) return
    setError(null)
    try {
      const { data } = await api.post('/recommendations/crops', { farm_id: Number(farmId) })
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Recommendation failed')
    }
  }

  useEffect(() => { run() }, [farmId])

  function suitabilityStyle(s: string) {
    if (!s) return 'bg-slate-100 text-slate-600'
    const u = s.toUpperCase()
    if (u === 'HIGH') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    if (u === 'MEDIUM') return 'bg-amber-100 text-amber-700 border border-amber-200'
    return 'bg-red-100 text-red-700 border border-red-200'
  }

  function rankColor(rank: number) {
    if (rank === 1) return 'text-emerald-500'
    if (rank === 2) return 'text-teal-400'
    if (rank === 3) return 'text-teal-300'
    return 'text-slate-400'
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-600 p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)' }} />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AI Crop Recommendation Engine</h1>
          </div>
          <p className="text-emerald-100 text-sm max-w-xl">
            Ranks crops using a combined agricultural suitability and live market scoring algorithm.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <Sparkles className="h-3 w-3" /> Agri + Market Scoring
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <BarChart2 className="h-3 w-3" /> ML Ranked
            </span>
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* ── Filter Card ── */}
      <div className="rounded-2xl bg-white shadow-md border border-slate-100 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Configure Recommendation</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Select Farm</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
            >
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <button
            onClick={run}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-emerald-700 hover:to-teal-600 transition-all"
          >
            <Sparkles className="h-4 w-4" /> Generate
          </button>
        </div>
      </div>

      {/* ── Bar Chart ── */}
      {items.length > 0 && (
        <div className="rounded-2xl bg-white shadow-md border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Combined Suitability Scores</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={items.slice(0, 8).map((i) => ({ name: i.crop_name, score: i.combined_score }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f0fdf4' }}
                />
                <Bar dataKey="score" fill="url(#emeraldGrad)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Ranked Crop Cards ── */}
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.crop_id} className="rounded-2xl bg-white shadow-md border border-slate-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex gap-5 items-start">
              {/* Rank */}
              <div className={`text-4xl font-black leading-none mt-1 ${rankColor(item.rank)} min-w-[3rem] text-center`}>
                #{item.rank}
              </div>

              <div className="flex-1 min-w-0">
                {/* Top row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-slate-800">{item.crop_name}</span>
                  <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${suitabilityStyle(item.suitability)}`}>
                    {item.suitability}
                  </span>
                  <span className="ml-auto text-sm font-bold text-emerald-600">
                    Combined: <span className="text-xl">{item.combined_score}</span>
                  </span>
                </div>

                {/* Progress bars */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Agri Score</span><span className="font-semibold text-slate-700">{item.agri_score}/100</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                        style={{ width: `${Math.min(item.agri_score, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Market Score</span><span className="font-semibold text-slate-700">{item.market_score}/100</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all"
                        style={{ width: `${Math.min(item.market_score, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                <ul className="text-sm text-slate-600 list-disc pl-4 space-y-0.5">
                  {item.reasons.map((r: string, idx: number) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
