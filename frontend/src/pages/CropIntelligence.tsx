import { useEffect, useState } from 'react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'
import { Sprout, Droplets, Thermometer, Sun, Warehouse, Search, Leaf } from 'lucide-react'

// ── helpers ──────────────────────────────────────────────────────────────────
function categoryStyle(cat?: string) {
  switch (cat?.toLowerCase()) {
    case 'fruit':     return 'bg-rose-100 text-rose-700 ring-rose-200'
    case 'vegetable': return 'bg-green-100 text-green-700 ring-green-200'
    case 'cereal':    return 'bg-amber-100 text-amber-700 ring-amber-200'
    default:          return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

function perishStyle(level?: string) {
  switch (level?.toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-700 ring-red-200'
    case 'medium': return 'bg-amber-100 text-amber-700 ring-amber-200'
    case 'low':    return 'bg-green-100 text-green-700 ring-green-200'
    default:       return 'bg-slate-100 text-slate-600 ring-slate-200'
  }
}

export default function CropIntelligence() {
  const [crops, setCrops]   = useState<any[]>([])
  const [error, setError]   = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  useEffect(() => {
    api.get('/crops').then((r) => setCrops(r.data)).catch((e) => setError(e?.response?.data?.detail || 'Failed'))
  }, [])

  // Derive category list
  const categories = ['All', ...Array.from(new Set(crops.map((c) => c.category).filter(Boolean)))]

  // Filter by search + active category
  const filtered = crops.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'All' || c.category === activeCategory
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-900 via-emerald-800 to-slate-900 px-8 py-10 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(52,211,153,0.12),_transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Sprout className="h-7 w-7 text-emerald-300" />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-semibold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/30">
              Agronomic Intelligence
            </div>
            <h1 className="text-3xl font-bold text-white">Crop Knowledge Base</h1>
            <p className="mt-0.5 text-sm text-emerald-300/80">Cultivation parameters from the crop knowledge base</p>
          </div>
        </div>
      </div>

      <ErrorBox message={error} />

      {/* ── Search + Category Tabs ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:border-transparent transition"
            placeholder="Search crops or categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ring-1 transition ${
                activeCategory === cat
                  ? cat === 'All'
                    ? 'bg-emerald-600 text-white ring-emerald-600'
                    : categoryStyle(cat).replace('ring-', 'ring-') + ' opacity-100 shadow-sm'
                  : 'bg-white text-slate-500 ring-slate-200 hover:ring-emerald-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Crop Grid ── */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="group relative flex flex-col rounded-2xl bg-white shadow-md ring-1 ring-slate-200 transition hover:shadow-lg hover:ring-emerald-300"
          >
            {/* Card top bar */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${categoryStyle(c.category)}`}>
                  <Leaf className="h-3 w-3" />
                  {c.category || 'Other'}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${perishStyle(c.perishability)}`}>
                  {c.perishability} perishability
                </span>
              </div>
            </div>

            {/* Crop name */}
            <div className="px-5 pb-3">
              <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition">{c.name}</h3>
            </div>

            {/* Stats grid 2×3 */}
            <div className="mx-5 mb-3 grid grid-cols-2 gap-2">
              {/* Cultivation days */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Sprout className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Duration</p>
                  <p className="text-sm font-semibold text-slate-700">{c.cultivation_days} days</p>
                </div>
              </div>
              {/* Yield */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Leaf className="h-4 w-4 flex-shrink-0 text-green-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Yield / ha</p>
                  <p className="text-sm font-semibold text-slate-700">{c.expected_yield_kg_per_ha} kg</p>
                </div>
              </div>
              {/* Water */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Droplets className="h-4 w-4 flex-shrink-0 text-blue-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Water req.</p>
                  <p className="text-sm font-semibold text-slate-700">{c.water_requirement}</p>
                </div>
              </div>
              {/* Temp */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Thermometer className="h-4 w-4 flex-shrink-0 text-orange-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Temp range</p>
                  <p className="text-sm font-semibold text-slate-700">{c.min_temp_c}–{c.max_temp_c} °C</p>
                </div>
              </div>
              {/* Season */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Sun className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Season</p>
                  <p className="text-sm font-semibold text-slate-700">{c.suitable_season}</p>
                </div>
              </div>
              {/* Soil */}
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                <Leaf className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Soil type</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{c.suitable_soil}</p>
                </div>
              </div>
            </div>

            {/* Storage row */}
            <div className="mx-5 mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
              <Warehouse className="h-4 w-4 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-500">Storage requirement</p>
                <p className="text-sm font-semibold text-slate-700">{c.storage_requirement}</p>
              </div>
            </div>

            {/* Verified label */}
            {c.is_demo && (
              <div className="mx-5 mb-4 mt-auto">
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Standard
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
