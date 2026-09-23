import { useEffect, useState } from 'react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'
import { TrendingUp, Layers, FlaskConical, AlertTriangle } from 'lucide-react'

export default function ProductionEstimation() {
  const [crops, setCrops] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [cropId, setCropId] = useState('')
  const [farmId, setFarmId] = useState('')
  const [area, setArea] = useState<number | ''>('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get('/crops'), api.get('/farms')]).then(([c, f]) => {
      setCrops(c.data)
      setFarms(f.data)
      setCropId(String(c.data.find((x: any) => x.name === 'Strawberry')?.id || c.data[0]?.id))
      if (f.data[0]) setFarmId(String(f.data[0].id))
    })
  }, [])

  async function run() {
    setError(null)
    try {
      const { data } = await api.post('/production/estimate', {
        crop_id: Number(cropId),
        farm_id: farmId ? Number(farmId) : null,
        land_area_ha: area === '' ? null : Number(area),
      })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Estimation failed')
    }
  }

  useEffect(() => { if (cropId) run() }, [cropId, farmId])

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-700 via-orange-600 to-amber-500 p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)' }} />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Production Estimation Engine</h1>
          </div>
          <p className="text-orange-100 text-sm max-w-xl">
            Estimates expected crop production using yield × area formula with agro-climate adjustments.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <Layers className="h-3 w-3" /> Yield × Area Formula
            </span>
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* ── Filter Card ── */}
      <div className="rounded-2xl bg-white shadow-md border border-slate-100 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Configure Estimation</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Crop</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
            >
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Farm</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
            >
              <option value="">No farm</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Area Override (ha)</label>
            <input
              type="number"
              step="0.1"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition w-44"
              placeholder="Optional"
              value={area}
              onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <button
            onClick={run}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-orange-700 hover:to-amber-600 transition-all"
          >
            <TrendingUp className="h-4 w-4" /> Estimate
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4">
          {/* Hero metric */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 p-8 shadow-xl text-white">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 55%)' }} />
            <div className="relative">
              <p className="text-orange-100 text-xs font-semibold uppercase tracking-widest mb-1">Expected Production</p>
              <p className="text-xs text-orange-200 mb-3">{result.crop_name}</p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-black text-white leading-none">
                  {result.expected_production_kg?.toLocaleString()}
                </span>
                <span className="text-2xl font-semibold text-orange-200 mb-1">kg</span>
              </div>
            </div>
          </div>

          {/* Formula visualization */}
          <div className="rounded-2xl bg-white shadow-md border border-slate-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Formula Breakdown</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-lg font-mono">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Land Area</div>
                <div className="font-bold text-slate-800">{result.land_area_ha} ha</div>
              </div>
              <span className="text-2xl text-slate-400 font-bold">×</span>
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Yield Rate</div>
                <div className="font-bold text-slate-800">{result.yield_kg_per_ha} kg/ha</div>
              </div>
              <span className="text-2xl text-slate-400 font-bold">=</span>
              <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 text-center">
                <div className="text-xs text-orange-500 mb-1">Production</div>
                <div className="font-black text-orange-700 text-xl">{result.expected_production_kg?.toLocaleString()} kg</div>
              </div>
            </div>
          </div>

          {/* Method info box */}
          {result.method && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex gap-3">
              <Layers className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed">{result.method}</p>
            </div>
          )}

          {/* DEMO disclaimer */}
          {result.notes && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">{result.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
