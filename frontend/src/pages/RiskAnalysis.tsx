import { useEffect, useState } from 'react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'
import { AlertTriangle, Info, ShieldAlert, ShieldCheck, ShieldX, Shield } from 'lucide-react'

export default function RiskAnalysis() {
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
      const { data } = await api.get('/risk/surplus', { params: { crop_id: cropId, region_id: regionId, farm_id: farmId || undefined } })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Risk analysis failed')
    }
  }

  useEffect(() => { if (cropId && regionId) run() }, [cropId, regionId, farmId])

  // Risk score styling
  const getRiskConfig = (score: number, level: string) => {
    if (score <= 30) return {
      bar: 'bg-emerald-500',
      glow: 'shadow-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      label: 'LOW RISK',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    }
    if (score <= 60) return {
      bar: 'bg-amber-400',
      glow: 'shadow-amber-200',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      label: 'MEDIUM RISK',
      icon: <Shield className="w-5 h-5 text-amber-600" />,
    }
    if (score <= 80) return {
      bar: 'bg-orange-500',
      glow: 'shadow-orange-200',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      label: 'HIGH RISK',
      icon: <ShieldAlert className="w-5 h-5 text-orange-600" />,
    }
    return {
      bar: 'bg-red-600',
      glow: 'shadow-red-200',
      badge: 'bg-red-100 text-red-800 border-red-300',
      label: 'CRITICAL RISK',
      icon: <ShieldX className="w-5 h-5 text-red-600" />,
    }
  }

  return (
    <div className="space-y-6">
      {/* Dark Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-800 via-rose-800 to-amber-900 px-8 py-8 shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fca5a5 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <AlertTriangle className="w-7 h-7 text-red-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Surplus & Wastage Risk Analysis</h1>
              <p className="text-red-200 text-sm mt-0.5">Scores excess supply, perishability, storage and logistics factors</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-4 py-1.5 text-xs font-semibold text-amber-300 uppercase tracking-widest backdrop-blur-sm self-start sm:self-auto">
            Multi-Factor Scoring
          </span>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* Filter Card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Configure Assessment</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Crop</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
            >
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Region</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
            >
              {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Farm</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
            >
              <option value="">No farm</option>
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <button
            onClick={run}
            className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            Assess Risk
          </button>
        </div>
      </div>

      {result && (() => {
        const score = result.risk_score ?? 0
        const rc = getRiskConfig(score, result.risk_level)
        return (
          <div className="space-y-5">
            {/* Risk Score Card */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Crop Under Analysis</div>
                  <h2 className="text-3xl font-extrabold text-slate-800">{result.crop_name}</h2>
                </div>
                <span className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold ${rc.badge} self-start sm:self-auto`}>
                  {rc.icon}
                  {rc.label}
                </span>
              </div>

              {/* Gauge */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-600">Risk Score</span>
                  <span className="text-2xl font-extrabold text-slate-800">{score}<span className="text-slate-400 text-base font-medium">/100</span></span>
                </div>
                <div className="relative w-full h-5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${rc.bar} shadow-lg ${rc.glow}`}
                    style={{ width: `${Math.min(score, 100)}%` }}
                  />
                </div>
                {/* Scale labels */}
                <div className="flex justify-between mt-1.5 text-[10px] font-medium text-slate-400">
                  <span>0</span>
                  <span className="text-emerald-500">30</span>
                  <span className="text-amber-500">60</span>
                  <span className="text-orange-500">80</span>
                  <span className="text-red-500">100</span>
                </div>
              </div>
            </div>

            {/* Reasons */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Risk Factors</h3>
              <div className="space-y-2.5">
                {result.reasons.map((r: string, i: number) => {
                  const isHighAlert = i < 2
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${isHighAlert ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}
                    >
                      {isHighAlert
                        ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        : <Info className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                      <span className={`text-sm ${isHighAlert ? 'text-red-800' : 'text-amber-800'}`}>{r}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Risk Legend */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk Level Guide</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { range: '0 – 30', label: 'Low Risk', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                  { range: '31 – 60', label: 'Medium Risk', bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                  { range: '61 – 80', label: 'High Risk', bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
                  { range: '81 – 100', label: 'Critical Risk', bar: 'bg-red-600', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                ].map((l) => (
                  <div key={l.label} className={`rounded-xl border px-3 py-2.5 ${l.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2.5 h-2.5 rounded-full ${l.bar}`} />
                      <span className={`text-xs font-bold ${l.text}`}>{l.label}</span>
                    </div>
                    <div className="text-xs text-slate-500">Score: {l.range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
