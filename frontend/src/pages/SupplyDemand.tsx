import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../services/api'
import { ErrorBox, StatusBadge } from '../components/ui'
import { AlertTriangle, AlertCircle, CheckCircle, Info, TrendingUp } from 'lucide-react'

export default function SupplyDemand() {
  const [crops, setCrops] = useState<any[]>([])
  const [regions, setRegions] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [cropId, setCropId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [farmId, setFarmId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/regions'), api.get('/farms')]).then(([c, r, f]) => {
      setCrops(c.data); setRegions(r.data); setFarms(f.data)
      setCropId(String(c.data.find((x: any) => x.name === 'Strawberry')?.id || c.data[0]?.id))
      setRegionId(String(f.data[0]?.region_id || r.data[0]?.id))
      if (f.data[0]) setFarmId(String(f.data[0].id))
    })
  }, [])

  async function run() {
    setError(null)
    try {
      const { data } = await api.post('/supply-demand/analyze', {
        crop_id: Number(cropId),
        region_id: Number(regionId),
        farm_id: farmId ? Number(farmId) : null,
      })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Analysis failed')
    }
  }

  useEffect(() => { if (cropId && regionId) run() }, [cropId, regionId, farmId])

  // Determine status banner styles
  const getStatusConfig = (status: string) => {
    const s = (status || '').toUpperCase()
    if (s.includes('SURPLUS'))
      return {
        bg: 'from-amber-500 to-orange-500',
        border: 'border-amber-400',
        text: 'text-white',
        icon: <AlertTriangle className="w-8 h-8 text-white" />,
        label: 'SURPLUS',
      }
    if (s.includes('DEFICIT') || s.includes('SHORTAGE'))
      return {
        bg: 'from-red-600 to-rose-700',
        border: 'border-red-500',
        text: 'text-white',
        icon: <AlertCircle className="w-8 h-8 text-white" />,
        label: 'DEFICIT',
      }
    return {
      bg: 'from-emerald-500 to-green-600',
      border: 'border-emerald-400',
      text: 'text-white',
      icon: <CheckCircle className="w-8 h-8 text-white" />,
      label: 'BALANCED',
    }
  }

  return (
    <div className="space-y-6">
      {/* Dark Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-800 px-8 py-8 shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #5eead4 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <TrendingUp className="w-7 h-7 text-teal-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Supply-Demand Intelligence</h1>
              <p className="text-teal-200 text-sm mt-0.5">Compare expected production with predicted demand</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-400/20 border border-teal-400/40 px-4 py-1.5 text-xs font-semibold text-teal-300 uppercase tracking-widest backdrop-blur-sm self-start sm:self-auto">
            Market Analysis
          </span>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* Filter Card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Configure Analysis</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Crop</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
            >
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Region</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Farm</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
            >
              <option value="">No farm</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <button
            onClick={run}
            className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            Analyze
          </button>
        </div>
      </div>

      {result && (() => {
        const sc = getStatusConfig(result.status)
        return (
          <div className="space-y-5">
            {/* Status Banner */}
            <div className={`rounded-2xl bg-gradient-to-r ${sc.bg} shadow-lg overflow-hidden`}>
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="rounded-xl bg-white/20 p-2">{sc.icon}</div>
                  <div>
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-widest">Market Status</div>
                    <div className="text-2xl font-extrabold text-white">{result.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3 text-center">
                    <div className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Supply</div>
                    <div className="text-2xl font-bold text-white">{(result.expected_supply_kg ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-white/60 mt-0.5">kg</div>
                  </div>
                  <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3 text-center">
                    <div className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Demand</div>
                    <div className="text-2xl font-bold text-white">{(result.predicted_demand_kg ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-white/60 mt-0.5">kg</div>
                  </div>
                  <div className="rounded-xl bg-white/20 backdrop-blur px-4 py-3 text-center">
                    <div className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Gap</div>
                    <div className="text-2xl font-bold text-white">{(result.gap_kg ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-white/60 mt-0.5">kg</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Supply vs Demand Comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { label: 'Supply', value: result.expected_supply_kg },
                      { label: 'Demand', value: result.predicted_demand_kg },
                    ]}
                    barCategoryGap="40%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }}
                      formatter={(v: any) => [`${Number(v).toLocaleString()} kg`]}
                    />
                    <Bar dataKey="value" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Explanation */}
            <div className="rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 flex gap-3 items-start">
              <Info className="w-5 h-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-teal-800 leading-relaxed">{result.explanation}</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
