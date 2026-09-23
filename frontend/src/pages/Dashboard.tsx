import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Sprout, Camera, ArrowRight, Sparkles, Video } from 'lucide-react'
import api from '../services/api'
import { ErrorBox, Loading, PageHeader, StatusBadge } from '../components/ui'
import WeatherWidget from '../components/WeatherWidget'
import { fetchCCTVStats, CCTVStats } from '../services/cctvService'

type Dash = {
  total_crops: number
  predicted_demand_kg: number
  expected_production_kg: number
  supply_demand_gap_kg: number
  average_price: number
  surplus_risk: string
  recommended_crop?: string
  recommended_market?: string
  demand_trend: { date: string; value: number; kind: string }[]
  price_trend: { date: string; value: number; kind: string }[]
  supply_vs_demand: { label: string; value: number }[]
  crop_recommendations: { name: string; score: number }[]
  risk_distribution: { name: string; value: number }[]
  disclaimer: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [regions, setRegions] = useState<any[]>([])

  const [crops, setCrops] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [regionId, setRegionId] = useState<string>('')
  const [cropId, setCropId] = useState<string>('')
  const [farmId, setFarmId] = useState<string>('')
  const [data, setData] = useState<Dash | null>(null)
  const [cctvStats, setCctvStats] = useState<CCTVStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/regions'), api.get('/crops'), api.get('/farms'), fetchCCTVStats()]).then(([r, c, f, cctv]) => {
      setRegions(r.data)
      setCrops(c.data)
      setFarms(f.data)
      setCctvStats(cctv)
      if (f.data[0]) setFarmId(String(f.data[0].id))
      const straw = c.data.find((x: any) => x.name === 'Strawberry')
      if (straw) setCropId(String(straw.id))
      if (f.data[0]) setRegionId(String(f.data[0].region_id))
    }).catch((e) => {
      // Non-fatal if CCTV stats fetch fails
      console.warn('CCTV stats load issue:', e)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get('/dashboard', {
        params: {
          region_id: regionId || undefined,
          crop_id: cropId || undefined,
          farm_id: farmId || undefined,
        },
      })
      .then((res) => setData(res.data))
      .catch((e) => setError(e?.response?.data?.detail || 'Dashboard unavailable'))
      .finally(() => setLoading(false))
  }, [regionId, cropId, farmId])

  if (loading && !data) return <Loading />
  if (!data) return <ErrorBox message={error || 'No data'} />

  const cards = [
    { label: 'Total Crops', value: data.total_crops ?? 0 },
    { label: 'Predicted Demand (kg)', value: (data.predicted_demand_kg ?? 0).toLocaleString() },
    { label: 'Expected Production (kg)', value: (data.expected_production_kg ?? 0).toLocaleString() },
    { label: 'Supply–Demand Gap', value: (data.supply_demand_gap_kg ?? 0).toLocaleString() },
    { label: 'Average Price (INR/kg)', value: data.average_price ?? 0 },
    { label: 'Surplus Risk', value: data.surplus_risk || 'LOW', badge: true },
    { label: 'Recommended Crop', value: data.recommended_crop || '—' },
    { label: 'Recommended Market', value: data.recommended_market || '—' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Farm Intelligence Dashboard" subtitle="Operational planning, agro-meteorology, and market absorption" />
      <ErrorBox message={error} />
      
      {/* Live Agro-Weather and Soil Moisture Microclimate */}
      <WeatherWidget />

      <div className="grid md:grid-cols-2 gap-4">
        {/* 🌱 Plant Health AI Scanner Banner Card */}
        <div className="bg-gradient-to-r from-emerald-900 via-agri-900 to-emerald-950 p-5 rounded-3xl text-white border border-emerald-500/20 shadow-md flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Sprout size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  🌱 Plant Health AI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                  New
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Scan leaf samples using camera for instant AI disease diagnosis.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/plant-health')}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Camera size={16} />
            Start Plant Scan
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 📹 Live Plant CCTV Monitoring Card */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 rounded-3xl text-white border border-emerald-500/30 shadow-md flex flex-col justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 relative">
              <Video size={24} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  📹 AI Plant CCTV Monitoring
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Live threat detection, plant safety zones & spatial risk analysis.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Cameras: {cctvStats?.cameras_online ?? 2} Online
            </div>
            <div className="text-slate-300 font-semibold flex items-center gap-1">
              Active Threats: <span className="text-amber-400 font-bold">{cctvStats?.active_threats ?? 0}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/cctv')}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shadow-emerald-500/20"
          >
            <Video size={16} />
            OPEN LIVE MONITOR
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="card grid md:grid-cols-3 gap-3">

        <label className="text-sm">Region
          <select className="mt-1 w-full rounded-xl border px-3 py-2" value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            <option value="">All / farm default</option>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}, {r.state}</option>)}
          </select>
        </label>
        <label className="text-sm">Crop
          <select className="mt-1 w-full rounded-xl border px-3 py-2" value={cropId} onChange={(e) => setCropId(e.target.value)}>
            <option value="">Default</option>
            {crops.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Farm
          <select className="mt-1 w-full rounded-xl border px-3 py-2" value={farmId} onChange={(e) => setFarmId(e.target.value)}>
            <option value="">Default</option>
            {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <div className="text-xs uppercase tracking-wide text-slate-500">{c.label}</div>
            <div className="mt-2 text-xl font-semibold">{c.badge ? <StatusBadge level={String(c.value)} /> : c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="card h-80">
          <h3 className="font-semibold mb-2">Demand Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.demand_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#2f9e44" name="Demand (kg)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-80">
          <h3 className="font-semibold mb-2">Price Trend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={data.price_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1c7ed6" name="INR/kg" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-80">
          <h3 className="font-semibold mb-2">Supply vs Demand</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.supply_vs_demand}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2b8a3e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-80">
          <h3 className="font-semibold mb-2">Crop Recommendation Scores</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={data.crop_recommendations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#37b24d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="text-xs text-slate-500">{data.disclaimer}</p>
    </div>
  )
}
