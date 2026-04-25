'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TimerCard from './components/TimerCard'
import WeeklyBreakdown from './components/WeeklyBreakdown'
import toast from 'react-hot-toast'

type TimeLog = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
}

// ✅ CENTRAL TIME FORMATTER (important)
const formatTime = (date: Date, withSeconds = false) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(date)

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [activeLog, setActiveLog] = useState<TimeLog | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])

  const [saving, setSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // AUTH
  useEffect(() => {
    let mounted = true

    const loadUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (mounted) setUser(data.session?.user ?? null)
    }

    loadUser()
    return () => { mounted = false }
  }, [])

  // ✅ LIVE CLOCK (fixed)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentTime(formatTime(now, true))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // FETCH DATA
  useEffect(() => {
    if (!user) {
      setActiveLog(null)
      return
    }

    const fetchData = async () => {
      const { data: active } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .maybeSingle()

      if (active && active.clock_out === null) {
        setActiveLog(active)
      } else {
        setActiveLog(null)
      }

      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)

      setLogs(data || [])
    }

    fetchData()
  }, [user])

  // LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email and password')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return toast.error(error.message)

    setUser(data.user)
    toast.success('Welcome back 👋')
  }

  // SIGNUP
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return toast.error(error.message)

    toast.success('Signup successful 🎉')
  }

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setActiveLog(null)
    toast('Logged out')
  }

  // CLOCK IN
  const clockIn = async () => {
    if (saving) return
    setSaving(true)

    const { data: existing } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .is('clock_out', null)
      .maybeSingle()

    if (existing) {
      toast('You already have an active session')
      setActiveLog(existing)
      setSaving(false)
      return
    }

    const { data, error } = await supabase
      .from('time_logs')
      .insert([
        { user_id: user.id, clock_in: new Date().toISOString() },
      ])
      .select()
      .single()

    if (error) {
      toast.error('Failed to clock in')
    } else {
      setActiveLog(data)
      toast.success('Clocked in ✅')
    }

    setSaving(false)
  }

  // CLOCK OUT
  const clockOut = async () => {
    if (!activeLog || saving) return
    setSaving(true)

    const { error } = await supabase
      .from('time_logs')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', activeLog.id)
      .eq('user_id', user.id)

    if (error) {
      toast.error('Failed to clock out')
    } else {
      toast.success('Clocked out 👋')
    }

    setActiveLog(null)
    setSaving(false)
  }

  // HELPERS
  const getDuration = (log: TimeLog) => {
    const start = new Date(log.clock_in).getTime()
    const end = log.clock_out
      ? new Date(log.clock_out).getTime()
      : Date.now()
    return end - start
  }

  const formatDuration = (ms: number) => {
    const mins = Math.floor(ms / 60000)
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  // WEEK DATA
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

  const weekData = days.map((day, index) => {
    const total = logs
      .filter((log) => {
        const date = new Date(log.clock_in)
        return date >= startOfWeek && date.getDay() === (index + 1) % 7
      })
      .reduce((sum, log) => sum + getDuration(log), 0)

    return { day, total }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      <div className="w-full max-w-md mx-auto px-4 pt-4 pb-24">

        {!user ? (
          <div className="mt-10 bg-white p-6 rounded-3xl shadow-md">
            <h1 className="text-xl font-semibold mb-4 text-center text-gray-900">
              Time Tracker
            </h1>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 mb-3 rounded-xl border bg-white text-gray-900"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-4 rounded-xl border bg-white text-gray-900"
            />

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-2xl mb-2 shadow active:scale-95 transition"
            >
              Login
            </button>

            <button
              onClick={handleSignUp}
              className="w-full bg-gray-200 py-3 rounded-2xl text-gray-800"
            >
              Sign Up
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">

            <p className="text-center text-xs text-gray-600 mb-2">
              Current time: {currentTime}
            </p>

            <div className="bg-white/90 backdrop-blur-xl border border-gray-200 shadow-xl p-5 rounded-3xl w-full">

              {activeLog && (
                <p className="text-center text-sm text-gray-700 mb-3">
                  You’ve been clocked in since{' '}
                  <span className="font-semibold text-gray-900">
                    {formatTime(new Date(activeLog.clock_in))}
                  </span>
                </p>
              )}

              <TimerCard
                activeLog={activeLog}
                saving={saving}
                onClockIn={clockIn}
                onClockOut={clockOut}
              />
            </div>

            <div className="mt-5 bg-white p-4 rounded-3xl shadow-md w-full">
              <WeeklyBreakdown
                weekData={weekData}
                formatDuration={formatDuration}
              />
            </div>

            <button
              onClick={handleLogout}
              className="mt-6 text-sm text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}