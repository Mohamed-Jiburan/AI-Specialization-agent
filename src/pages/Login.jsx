import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => email && password.length >= 8 && password.length <= 72, [email, password])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('access_token', data?.access_token || '')
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Precision-grade career pathing starts here.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-600">Institutional Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="alex@university.edu"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-600">Password</label>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Forgot password?
            </button>
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="8–72 characters"
            maxLength={72}
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
          Keep me logged in
        </label>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition px-3 py-2 font-semibold text-white"
        >
          {loading ? 'Logging in…' : 'Login to Dashboard'}
        </button>
      </form>
    </AuthShell>
  )
}
