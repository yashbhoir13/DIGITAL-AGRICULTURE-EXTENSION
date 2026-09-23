import { FormEvent, useEffect, useState } from 'react'
import api from '../services/api'
import { ErrorBox, PageHeader } from '../components/ui'

export default function FarmProfile() {
  const [regions, setRegions] = useState<any[]>([])
  const [farms, setFarms] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    region_id: '',
    name: '',
    location: '',
    land_area_ha: 1,
    water_availability: 'moderate',
    season: 'rabi',
    climate_notes: '',
    crop_preferences: '',
    expected_quantity_kg: 1000,
    soil_type: 'loam',
    ph: 6.5,
    organic_matter_pct: 2.5,
  })

  async function load() {
    const [r, f] = await Promise.all([api.get('/regions'), api.get('/farms')])
    setRegions(r.data)
    setFarms(f.data)
    if (r.data[0] && !form.region_id) setForm((s) => ({ ...s, region_id: String(r.data[0].id) }))
  }

  useEffect(() => {
    load().catch((e) => setError(e?.response?.data?.detail || 'Failed to load farms'))
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/farms', {
        region_id: Number(form.region_id),
        name: form.name,
        location: form.location,
        land_area_ha: Number(form.land_area_ha),
        water_availability: form.water_availability,
        season: form.season,
        climate_notes: form.climate_notes,
        crop_preferences: form.crop_preferences,
        expected_quantity_kg: Number(form.expected_quantity_kg),
        soil: {
          soil_type: form.soil_type,
          ph: Number(form.ph),
          organic_matter_pct: Number(form.organic_matter_pct),
        },
      })
      await load()
      setForm((s) => ({ ...s, name: '', location: '' }))
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Save failed')
    }
  }

  return (
    <div>
      <PageHeader title="Farm / Regional Profile" subtitle="Soil, water, season and land inputs drive recommendations" />
      <ErrorBox message={error} />
      <div className="grid lg:grid-cols-2 gap-4">
        <form onSubmit={onSubmit} className="card space-y-3">
          <h3 className="font-semibold">Add farm profile</h3>
          <select className="w-full rounded-xl border px-3 py-2" value={form.region_id} onChange={(e) => setForm({ ...form, region_id: e.target.value })} required>
            {regions.map((r) => <option key={r.id} value={r.id}>{r.name}, {r.state}</option>)}
          </select>
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Farm name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.1" className="rounded-xl border px-3 py-2" placeholder="Land (ha)" value={form.land_area_ha} onChange={(e) => setForm({ ...form, land_area_ha: Number(e.target.value) })} />
            <input type="number" className="rounded-xl border px-3 py-2" placeholder="Expected qty kg" value={form.expected_quantity_kg} onChange={(e) => setForm({ ...form, expected_quantity_kg: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="rounded-xl border px-3 py-2" value={form.water_availability} onChange={(e) => setForm({ ...form, water_availability: e.target.value })}>
              <option>low</option><option>moderate</option><option>high</option>
            </select>
            <select className="rounded-xl border px-3 py-2" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })}>
              <option>kharif</option><option>rabi</option><option>zaid</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input className="rounded-xl border px-3 py-2" placeholder="Soil type" value={form.soil_type} onChange={(e) => setForm({ ...form, soil_type: e.target.value })} />
            <input type="number" step="0.1" className="rounded-xl border px-3 py-2" placeholder="pH" value={form.ph} onChange={(e) => setForm({ ...form, ph: Number(e.target.value) })} />
            <input type="number" step="0.1" className="rounded-xl border px-3 py-2" placeholder="OM %" value={form.organic_matter_pct} onChange={(e) => setForm({ ...form, organic_matter_pct: Number(e.target.value) })} />
          </div>
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Crop preferences" value={form.crop_preferences} onChange={(e) => setForm({ ...form, crop_preferences: e.target.value })} />
          <textarea className="w-full rounded-xl border px-3 py-2" placeholder="Climate notes" value={form.climate_notes} onChange={(e) => setForm({ ...form, climate_notes: e.target.value })} />
          <button className="rounded-xl bg-agri-600 text-white px-4 py-2">Save farm</button>
        </form>
        <div className="space-y-3">
          {farms.map((f) => (
            <div key={f.id} className="card">
              <div className="font-semibold">{f.name}</div>
              <div className="text-sm text-slate-500">{f.location} · {f.land_area_ha} ha · {f.season}</div>
              <div className="text-sm mt-2">Water: {f.water_availability} · Soil: {f.soil?.soil_type} (pH {f.soil?.ph})</div>
              <div className="text-xs text-slate-400 mt-2">Preferences: {f.crop_preferences || '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
