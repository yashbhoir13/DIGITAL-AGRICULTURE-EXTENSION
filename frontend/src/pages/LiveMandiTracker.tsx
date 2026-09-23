import { useState, useEffect, useMemo } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Truck,
  IndianRupee,
  Compass,
  CheckCircle2,
  Search,
  Scale,
  Calendar,
  Layers,
  MapPin,
} from 'lucide-react'
import {
  fetchAllMandiPrices,
  fetchMandiArbitrage,
  CommodityPrices,
  ArbitrageResponse,
} from '../services/mandiService'
import { useLanguage } from '../context/LanguageContext'

type UnitType = 'kg' | 'quintal'

export default function LiveMandiTracker() {
  const { t } = useLanguage()
  const [commodities, setCommodities] = useState<CommodityPrices[]>([])
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedState, setSelectedState] = useState<string>('All')
  const [unit, setUnit] = useState<UnitType>('kg')
  const [quantityQuintals, setQuantityQuintals] = useState<number>(15)
  const [arbitrage, setArbitrage] = useState<ArbitrageResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [farmCoords, setFarmCoords] = useState<{ lat: number; lon: number }>({
    lat: 18.5204,
    lon: 73.8567,
  })
  const [gpsActive, setGpsActive] = useState<boolean>(false)

  // Fetch commodities with search & category
  useEffect(() => {
    fetchAllMandiPrices()
      .then((data) => {
        setCommodities(data)
        if (data.length > 0 && !data.some((c) => c.crop === selectedCrop)) {
          setSelectedCrop(data[0].crop)
        }
      })
      .catch((err) => console.error(err))
  }, [])

  // Fetch arbitrage calculation when crop, quantity, or coords change
  useEffect(() => {
    if (!selectedCrop) return
    setLoading(true)
    fetchMandiArbitrage(selectedCrop, farmCoords.lat, farmCoords.lon, quantityQuintals * 100)
      .then(setArbitrage)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [selectedCrop, quantityQuintals, farmCoords])

  const handleUseGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setFarmCoords({
        lat: parseFloat(pos.coords.latitude.toFixed(4)),
        lon: parseFloat(pos.coords.longitude.toFixed(4)),
      })
      setGpsActive(true)
    })
  }

  // Filter commodities by category and search
  const filteredCommodities = useMemo(() => {
    return commodities.filter((c) => {
      const matchCategory =
        selectedCategory === 'All' || c.category?.toLowerCase() === selectedCategory.toLowerCase()
      const matchSearch =
        !searchQuery.trim() ||
        c.crop.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.variety.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.markets.some((m) =>
          m.mandi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.state.toLowerCase().includes(searchQuery.toLowerCase())
        )
      const matchState =
        selectedState === 'All' ||
        c.markets.some((m) => m.state.toLowerCase() === selectedState.toLowerCase())

      return matchCategory && matchSearch && matchState
    })
  }, [commodities, selectedCategory, searchQuery, selectedState])

  const currentCommodity = commodities.find((c) => c.crop === selectedCrop)

  // Price formatter depending on unit
  const formatPrice = (pricePerKg: number) => {
    if (unit === 'quintal') {
      return `₹${(pricePerKg * 100).toLocaleString()}/q`
    }
    return `₹${pricePerKg}/kg`
  }

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-agri-950 via-agri-900 to-emerald-950 text-white p-4 sm:p-6 rounded-3xl shadow-lg border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Live Agmarknet & APMC Daily Rates
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-slate-200 flex items-center gap-1">
              <Calendar size={12} className="text-emerald-400" />
              September 2026 Mandi Feed
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-2 text-white tracking-tight flex items-center gap-2">
            <IndianRupee size={24} className="text-emerald-400" />
            Vegetable & Fruit Mandi Prices & Logistics Arbitrage
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/80 mt-0.5 max-w-2xl">
            Real wholesale rates from APMC Pune, Mumbai Vashi, Lasalgaon, Azadpur Delhi, Bengaluru, and major national mandis with diesel logistics net-profit ranking.
          </p>
        </div>

        {/* GPS and Unit Toggle */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <button
            onClick={handleUseGPS}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border shrink-0 ${
              gpsActive
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-emerald-200 border-white/15'
            }`}
          >
            <Compass size={14} />
            {gpsActive ? 'GPS Locked' : 'Auto-Detect Farm GPS'}
          </button>

          {/* Unit Toggle: ₹/kg vs ₹/Quintal */}
          <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
            <button
              onClick={() => setUnit('kg')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                unit === 'kg' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              ₹ / kg
            </button>
            <button
              onClick={() => setUnit('quintal')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                unit === 'quintal' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              ₹ / Quintal (100kg)
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'All', label: 'All Commodities', icon: Layers },
              { id: 'Vegetable', label: '🥦 Vegetables', icon: null },
              { id: 'Fruit', label: '🍓 Fruits', icon: null },
              { id: 'Cereal & Cash', label: '🌾 Cereals & Commercial', icon: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id)
                  const firstMatching = commodities.find(
                    (c) => tab.id === 'All' || c.category?.toLowerCase() === tab.id.toLowerCase()
                  )
                  if (firstMatching) setSelectedCrop(firstMatching.crop)
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  selectedCategory === tab.id
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box & State Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tomato, onion, apple, mandi..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
              />
            </div>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-emerald-500 font-medium"
            >
              <option value="All">All States</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi">Delhi</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Himachal Pradesh">Himachal Pradesh</option>
            </select>
          </div>
        </div>

        {/* Commodity Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
          {filteredCommodities.length === 0 ? (
            <p className="text-xs text-slate-400 py-1 italic">No commodities found matching "{searchQuery}".</p>
          ) : (
            filteredCommodities.map((c) => (
              <button
                key={c.crop}
                onClick={() => setSelectedCrop(c.crop)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 border ${
                  selectedCrop === c.crop
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{c.crop}</span>
                <span className="text-[10px] opacity-70 font-normal">({c.variety.split('/')[0].trim()})</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Arbitrage Calculator Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <Truck size={18} className="text-emerald-600" />
              Logistics-Adjusted Net Profit Arbitrage ({selectedCrop})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Factors diesel freight (₹6.5/km/tonne) & APMC mandi fee (1.5%) to find the highest payout market for your harvest
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Harvest Quantity:</span>
            <div className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <input
                type="number"
                min="1"
                max="5000"
                value={quantityQuintals}
                onChange={(e) => setQuantityQuintals(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 bg-transparent text-xs font-bold text-slate-800 text-center outline-hidden"
              />
              <span className="text-xs font-medium text-slate-500">Quintals ({quantityQuintals * 100} kg)</span>
            </div>
          </div>
        </div>

        {/* Highlight Best Mandi Banner */}
        {arbitrage && (
          <div className="bg-gradient-to-r from-emerald-900 via-agri-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-400 text-slate-950">
                  Optimal Market Payout
                </span>
                <span className="text-xs text-emerald-200">Category: {arbitrage.category || 'General'}</span>
              </div>
              <h4 className="text-xl font-black text-white flex items-center gap-1.5">
                <MapPin size={18} className="text-emerald-400" />
                {arbitrage.best_mandi.mandi} ({arbitrage.best_mandi.district}, {arbitrage.best_mandi.state})
              </h4>
              <p className="text-xs text-emerald-100/90 max-w-xl">{arbitrage.arbitrage_insight}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-white/10 p-3 rounded-xl border border-white/10">
              <div>
                <div className="text-[10px] uppercase text-emerald-200 font-bold">Wholesale Modal Rate</div>
                <div className="text-xl font-black text-white">
                  {formatPrice(arbitrage.best_mandi.modal_price_per_kg)}
                </div>
              </div>
              <div className="border-l border-white/20 pl-4">
                <div className="text-[10px] uppercase text-emerald-200 font-bold">Net Realized Profit</div>
                <div className="text-xl font-black text-emerald-300">
                  ₹{arbitrage.best_mandi.net_profit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ranked Mandis Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">APMC Mandi</th>
                <th className="p-3">Distance</th>
                <th className="p-3">Wholesale Rate ({unit === 'quintal' ? '₹/Quintal' : '₹/kg'})</th>
                <th className="p-3">Gross Revenue</th>
                <th className="p-3">Diesel Freight</th>
                <th className="p-3">Mandi Cess (1.5%)</th>
                <th className="p-3">Net Realized Payout</th>
                <th className="p-3">Effective Realized Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {arbitrage?.ranked_markets.map((m, idx) => (
                <tr
                  key={m.mandi}
                  className={`hover:bg-slate-50/80 ${idx === 0 ? 'bg-emerald-50/50 font-semibold' : ''}`}
                >
                  <td className="p-3">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      {idx === 0 && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                      {m.mandi}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {m.district}, {m.state}
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">{m.distance_km} km</td>
                  <td className="p-3 font-bold text-slate-900">
                    <span className="flex items-center gap-1">
                      {formatPrice(m.modal_price_per_kg)}
                      {m.trend === 'UP' ? (
                        <TrendingUp size={12} className="text-emerald-600" />
                      ) : m.trend === 'DOWN' ? (
                        <TrendingDown size={12} className="text-red-500" />
                      ) : null}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-mono">₹{m.gross_revenue.toLocaleString()}</td>
                  <td className="p-3 text-red-600 font-mono">-₹{m.transport_cost.toLocaleString()}</td>
                  <td className="p-3 text-slate-400 font-mono">-₹{m.mandi_fees.toLocaleString()}</td>
                  <td className="p-3 font-extrabold text-emerald-700 font-mono text-sm">
                    ₹{m.net_profit.toLocaleString()}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800">
                    {formatPrice(m.effective_rate_per_kg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandi Arrival Benchmarks Card */}
      {currentCommodity && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Scale size={14} className="text-emerald-600" />
              APMC Market Arrivals & Daily Price Band ({currentCommodity.crop} — {currentCommodity.variety})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Source: APMC / Agmarknet Daily Benchmark
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {currentCommodity.markets.map((m) => (
              <div key={m.mandi} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{m.mandi}</span>
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded-md border text-slate-600 font-semibold shadow-2xs">
                    {m.arrival_tonnes} Tonnes Daily
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{m.district}, {m.state}</div>

                <div className="mt-3 flex items-baseline justify-between border-t border-slate-200/60 pt-2">
                  <span className="text-xs text-slate-500">Price Band:</span>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {formatPrice(m.min_price)} – {formatPrice(m.max_price)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Modal Auction Rate:</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {formatPrice(m.modal_price_per_kg)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

