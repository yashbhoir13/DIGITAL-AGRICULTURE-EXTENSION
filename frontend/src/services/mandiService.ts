import api from './api'

export interface MandiRate {
  mandi: string
  district: string
  state: string
  lat: number
  lon: number
  modal_price_per_kg: number
  modal_price_per_quintal?: number
  min_price: number
  min_price_per_quintal?: number
  max_price: number
  max_price_per_quintal?: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  arrival_tonnes: number
}

export interface CommodityPrices {
  crop: string
  category: string
  variety: string
  markets: MandiRate[]
  source?: string
  as_of_date?: string
}

export interface RankedMarketArbitrage {
  mandi: string
  district: string
  state: string
  distance_km: number
  modal_price_per_kg: number
  modal_price_per_quintal?: number
  gross_revenue: number
  transport_cost: number
  mandi_fees: number
  net_profit: number
  effective_rate_per_kg: number
  effective_rate_per_quintal?: number
  trend: string
  arrival_tonnes: number
}

export interface ArbitrageResponse {
  crop: string
  category?: string
  variety: string
  quantity_kg: number
  quantity_quintals?: number
  best_mandi: RankedMarketArbitrage
  ranked_markets: RankedMarketArbitrage[]
  arbitrage_insight: string
  as_of_date?: string
  source?: string
}

export async function fetchAllMandiPrices(params?: {
  category?: string
  search?: string
  state?: string
}): Promise<CommodityPrices[]> {
  const { data } = await api.get('/mandi/live', { params })
  return data.commodities
}

export async function fetchMandiArbitrage(
  crop = 'Strawberry',
  lat = 18.5204,
  lon = 73.8567,
  quantity_kg = 1000.0
): Promise<ArbitrageResponse> {
  const { data } = await api.get('/mandi/arbitrage', {
    params: { crop, lat, lon, quantity_kg },
  })
  return data
}

