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

// FORMAT TIME
const formatTime = (dateString: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateString + 'Z'))

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [activeLog, setActiveLog] = useState<TimeLog | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])

  const [saving, setSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // AUTH LOAD
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
      setLoading(false)
    }
    loadUser()
  }, [])

  // LIVE CLOCK
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()

      setCurrentTime(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Europe/London',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // FETCH DATA
  useEffect(() => {
    if (!user) return

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

  // LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Enter email + password')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return toast.error(error.message)

    setUser(data.user)
  }

  // CLOCK IN
  const clockIn = async () => {
    if (saving || !user) return

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert([
          {
            user_id: user.id,
            clock_in: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      setActiveLog(data)
      toast.success('Clocked in')
    } catch (err) {
      console.error(err)
      toast.error('Clock in failed')
    } finally {
      setSaving(false)
    }
  }

  // CLOCK OUT
  const clockOut = async () => {
    if (!activeLog || saving) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('time_logs')
        .update({ clock_out: new Date().toISOString() })
        .eq('id', activeLog.id)

      if (error) throw error

      setActiveLog(null)
      toast.success('Clocked out')
    } catch (err) {
      console.error(err)
      toast.error('Clock out failed')
    } finally {
      setSaving(false)
    }
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

  // LOADING STATE
  if (loading) {
    return <div className="p-6 text-center">Loading...</div>
  }

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-6 rounded-3xl shadow-lg w-full max-w-sm">
          <h1 className="text-xl font-semibold mb-4 text-center">
            Login
          </h1>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 mb-3 border rounded-xl"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 mb-4 border rounded-xl"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 text-white py-3 rounded-xl"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  // MAIN APP
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-md mx-auto px-5 pt-6 pb-10 flex flex-col gap-5">

        <TimerCard
          activeLog={activeLog}
          saving={saving}
          onClockIn={clockIn}
          onClockOut={clockOut}
        />

        <div className="bg-white shadow-xl border border-gray-300 rounded-3xl p-6 text-center">
          <p className="text-sm text-neutral-500 mb-1">Current time</p>
          <p className="text-3xl font-semibold text-black mb-3">
            {currentTime}
          </p>

          {activeLog && (
            <p className="text-sm">
              Started at{' '}
              <span className="font-semibold">
                {formatTime(activeLog.clock_in)}
              </span>
            </p>
          )}
        </div>

        <div className="bg-white shadow-xl border border-gray-300 rounded-3xl p-5">
          <h2 className="text-lg font-semibold mb-4">
            Weekly Breakdown
          </h2>

          <WeeklyBreakdown
            weekData={weekData}
            formatDuration={formatDuration}
          />
        </div>

      </div>
    </div>
  )
}