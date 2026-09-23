import api from './api'

export interface HarvestListing {
  id: string
  farmer_name: string
  farm_name: string
  location: string
  crop: string
  variety: string
  quantity_quintals: number
  price_per_kg: number
  harvest_date: string
  status: string
  phone: string
  whatsapp: string
  organic_certified: boolean
  grade: string
  notes: string
}

export interface NewListingInput {
  crop: string
  variety: string
  quantity_quintals: number
  price_per_kg: number
  harvest_date: string
  farm_name: string
  location: string
  phone: string
  whatsapp: string
  organic_certified?: boolean
  grade?: string
  notes?: string
}

export async function fetchHarvestListings(): Promise<HarvestListing[]> {
  const { data } = await api.get('/marketplace/listings')
  return data.listings
}

export async function postHarvestListing(input: NewListingInput): Promise<HarvestListing> {
  const { data } = await api.post('/marketplace/listings', input)
  return data.listing
}
