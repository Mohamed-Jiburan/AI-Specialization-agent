import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import AuthShell from '../components/AuthShell'

export default function Signup() {
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
      await api.post('/auth/signup', { email, password })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create Account" subtitle="Build your AI career identity in minutes.">
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
          <label className="text-xs text-slate-600">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="8–72 characters"
            maxLength={72}
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          disabled={!canSubmit || loading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition px-3 py-2 font-semibold text-white"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
