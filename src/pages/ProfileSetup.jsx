import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const [skillsText, setSkillsText] = useState('')
  const [interestsText, setInterestsText] = useState('')
  const [goal, setGoal] = useState('ML Engineer')
  const [experienceLevel, setExperienceLevel] = useState('Beginner')
  const [riskTolerance, setRiskTolerance] = useState(50)
  const [salaryPreference, setSalaryPreference] = useState(50)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [careerOptions, setCareerOptions] = useState([])
  const [step, setStep] = useState(1)

  const canContinueStep1 = Boolean(goal) && Boolean(experienceLevel)
  const canContinueStep2 = true
  const isLast = step === 3

  const onNext = () => {
    if (step === 1 && !canContinueStep1) return
    setStep((s) => Math.min(3, s + 1))
  }

  const onBack = () => setStep((s) => Math.max(1, s - 1))

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get('/careers')
        setCareerOptions(res?.data || [])
        if (!goal && res?.data?.[0]?.title) setGoal(res.data[0].title)
      } catch {
        setCareerOptions([])
      }
    }
    run()
  }, [goal])

  const skills = useMemo(
    () =>
      skillsText
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    [skillsText]
  )

  const interests = useMemo(
    () =>
      interestsText
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    [interestsText]
  )

  const canSubmit = useMemo(() => goal && experienceLevel, [goal, experienceLevel])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const payload = {
        skills,
        interests,
        goal,
        experience_level: experienceLevel,
        risk_tolerance: Number(riskTolerance),
        salary_preference: Number(salaryPreference)
      }
      localStorage.setItem('profile', JSON.stringify(payload))
      const { data } = await api.post('/analyze', payload)
      localStorage.setItem('analysis', JSON.stringify(data || {}))
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Analyze failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <div className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 inline-flex rounded-full px-3 py-1">
          Onboarding Phase
        </div>
        <div className="mt-4 text-3xl font-semibold text-slate-900">Build Your AI Career Identity</div>
        <div className="mt-2 text-sm text-slate-600">
          Provide your technical foundation so our AI can curate your specialized path.
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold">
                    {step}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Professional Foundation</div>
                    <div className="text-xs text-slate-500">Refine the details below to personalize your analysis.</div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className={
                      step === 1
                        ? 'rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5'
                        : 'rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 hover:bg-slate-200'
                    }
                  >
                    1 • Identity
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className={
                      step === 2
                        ? 'rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5'
                        : 'rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 hover:bg-slate-200'
                    }
                  >
                    2 • Expertise
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className={
                      step === 3
                        ? 'rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5'
                        : 'rounded-full bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 hover:bg-slate-200'
                    }
                  >
                    3 • Goals
                  </button>
                </div>
              </div>

              <form onSubmit={onSubmit} className="p-6 space-y-6">
                {step === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700">What is your primary career goal in AI?</label>
                      <select
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {(careerOptions.length ? careerOptions : [{ id: 'loading', title: 'Loading…' }]).map((c) => (
                          <option key={c.id} value={c.title}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 text-xs text-slate-500">Try to be specific about role and scale.</div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-slate-700">Current Experience Level</div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {['Beginner', 'Intermediate', 'Advanced'].map((x) => (
                          <button
                            key={x}
                            type="button"
                            onClick={() => setExperienceLevel(x)}
                            className={
                              experienceLevel === x
                                ? 'h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold'
                                : 'h-10 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50'
                            }
                          >
                            {x}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-700">Skills (comma-separated)</label>
                      <input
                        value={skillsText}
                        onChange={(e) => setSkillsText(e.target.value)}
                        className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="python, sql, numpy, docker"
                      />
                      <div className="mt-2 text-xs text-slate-500">Detected: {skills.length}</div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-700">Interests (comma-separated)</label>
                      <input
                        value={interestsText}
                        onChange={(e) => setInterestsText(e.target.value)}
                        className="mt-2 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        placeholder="computer vision, nlp, mlops"
                      />
                      <div className="mt-2 text-xs text-slate-500">Detected: {interests.length}</div>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">Risk tolerance</label>
                        <div className="text-xs text-slate-500">{riskTolerance}</div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={riskTolerance}
                        onChange={(e) => setRiskTolerance(e.target.value)}
                        className="mt-3 w-full"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-slate-700">Salary preference</label>
                        <div className="text-xs text-slate-500">{salaryPreference}</div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={salaryPreference}
                        onChange={(e) => setSalaryPreference(e.target.value)}
                        className="mt-3 w-full"
                      />
                    </div>
                  </div>
                ) : null}

                {error ? <div className="text-sm text-red-600">{error}</div> : null}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={step === 1 || loading}
                    className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-40"
                  >
                    Back
                  </button>

                  {!isLast ? (
                    <button
                      type="button"
                      onClick={onNext}
                      disabled={(step === 1 && !canContinueStep1) || (step === 2 && !canContinueStep2) || loading}
                      className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition px-4 text-sm font-semibold text-white"
                    >
                      Continue →
                    </button>
                  ) : (
                    <button
                      disabled={!canSubmit || loading}
                      className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition px-4 text-sm font-semibold text-white"
                    >
                      {loading ? 'Analyzing…' : 'Analyze my profile'}
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500">Your data is encrypted and used only for career modeling.</div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="text-sm font-semibold text-slate-900">Vision & Experience</div>
              <div className="mt-2 text-xs text-slate-600">
                Our AI uses your career goal + experience level to weight industries and roles.
              </div>
              <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1">
                AI INSIGHT TIP
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Live Analysis Confidence</div>
                  <div className="mt-1 text-xs text-slate-600">Profile completeness signal</div>
                </div>
                <div className="text-sm font-semibold text-slate-900">{Math.min(95, 40 + skills.length * 4 + interests.length * 3)}%</div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${Math.min(95, 40 + skills.length * 4 + interests.length * 3)}%` }}
                />
              </div>
              <div className="mt-3 text-xs text-slate-600">
                Better skill + interest detail improves match clarity and roadmap precision.
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-semibold text-slate-500">COMMUNITY BENCHMARKS</div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Avg skills listed</div>
                  <div className="font-semibold text-slate-900">12+</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-slate-600">Target salary (mid-level)</div>
                  <div className="font-semibold text-slate-900">$45k+</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
