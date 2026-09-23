import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import api from '../services/api'
import { ErrorBox, PageHeader } from '../components/ui'

export default function AdminPanel() {
  const { role } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [train, setTrain] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [cropForm, setCropForm] = useState({
    name: '', category: 'Vegetable', cultivation_days: 90, suitable_soil: 'loam', water_requirement: 'moderate',
    suitable_season: 'rabi', min_temp_c: 15, max_temp_c: 30, expected_yield_kg_per_ha: 10000,
    storage_requirement: 'cool', perishability: 'medium',
  })

  if (role !== 'admin') return <Navigate to="/" replace />

  async function load() {
    const [s, u] = await Promise.all([api.get('/admin/stats'), api.get('/auth/users')])
    setStats(s.data)
    setUsers(u.data)
  }

  useEffect(() => {
    load().catch((e) => setError(e?.response?.data?.detail || 'Admin load failed'))
  }, [])

  async function addCrop(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await api.post('/crops', cropForm)
      await load()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Create crop failed')
    }
  }

  return (
    <div>
      <PageHeader title="Admin Panel" subtitle="Manage datasets, users, crops and trigger baseline model refreshes" />
      <ErrorBox message={error} />
      {stats && (
        <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          {Object.entries(stats).filter(([k]) => typeof stats[k] === 'number').map(([k, v]) => (
            <div key={k} className="card"><div className="text-xs uppercase text-slate-500">{k}</div><div className="text-xl font-semibold">{String(v)}</div></div>
          ))}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-4">
        <form onSubmit={addCrop} className="card space-y-2">
          <h3 className="font-semibold">Add crop</h3>
          <input className="w-full rounded-xl border px-3 py-2" placeholder="Name" value={cropForm.name} onChange={(e) => setCropForm({ ...cropForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-2">
            <input className="rounded-xl border px-3 py-2" value={cropForm.category} onChange={(e) => setCropForm({ ...cropForm, category: e.target.value })} />
            <input type="number" className="rounded-xl border px-3 py-2" value={cropForm.cultivation_days} onChange={(e) => setCropForm({ ...cropForm, cultivation_days: Number(e.target.value) })} />
          </div>
          <button className="rounded-xl bg-agri-600 text-white px-4 py-2">Create</button>
        </form>
        <div className="card space-y-3">
          <h3 className="font-semibold">System actions</h3>
          <button className="rounded-xl border px-4 py-2" onClick={async () => { const { data } = await api.post('/admin/train-forecasts'); setTrain(data) }}>Train / refresh forecast baselines</button>
          <button className="rounded-xl border border-rose-300 text-rose-700 px-4 py-2" onClick={async () => { await api.post('/admin/reseed'); await load() }}>Reseed Database</button>
          {train && <pre className="text-xs bg-slate-50 p-3 rounded-xl overflow-auto max-h-64">{JSON.stringify(train, null, 2)}</pre>}
        </div>
        <div className="card lg:col-span-2 overflow-auto">
          <h3 className="font-semibold mb-2">Users</h3>
          <table className="min-w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Active</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.full_name}</td><td>{u.email}</td><td>{u.role}</td><td>{String(u.is_active)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
