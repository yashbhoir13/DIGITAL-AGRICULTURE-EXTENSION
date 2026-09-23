import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../services/api'
import { ErrorBox, StatusBadge } from '../components/ui'
import { FlaskConical, Info } from 'lucide-react'

export default function WhatIf() {
  const [farms, setFarms] = useState<any[]>([])
  const [crops, setCrops] = useState<any[]>([])
  const [markets, setMarkets] = useState<any[]>([])
  const [form, setForm] = useState({ farm_id: '', crop_id: '', market_id: '', land_area_ha: '', cultivation_quantity_kg: '', demand_override_kg: '', name: 'Scenario A' })
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.get('/farms'), api.get('/crops'), api.get('/markets')]).then(([f, c, m]) => {
      setFarms(f.data); setCrops(c.data); setMarkets(m.data)
      setForm((s) => ({
        ...s,
        farm_id: String(f.data[0]?.id || ''),
        crop_id: String(c.data.find((x: any) => x.name === 'Strawberry')?.id || c.data[0]?.id || ''),
        market_id: String(m.data[0]?.id || ''),
      }))
    })
  }, [])

  async function run() {
    setError(null)
    try {
      const { data } = await api.post('/simulation/what-if', {
        farm_id: Number(form.farm_id),
        crop_id: Number(form.crop_id),
        market_id: form.market_id ? Number(form.market_id) : null,
        land_area_ha: form.land_area_ha === '' ? null : Number(form.land_area_ha),
        cultivation_quantity_kg: form.cultivation_quantity_kg === '' ? null : Number(form.cultivation_quantity_kg),
        demand_override_kg: form.demand_override_kg === '' ? null : Number(form.demand_override_kg),
        name: form.name,
      })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Simulation failed')
    }
  }

  const chart = result
    ? [
        { name: 'Supply', before: result.before.production.expected_production_kg, after: result.after.production.expected_production_kg },
        { name: 'Demand', before: result.before.supply_demand.predicted_demand_kg, after: result.after.supply_demand.predicted_demand_kg },
        { name: 'Gap', before: result.before.supply_demand.gap_kg, after: result.after.supply_demand.gap_kg },
      ]
    : []

  const inputBase =
    'w-full rounded-xl bg-white/10 border border-white/20 text-white placeholder-violet-300/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/60 focus:border-transparent transition'

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900 via-purple-800 to-slate-900 px-8 py-10 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(167,139,250,0.15),_transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <FlaskConical className="h-7 w-7 text-violet-300" />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-violet-500/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-violet-300 ring-1 ring-violet-400/30">
              What-If Analysis
            </div>
            <h1 className="text-3xl font-bold text-white">Scenario Simulation Engine</h1>
            <p className="mt-0.5 text-sm text-violet-300/80">Change assumptions and compare BEFORE vs AFTER outcomes</p>
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* ── Inputs Card ── */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 shadow-lg ring-1 ring-white/10">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-violet-300">Scenario Parameters</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Row 1 – selectors */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Farm</label>
            <select
              className={inputBase}
              value={form.farm_id}
              onChange={(e) => setForm({ ...form, farm_id: e.target.value })}
            >
              {farms.map((f) => <option key={f.id} value={f.id} className="bg-slate-800">{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Crop</label>
            <select
              className={inputBase}
              value={form.crop_id}
              onChange={(e) => setForm({ ...form, crop_id: e.target.value })}
            >
              {crops.map((c) => <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Market</label>
            <select
              className={inputBase}
              value={form.market_id}
              onChange={(e) => setForm({ ...form, market_id: e.target.value })}
            >
              {markets.map((m) => <option key={m.id} value={m.id} className="bg-slate-800">{m.name}</option>)}
            </select>
          </div>

          {/* Row 2 – numeric inputs */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Land Area (ha)</label>
            <input
              className={inputBase}
              placeholder="e.g. 5.0"
              value={form.land_area_ha}
              onChange={(e) => setForm({ ...form, land_area_ha: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Cultivation Qty (kg)</label>
            <input
              className={inputBase}
              placeholder="e.g. 1200"
              value={form.cultivation_quantity_kg}
              onChange={(e) => setForm({ ...form, cultivation_quantity_kg: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Demand Override (kg)</label>
            <input
              className={inputBase}
              placeholder="e.g. 800"
              value={form.demand_override_kg}
              onChange={(e) => setForm({ ...form, demand_override_kg: e.target.value })}
            />
          </div>

          {/* Row 3 – scenario name + button */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-slate-400">Scenario Name</label>
            <input
              className={inputBase}
              placeholder="Scenario name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={run}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-purple-500 active:scale-95"
            >
              <FlaskConical className="h-4 w-4" />
              Run Simulation
            </button>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <>
          {/* BEFORE / AFTER cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* BEFORE */}
            <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/10">
              <div className="bg-gradient-to-r from-slate-700 to-slate-600 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-200">⬛ Before</h3>
              </div>
              <div className="space-y-3 bg-slate-800/60 p-5">
                <div className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-2.5">
                  <span className="text-xs text-slate-400">Supply</span>
                  <span className="text-sm font-bold text-white">{(result.before?.production?.expected_production_kg ?? 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-2.5">
                  <span className="text-xs text-slate-400">Demand</span>
                  <span className="text-sm font-bold text-white">{(result.before?.supply_demand?.predicted_demand_kg ?? 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-2.5">
                  <span className="text-xs text-slate-400">Gap</span>
                  <span className="text-sm font-bold text-white">{(result.before?.supply_demand?.gap_kg ?? 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Status</span>
                  <StatusBadge level={result.before?.supply_demand?.status || 'NORMAL'} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Risk</span>
                  <StatusBadge level={result.before?.risk?.risk_level || 'LOW'} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Top Market</span>
                  <span className="text-sm font-medium text-slate-200">{result.before?.top_market?.market_name || '—'}</span>
                </div>
              </div>
            </div>

            {/* AFTER */}
            <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-emerald-500/20">
              <div className="bg-gradient-to-r from-emerald-700 to-green-600 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-100">✅ After</h3>
              </div>
              <div className="space-y-3 bg-slate-800/60 p-5">
                <div className="flex items-center justify-between rounded-lg bg-emerald-900/30 px-4 py-2.5">
                  <span className="text-xs text-slate-400">Supply</span>
                  <span className="text-sm font-bold text-white">{(result.after?.production?.expected_production_kg ?? 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-900/30 px-4 py-2.5">
                  <span className="text-xs text-slate-400">Demand</span>
                  <span className="text-sm font-bold text-white">{(result.after?.supply_demand?.predicted_demand_kg ?? 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-emerald-900/30 px-4 py-2.5">
                  <span className="text-xs text-slate-400">Gap</span>
                  <span className="text-sm font-bold text-white">{(result.after?.supply_demand?.gap_kg ?? 0).toLocaleString()} kg</span>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Status</span>
                  <StatusBadge level={result.after.supply_demand.status} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Risk</span>
                  <StatusBadge level={result.after.risk.risk_level} />
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400">Top Market</span>
                  <span className="text-sm font-medium text-slate-200">{result.after.top_market?.market_name || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200">
            <h3 className="mb-4 text-base font-semibold text-slate-700">Before vs After Scenario Comparison</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
                    cursor={{ fill: 'rgba(100,116,139,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="before" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Before" />
                  <Bar dataKey="after" fill="#10b981" radius={[4, 4, 0, 0]} name="After" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interpretation */}
          <div className="flex gap-3 rounded-2xl bg-violet-50 px-5 py-4 ring-1 ring-violet-200">
            <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-500" />
            <p className="text-sm leading-relaxed text-violet-800">{result.interpretation}</p>
          </div>
        </>
      )}
    </div>
  )
}
