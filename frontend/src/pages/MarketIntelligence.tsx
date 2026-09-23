import { useEffect, useMemo, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Store, MapPin, TrendingUp, IndianRupee, Truck, RefreshCw, BarChart2, Scale } from 'lucide-react'
import api from '../services/api'
import { ErrorBox } from '../components/ui'

export default function MarketIntelligence() {
  const [markets, setMarkets] = useState<any[]>([])
  const [crops, setCrops] = useState<any[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [cropId, setCropId] = useState<string>('')
  const [history, setHistory] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/markets'), api.get('/crops')]).then(([m, c]) => {
      setMarkets(m.data)
      setCrops(c.data)
      if (m.data[0]) setSelected(m.data[0].id)
      const onion = c.data.find((x: any) => x.name === 'Onion')
      if (onion) setCropId(String(onion.id))
    }).catch((e) => setError(e?.response?.data?.detail || 'Failed'))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoadingHistory(true)
    api.get(`/markets/${selected}/history`, { params: { crop_id: cropId || undefined } })
      .then((r) => setHistory(r.data))
      .catch((e) => setError(e?.response?.data?.detail || 'History failed'))
      .finally(() => setLoadingHistory(false))
  }, [selected, cropId])

  const priceSeries = useMemo(() => (history?.prices || []).map((p: any) => ({ date: p.period_date, price: p.price_inr_per_kg })), [history])
  const demandSeries = useMemo(() => (history?.demand || []).map((p: any) => ({ date: p.period_date, demand: p.demand_kg })), [history])

  const selectedMarket = markets.find((m) => m.id === selected)

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-agri-950 to-orange-950 text-white p-4 sm:p-6 rounded-3xl shadow-lg border border-orange-500/20">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-400/30 flex items-center gap-1.5">
            <Store size={12} /> APMC Market Intelligence
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200">
            Historical Data
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <BarChart2 size={24} className="text-orange-400" />
          Market Intelligence Dashboard
        </h2>
        <p className="text-xs sm:text-sm text-orange-100/80 mt-1 max-w-2xl">
          Explore market capacity, historical demand, price trends, and logistics feasibility across all APMC mandis.
        </p>
      </div>

      <ErrorBox message={error} />

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Filter by Crop
            <select
              className="block mt-1 w-full sm:w-48 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 font-medium focus:outline-none focus:border-orange-400"
              value={cropId}
              onChange={(e) => setCropId(e.target.value)}
            >
              {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <button
            onClick={() => {
              if (selected) {
                setLoadingHistory(true)
                api.get(`/markets/${selected}/history`, { params: { crop_id: cropId || undefined } })
                  .then((r) => setHistory(r.data))
                  .catch((e) => setError(e?.response?.data?.detail || 'History failed'))
                  .finally(() => setLoadingHistory(false))
              }
            }}
            disabled={loadingHistory}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition mt-5"
          >
            <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Market Cards Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {markets.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className={`text-left p-4 rounded-2xl border transition hover:shadow-md ${
              selected === m.id
                ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400 shadow-md'
                : 'bg-white border-slate-200 hover:border-orange-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="font-bold text-slate-900 text-sm">{m.name}</div>
              {selected === m.id && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-black rounded-full">Selected</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
              <MapPin size={11} className="text-orange-600" />
              {m.location}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="bg-slate-50 p-1.5 rounded-lg">
                <div className="text-slate-400 font-semibold uppercase text-[9px]">Demand</div>
                <div className="font-bold text-slate-800">{(m.current_demand_kg || 0).toLocaleString()} kg</div>
              </div>
              <div className="bg-orange-50 p-1.5 rounded-lg">
                <div className="text-orange-500 font-semibold uppercase text-[9px]">Price</div>
                <div className="font-bold text-orange-800">₹{m.current_price_inr}/kg</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Capacity: <span className="font-semibold text-slate-700">{(m.capacity_kg || 0).toLocaleString()} kg</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Transport: <span className={`font-semibold ${
                m.transport_feasibility === 'high' ? 'text-emerald-700' :
                m.transport_feasibility === 'medium' ? 'text-amber-700' : 'text-red-700'
              }`}>{m.transport_feasibility}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Market Detail */}
      {selectedMarket && (
        <div className="bg-gradient-to-r from-agri-950 via-slate-900 to-orange-950 text-white p-4 sm:p-5 rounded-3xl border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-orange-300 mb-1">Selected Market</div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <MapPin size={18} className="text-orange-400" />
              {selectedMarket.name}
            </h3>
            <p className="text-xs text-orange-100/80 mt-1">{selectedMarket.location}</p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 p-3 rounded-2xl border border-white/10">
            <div className="text-center">
              <div className="text-[10px] text-orange-200 font-bold uppercase">Current Price</div>
              <div className="text-xl font-black text-white flex items-center gap-1"><IndianRupee size={16} />{selectedMarket.current_price_inr}/kg</div>
            </div>
            <div className="border-l border-white/20 pl-4 text-center">
              <div className="text-[10px] text-orange-200 font-bold uppercase">Daily Demand</div>
              <div className="text-xl font-black text-emerald-300">{(selectedMarket.current_demand_kg || 0).toLocaleString()} kg</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Logistics */}
      {history && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Demand Chart */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-emerald-600" />
              Historical Demand
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={demandSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Line dataKey="demand" stroke="#2f9e44" dot={false} strokeWidth={2} name="Demand (kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Price Chart */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <IndianRupee size={16} className="text-blue-600" />
              Historical Prices
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={priceSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" hide />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: any) => [`₹${v}`, 'Price']} />
                <Line dataKey="price" stroke="#1c7ed6" dot={false} strokeWidth={2} name="Price (₹/kg)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Logistics Table */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <Truck size={16} className="text-orange-600" />
              Logistics Feasibility <span className="text-slate-400 font-normal text-xs">(Estimated)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Region ID</th>
                    <th className="p-3">Distance (km)</th>
                    <th className="p-3">Transport Cost</th>
                    <th className="p-3">Feasibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(history.logistics || []).slice(0, 12).map((l: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-bold text-slate-700">#{l.region_id}</td>
                      <td className="p-3 font-mono text-slate-600">{l.distance_km} km</td>
                      <td className="p-3 font-mono font-semibold text-orange-700">₹{l.transport_cost_per_kg}/kg</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.feasibility === 'high' ? 'bg-emerald-100 text-emerald-800' :
                          l.feasibility === 'medium' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {l.feasibility}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
