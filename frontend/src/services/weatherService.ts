import api from './api'

export interface AgroWeatherAdvisory {
  type: string
  status: string
  title: string
  message: string
  severity: 'SUCCESS' | 'WARNING' | 'DANGER' | 'INFO'
}

export interface DailyWeatherCard {
  date: string
  max_temp: number
  min_temp: number
  precip_prob: number
  precip_sum: number
}

export interface AgroWeatherResponse {
  status: string
  provider: string
  coordinates: { latitude: number; longitude: number }
  current: {
    temperature_c: number
    apparent_temp_c: number
    humidity_pct: number
    wind_speed_kmh: number
    wind_direction_deg: number
    is_day: boolean
    rain_mm: number
    soil_moisture_pct: number
  }
  advisories: AgroWeatherAdvisory[]
  daily_forecast: DailyWeatherCard[]
}

export async function fetchLiveWeather(lat = 18.5204, lon = 73.8567): Promise<AgroWeatherResponse> {
  const { data } = await api.get('/weather/live', {
    params: { lat, lon },
  })
  return data
}
