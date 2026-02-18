import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import AnimatedNumber from '../components/AnimatedNumber'
import FeasibilityGauge from '../components/FeasibilityGauge'
import api from '../services/api'

export default function Dashboard() {
  const [analysis, setAnalysis] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('analysis') || '{}')
    } catch {
      return {}
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const profile = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('profile') || '{}')
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    const hasMatches = Array.isArray(analysis?.top_matches) && analysis.top_matches.length > 0
    if (hasMatches) return

    // If dashboard opened directly or localStorage was cleared, re-run analysis from stored profile.
    const canAnalyze = profile?.goal && profile?.experience_level
    if (!canAnalyze) return

    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await api.post('/analyze', profile)
        localStorage.setItem('analysis', JSON.stringify(res?.data || {}))
        setAnalysis(res?.data || {})
      } catch (e) {
        setError(e?.response?.data?.detail || 'Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [analysis, profile])

  const matches = analysis?.top_matches || []
  const best = matches?.[0]

  const radarData = useMemo(() => {
    const r = best?.radar
    if (!r) return []
    return [
      { metric: 'Skill', value: r.skill_match ?? 0 },
      { metric: 'Growth', value: r.growth ?? 0 },
      { metric: 'Salary', value: r.salary ?? 0 },
      { metric: 'Stability', value: r.stability ?? 0 },
      { metric: 'Auto risk', value: 100 - (r.automation_risk ?? 0) }
    ]
  }, [best])

  return (
    <div>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl font-semibold text-slate-900">Dashboard</div>
          <div className="mt-1 text-sm text-slate-600">
            Dominant factor: <span className="font-semibold text-slate-900">{analysis?.dominant_decision_factor || '—'}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            to="/compare"
          >
            Compare careers
          </Link>
          {best?.id ? (
            <Link
              className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              to={`/career/${best.id}`}
            >
              View SWOT profile
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 text-slate-600">Loading analysis…</div>
      ) : error ? (
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 text-red-600 text-sm">{error}</div>
      ) : !matches.length ? (
        <div className="mt-6 rounded-2xl bg-white border border-slate-200 p-6 text-slate-600">
          No analysis found. Go to{' '}
          <Link className="text-blue-600 hover:text-blue-700 font-semibold" to="/profile">
            Profile setup
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <div className="text-sm font-semibold text-slate-900">My recommendation (best overall)</div>
                <div className="mt-1 text-sm text-slate-600">Top matches based on skills, feasibility, and fit.</div>
              </div>

              <div className="divide-y divide-slate-100">
                {matches.slice(0, 5).map((m) => (
                  <Link key={m?.id} to={`/roadmap/${m?.id}`} className="block">
                    <div className="p-5 hover:bg-slate-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-slate-900">{m?.title || '—'}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Dominant signal: <span className="text-slate-700 font-semibold">{m?.dominant_factor || '—'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Match</div>
                          <div className="text-xl font-semibold text-slate-900">{m?.breakdown?.match_percent ?? '—'}%</div>
                        </div>
                      </div>

                      <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div>Skill match</div>
                            <div className="font-semibold text-slate-700">{m?.breakdown?.skill_match_percent ?? '—'}%</div>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${m?.breakdown?.skill_match_percent || 0}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <div>Feasibility</div>
                            <div className="font-semibold text-slate-700">{m?.feasibility ?? '—'}%</div>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full bg-sky-500" style={{ width: `${m?.feasibility || 0}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-xs text-slate-500">
                        Missing: <span className="text-slate-700">{(m?.missing_skills || []).slice(0, 5).join(', ') || '—'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="text-sm font-semibold text-slate-900">Explainability</div>
              <div className="mt-2 text-sm text-slate-600">
                {(analysis?.explainability?.reasoning_points || []).slice(0, 6).map((x, i) => (
                  <div key={i} className="mt-2">
                    {x}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5"
            >
              <div className="text-xs text-slate-500">Confidence</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900">
                <AnimatedNumber value={analysis?.confidence_score} />
              </div>
              <div className="mt-2 text-xs text-slate-500">Higher means clearer separation between top choices.</div>
            </motion.div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="text-sm font-semibold text-slate-900">Skill radar</div>
              <div className="mt-1 text-xs text-slate-500">Best match: {best?.title || '—'}</div>

              <div className="mt-4 h-56">
                {radarData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="70%">
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#475569', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#2563eb" fill="rgba(37,99,235,0.18)" />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No radar data</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="text-sm font-semibold text-slate-900">Feasibility</div>
              <div className="mt-1 text-xs text-slate-500">Best match: {best?.title || '—'}</div>
              <div className="mt-4 flex justify-center">
                <FeasibilityGauge value={best?.feasibility} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
