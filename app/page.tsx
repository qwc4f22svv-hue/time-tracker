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

const formatTime = (dateString: string, withSeconds = false) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  }).format(new Date(dateString + 'Z'))

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

  // LIVE CLOCK
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime(new Date().toISOString(), true))
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

      setActiveLog(active ?? null)

      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)

      setLogs(data || [])
    }

    fetchData()
  }, [user])

  // AUTH ACTIONS
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email and password')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return toast.error(error.message)

    setUser(data.user)
    toast.success('Welcome back 👋')
  }

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return toast.error(error.message)

    toast.success('Signup successful 🎉')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setActiveLog(null)
    toast('Logged out')
  }

  // CLOCK ACTIONS
  const clockIn = async () => {
    if (saving) return
    setSaving(true)

    const { data, error } = await supabase
      .from('time_logs')
      .insert([{ user_id: user.id, clock_in: new Date().toISOString() }])
      .select()
      .single()

    if (error) toast.error('Failed to clock in')
    else {
      setActiveLog(data)
      toast.success('Clocked in ✅')
    }

    setSaving(false)
  }

  const clockOut = async () => {
    if (!activeLog || saving) return
    setSaving(true)

    const { error } = await supabase
      .from('time_logs')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', activeLog.id)

    if (error) toast.error('Failed to clock out')
    else toast.success('Clocked out 👋')

    setActiveLog(null)
    setSaving(false)
  }

  // HELPERS
  const getDuration = (log: TimeLog) => {
    const start = new Date(log.clock_in + 'Z').getTime()
    const end = log.clock_out
      ? new Date(log.clock_out + 'Z').getTime()
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
        const date = new Date(log.clock_in + 'Z')
        return date >= startOfWeek && date.getDay() === (index + 1) % 7
      })
      .reduce((sum, log) => sum + getDuration(log), 0)

    return { day, total }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="w-full max-w-md mx-auto px-5 pt-6 pb-28 flex flex-col gap-6">

        {!user ? (
          <div className="mt-12 bg-white p-7 rounded-3xl shadow-lg border border-gray-100">
            <h1 className="text-2xl font-semibold mb-6 text-center text-black">
              Time Tracker
            </h1>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 mb-4 rounded-xl border border-gray-300 text-black focus:ring-2 focus:ring-green-500"
            />

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full p-3 mb-5 rounded-xl border border-gray-300 text-black focus:ring-2 focus:ring-green-500"
            />

            <button
              onClick={handleLogin}
              className="w-full bg-green-600 text-white py-3 rounded-2xl mb-3 shadow"
            >
              Login
            </button>

            <button
              onClick={handleSignUp}
              className="w-full bg-gray-100 py-3 rounded-2xl text-black"
            >
              Sign Up
            </button>
          </div>
        ) : (
          <>
            {/* TIME CARD */}
            <div className="bg-white shadow-lg border border-gray-100 rounded-3xl p-6 text-center">
              <p className="text-sm text-neutral-600 mb-1">Current time</p>
              <p className="text-3xl font-semibold text-black mb-3">
                {currentTime}
              </p>

              {activeLog && (
                <p className="text-sm text-neutral-700">
                  Started at{' '}
                  <span className="font-semibold text-black">
                    {formatTime(activeLog.clock_in)}
                  </span>
                </p>
              )}
            </div>

            {/* WEEKLY */}
            <div className="bg-white shadow-lg border border-gray-100 rounded-3xl p-5">
              <h2 className="text-lg font-semibold text-black mb-4">
                Weekly Breakdown
              </h2>

              <WeeklyBreakdown
                weekData={weekData}
                formatDuration={formatDuration}
              />
            </div>

            <button
              onClick={handleLogout}
              className="text-sm text-red-600 text-center"
            >
              Logout
            </button>

            <TimerCard
              activeLog={activeLog}
              saving={saving}
              onClockIn={clockIn}
              onClockOut={clockOut}
            />
          </>
        )}
      </div>
    </div>
  )
}