import { useState, useEffect } from 'react'
import {
  CloudSun,
  Droplets,
  Wind,
  Compass,
  MapPin,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sprout,
  Sun,
  ShieldAlert,
} from 'lucide-react'
import { fetchLiveWeather, AgroWeatherResponse } from '../services/weatherService'
import { useLanguage } from '../context/LanguageContext'

export default function WeatherWidget() {
  const { t } = useLanguage()
  const [weather, setWeather] = useState<AgroWeatherResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: 18.5204,
    lon: 73.8567, // Pune / Western Ghats strawberry belt
  })
  const [locationName, setLocationName] = useState<string>('Pune / Mahabaleshwar Belt')
  const [gpsActive, setGpsActive] = useState<boolean>(false)

  const loadWeather = (lat: number, lon: number) => {
    setLoading(true)
    fetchLiveWeather(lat, lon)
      .then(setWeather)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadWeather(coords.lat, coords.lon)
  }, [coords])

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4))
        const lon = parseFloat(pos.coords.longitude.toFixed(4))
        setCoords({ lat, lon })
        setLocationName(`Farm GPS (${lat}, ${lon})`)
        setGpsActive(true)
        loadWeather(lat, lon)
      },
      (err) => {
        alert('Could not acquire GPS: ' + err.message)
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  const cur = weather?.current

  return (
    <div className="bg-gradient-to-br from-slate-900 via-agri-950 to-orange-950 text-white p-4 sm:p-6 rounded-3xl shadow-xl border border-orange-500/20 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
            <CloudSun size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                {t.weatherTitle}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-300 border border-orange-400/20">
                Live Sensor Feed
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-200/70 mt-0.5">
              <MapPin size={12} className="text-orange-400" />
              <span>{locationName}</span>
            </div>
          </div>
        </div>

        {/* GPS Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUseGPS}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              gpsActive
                ? 'bg-orange-500 text-slate-950 border-orange-400'
                : 'bg-white/10 hover:bg-white/20 text-orange-200 border-white/15'
            }`}
          >
            <Compass size={14} />
            {gpsActive ? t.gpsLocked : t.useMyLocation}
          </button>
          <button
            onClick={() => loadWeather(coords.lat, coords.lon)}
            disabled={loading}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition"
            title="Refresh Live Weather"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Temperature */}
        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
          <div className="text-xs text-orange-200/70 flex items-center gap-1">
            <Sun size={14} className="text-amber-400" /> Temperature
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {cur ? `${Math.round(cur.temperature_c)}°C` : '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Feels like {cur ? `${Math.round(cur.apparent_temp_c)}°C` : '--'}
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
          <div className="text-xs text-orange-200/70 flex items-center gap-1">
            <Droplets size={14} className="text-sky-400" /> Humidity
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {cur ? `${Math.round(cur.humidity_pct)}%` : '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {cur && cur.humidity_pct > 75 ? '⚠️ High fungal risk' : 'Normal range'}
          </div>
        </div>

        {/* Wind Speed */}
        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
          <div className="text-xs text-orange-200/70 flex items-center gap-1">
            <Wind size={14} className="text-teal-300" /> Wind Speed
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {cur ? `${cur.wind_speed_kmh}` : '--'} <span className="text-xs font-normal">km/h</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {cur && cur.wind_speed_kmh > 15 ? 'Drift warning' : 'Safe for spray'}
          </div>
        </div>

        {/* Soil Moisture */}
        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
          <div className="text-xs text-orange-200/70 flex items-center gap-1">
            <Sprout size={14} className="text-orange-400" /> Root Soil Moisture
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {cur ? `${cur.soil_moisture_pct}%` : '--'}
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div
              className={`h-full ${
                (cur?.soil_moisture_pct || 0) < 25
                  ? 'bg-red-400'
                  : (cur?.soil_moisture_pct || 0) > 65
                  ? 'bg-blue-400'
                  : 'bg-orange-400'
              }`}
              style={{ width: `${cur?.soil_moisture_pct || 40}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Agricultural Advisories Banner */}
      {weather && weather.advisories.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-orange-300 flex items-center gap-1.5">
            <ShieldAlert size={14} /> Live Farm Decision Advisories
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {weather.advisories.map((adv, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border backdrop-blur-xs ${
                  adv.severity === 'DANGER'
                    ? 'bg-red-500/15 border-red-500/40 text-red-100'
                    : adv.severity === 'WARNING'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-100'
                    : 'bg-orange-500/15 border-orange-500/40 text-orange-100'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  {adv.severity === 'DANGER' ? (
                    <AlertCircle size={14} className="text-red-400" />
                  ) : adv.severity === 'WARNING' ? (
                    <AlertCircle size={14} className="text-amber-400" />
                  ) : (
                    <CheckCircle2 size={14} className="text-orange-400" />
                  )}
                  {adv.title}
                </div>
                <p className="text-[11px] opacity-90 mt-1 leading-snug">{adv.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-Day Forecast mini strip */}
      {weather && weather.daily_forecast.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          <div className="text-[11px] text-orange-200/70 font-semibold mb-2">
            7-Day Agricultural Weather Forecast:
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center">
            {weather.daily_forecast.map((d, i) => (
              <div key={i} className="bg-white/5 p-2 rounded-xl border border-white/5 text-[11px]">
                <div className="font-mono text-[10px] text-slate-400">{d.date.slice(5)}</div>
                <div className="font-bold text-white mt-1">{Math.round(d.max_temp)}°</div>
                <div className="text-[10px] text-slate-400">{Math.round(d.min_temp)}°</div>
                <div className="text-[10px] text-sky-300 font-semibold mt-1">
                  {d.precip_prob}% rain
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
