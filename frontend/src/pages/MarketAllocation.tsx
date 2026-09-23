import { useEffect, useState } from 'react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'
import { MapPin, Truck, Star, CheckCircle2 } from 'lucide-react'

export default function MarketAllocation() {
  const [farms, setFarms] = useState<any[]>([])
  const [crops, setCrops] = useState<any[]>([])
  const [farmId, setFarmId] = useState('')
  const [cropId, setCropId] = useState('')
  const [qty, setQty] = useState<number | ''>('')
  const [items, setItems] = useState<any[]>([])
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
      const { data } = await api.post('/market/allocation', {
        farm_id: Number(farmId),
        crop_id: Number(cropId),
        quantity_kg: qty === '' ? null : Number(qty),
      })
      setItems(data.items || [])
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Allocation failed')
    }
  }

  useEffect(() => { if (farmId && cropId) run() }, [farmId, cropId])

  function labelStyle(label: string) {
    const u = (label || '').toUpperCase()
    if (u === 'PRIMARY') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
    return 'bg-slate-100 text-slate-600 border border-slate-200'
  }

  const primary = items[0] || null
  const rest = items.slice(1)

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-700 via-amber-600 to-orange-500 p-8 shadow-xl">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #fff 0%, transparent 60%)' }} />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Smart Market Allocation Engine</h1>
          </div>
          <p className="text-orange-100 text-sm max-w-xl">
            Identifies primary and alternative markets for your produce, ranked by logistics-aware scoring.
          </p>
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              <MapPin className="h-3 w-3" /> Logistics-Aware Ranking
            </span>
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* ── Filter Card ── */}
      <div className="rounded-2xl bg-white shadow-md border border-slate-100 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Configure Allocation</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">Farm</label>
            <select
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              value={farmId}
              onChange={(e) => setFarmId(e.target.value)}
            >
              {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
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
            <label className="text-xs font-medium text-slate-500">Quantity (kg)</label>
            <input
              type="number"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 transition w-44"
              placeholder="Optional"
              value={qty}
              onChange={(e) => setQty(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <button
            onClick={run}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow hover:from-orange-700 hover:to-amber-600 transition-all"
          >
            <Star className="h-4 w-4" /> Rank Markets
          </button>
        </div>
      </div>

      {/* ── Primary Hero Card ── */}
      {primary && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-emerald-500 p-6 shadow-xl text-white">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-100">#1 Primary Market</span>
          </div>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">{primary.market_name}</h2>
              <span className="inline-block rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold text-white backdrop-blur">
                {primary.label}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-4xl font-black text-white">{primary.score}</span>
              <span className="text-xs text-emerald-200">Allocation Score</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-4 h-2 rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-white transition-all"
              style={{ width: `${Math.min(Number(primary.score), 100)}%` }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-emerald-200 text-xs block">Allocated Qty</span>
              <span className="font-bold">{primary.allocated_kg} kg</span>
            </div>
            <div>
              <span className="text-emerald-200 text-xs block">Distance</span>
              <span className="font-bold">{primary.distance_km} km</span>
            </div>
          </div>

          {primary.reasons?.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm text-emerald-100 list-disc pl-4">
              {primary.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* ── Alternative Markets ── */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 px-1">Alternative Markets</h3>
          {rest.map((item) => (
            <div key={item.market_id} className="rounded-2xl bg-white shadow-md border border-slate-100 p-5 hover:shadow-lg transition-shadow">
              <div className="flex gap-4 items-start">
                {/* Rank badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-sm">
                  #{item.rank}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-bold text-slate-800">{item.market_name}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${labelStyle(item.label)}`}>
                      {item.label}
                    </span>
                    <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.distance_km} km
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Score</span><span className="font-semibold text-slate-600">{item.score}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400"
                        style={{ width: `${Math.min(Number(item.score), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs text-slate-500 mb-2">
                    <span>Allocated: <b className="text-slate-700">{item.allocated_kg} kg</b></span>
                  </div>

                  <ul className="text-xs text-slate-500 list-disc pl-4 space-y-0.5">
                    {item.reasons.map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
