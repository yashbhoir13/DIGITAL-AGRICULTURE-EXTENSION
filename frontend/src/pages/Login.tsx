import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ErrorBox } from '../components/ui'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('farmer@agri.demo')
  const [password, setPassword] = useState('farmer123')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left hero panel */}
      <div
        className="hidden md:flex flex-col justify-between text-white p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #f97316 0%, #ea580c 40%, #c2410c 70%, #9a3412 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl mb-6 shadow-lg">🌾</div>
          <div className="text-sm uppercase tracking-widest text-orange-200 font-bold">BE CSE · Data Science</div>
          <h1 className="text-4xl font-bold mt-3 leading-tight">Digital Agriculture<br />Extension Prototype</h1>
          <p className="mt-4 text-orange-100/85 max-w-md leading-relaxed">
            Intelligent decision support for crop selection, demand/price foresight, supply–demand balance, harvest scheduling and market allocation.
          </p>
        </div>

        <div className="relative">
          <div className="flex gap-4 mb-4">
            {['Crop AI', 'Market Intel', 'CCTV Defense', 'Mandi Rates'].map((tag) => (
              <span key={tag} className="text-xs bg-white/15 border border-white/25 rounded-full px-3 py-1 font-medium">{tag}</span>
            ))}
          </div>
          <div className="text-sm text-orange-100/60">Powered by machine learning intelligence and regional agricultural datasets.</div>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div className="flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-app)' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-xl shadow">🌾</div>
            <div>
              <div className="font-bold text-stone-800">AgriSmart Enterprise</div>
              <div className="text-xs text-orange-600">Farm Intelligence & Security</div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="card space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-stone-800">Welcome back 👋</h2>
              <p className="text-sm text-stone-500 mt-1">Sign in to your AgriSmart account</p>
            </div>
            <ErrorBox message={error} />
            <label className="block text-sm font-medium text-stone-700">
              Email address
              <input
                className="mt-1.5 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Password
              <input
                type="password"
                className="mt-1.5 w-full rounded-xl border border-orange-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button
              disabled={busy}
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? 'Signing in…' : 'Sign in →'}
            </button>
            <div className="text-xs text-stone-500 bg-orange-50 rounded-xl px-3 py-2 border border-orange-100">
              🔑 Quick Login: <strong>farmer@agri.demo</strong> / <strong>farmer123</strong> · <strong>admin@agri.demo</strong> / <strong>admin123</strong>
            </div>
            <p className="text-sm text-stone-500 text-center">
              No account?{' '}
              <Link className="text-orange-600 font-semibold hover:text-orange-700" to="/register">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
