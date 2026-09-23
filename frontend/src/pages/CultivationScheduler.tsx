import { useEffect, useState } from 'react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'
import { CalendarRange, ArrowRight, Sprout, ShoppingCart, Info } from 'lucide-react'

export default function CultivationScheduler() {
  const [farms, setFarms] = useState<any[]>([])
  const [crops, setCrops] = useState<any[]>([])
  const [farmId, setFarmId] = useState('')
  const [cropId, setCropId] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get('/farms'), api.get('/crops')]).then(([f, c]) => {
      setFarms(f.data); setCrops(c.data)
      if (f.data[0]) setFarmId(String(f.data[0].id))
      setCropId(String(c.data.find((x: any) => x.name === 'Strawberry')?.id || c.data[0]?.id))
    })
  }, [])

  async function run() {
    setError(null)
    try {
      const { data } = await api.post('/schedule/cultivation', { farm_id: Number(farmId), crop_id: Number(cropId) })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Scheduling failed')
    }
  }

  useEffect(() => { if (farmId && cropId) run() }, [farmId, cropId])

  // Milestone color cycling
  const milestoneColors = [
    { border: 'border-emerald-500', bg: 'bg-emerald-50', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    { border: 'border-amber-500', bg: 'bg-amber-50', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
    { border: 'border-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
    { border: 'border-teal-500', bg: 'bg-teal-50', dot: 'bg-teal-500', badge: 'bg-teal-100 text-teal-700' },
    { border: 'border-rose-500', bg: 'bg-rose-50', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Dark Gradient Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-green-800 to-slate-800 px-8 py-8 shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 75% 25%, #6ee7b7 0%, transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
              <CalendarRange className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Cultivation Timeline Scheduler</h1>
              <p className="text-emerald-200 text-sm mt-0.5">Align cultivation start so harvest meets predicted demand peaks</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-400/20 border border-green-400/40 px-4 py-1.5 text-xs font-semibold text-green-300 uppercase tracking-widest backdrop-blur-sm self-start sm:self-auto">
            Demand-Driven Planning
          </span>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* Filter Card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Select Farm & Crop</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Farm</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
            >
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Crop</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
            >
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button
            onClick={run}
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            Generate Schedule
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-5">
          {/* 3-Step Timeline Flow */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Sprout className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-slate-700">{result.crop_name}</h2>
              <span className="ml-auto text-xs text-slate-400 font-medium">Schedule Overview</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Step 1 */}
              <div className="flex-1 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 px-4 py-4 text-center">
                <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Cultivation Start</div>
                <div className="text-lg font-bold text-emerald-800">{result.recommended_start}</div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0" />
              </div>
              {/* Step 2 */}
              <div className="flex-1 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 px-4 py-4 text-center">
                <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Expected Harvest</div>
                <div className="text-lg font-bold text-amber-800">{result.expected_harvest}</div>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 sm:rotate-0" />
              </div>
              {/* Step 3 */}
              <div className="flex-1 rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingCart className="w-3.5 h-3.5 text-purple-500" />
                  <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Demand Peak</div>
                </div>
                <div className="text-lg font-bold text-purple-800">{result.demand_peak_label}</div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 flex gap-3 items-start">
            <Info className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-emerald-800 leading-relaxed">{result.notes}</p>
          </div>

          {/* Milestone Timeline */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-5">Milestone Timeline</h3>
            <div className="space-y-3">
              {result.milestones.map((m: any, i: number) => {
                const col = milestoneColors[i % milestoneColors.length]
                return (
                  <div
                    key={m.milestone}
                    className={`relative rounded-xl ${col.bg} border-l-4 ${col.border} px-4 py-4 flex flex-col sm:flex-row sm:items-start gap-2`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 text-sm">{m.milestone}</div>
                      <div className="text-sm text-slate-600 mt-0.5">{m.detail}</div>
                    </div>
                    <span className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${col.badge} self-start whitespace-nowrap`}>
                      {m.milestone_date}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
