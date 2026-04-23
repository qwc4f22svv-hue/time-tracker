'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type TimeLog = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [activeLog, setActiveLog] = useState<TimeLog | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [elapsed, setElapsed] = useState(0)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // AUTH
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  // TIMER
  useEffect(() => {
    if (!activeLog) return

    const interval = setInterval(() => {
      const start = new Date(activeLog.clock_in).getTime()
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [activeLog])

  // FETCH DATA
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)

      const { data: active, error: activeError } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)
        .is('clock_out', null)
        .maybeSingle()

      if (activeError) {
        console.error(activeError)
      }

      setActiveLog(active || null)

      const { data, error } = await supabase
        .from('time_logs')
        .select('id, user_id, clock_in, clock_out')
        .eq('user_id', user.id)
        .order('clock_in', { ascending: false })
        .limit(20)

      if (error) {
        console.error(error)
      }

      setLogs(data || [])
      setLoading(false)
    }

    fetchData()
  }, [user])

  // LOGIN
  const handleLogin = async () => {
    if (!email || !password) {
      alert('Enter email and password')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
  }

  // SIGNUP
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) alert(error.message)
    else alert('Signup successful')
  }

  // LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // CLOCK IN
  const clockIn = async () => {
    if (saving || activeLog) return // prevent duplicates
    setSaving(true)

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

    if (error) {
      console.error(error)
      setSaving(false)
      return
    }

    setActiveLog(data)
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
      .eq('user_id', user.id) // 🔒 critical fix

    if (error) {
      console.error(error)
      setSaving(false)
      return
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

  // GROUP LOGS
  const groupedLogs = logs.reduce((acc, log) => {
    const date = new Date(log.clock_in).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {} as Record<string, TimeLog[]>)

  // WEEK TOTAL
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1)
  startOfWeek.setHours(0, 0, 0, 0)

  const weekTotal = logs
    .filter((l) => new Date(l.clock_in) >= startOfWeek)
    .reduce((sum, l) => sum + getDuration(l), 0)

  // UI
  return (
    <div className="min-h-screen bg-black text-white px-4 py-6 max-w-md mx-auto">

      {!user ? (
        <div className="mt-20">
          <h1 className="text-2xl font-semibold mb-6 text-center">
            Time Tracker
          </h1>

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 mb-3 rounded-lg bg-neutral-900 border border-neutral-700"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 rounded-lg bg-neutral-900 border border-neutral-700"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 py-3 rounded-lg font-semibold mb-2"
          >
            Login
          </button>

          <button
            onClick={handleSignUp}
            className="w-full bg-neutral-800 py-3 rounded-lg"
          >
            Sign Up
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <p className="text-sm text-neutral-400">Logged in as</p>
            <p className="font-medium">{user.email}</p>

            <button
              onClick={handleLogout}
              className="text-red-500 text-sm mt-2"
            >
              Logout
            </button>
          </div>

          <div className="bg-neutral-900 p-4 rounded-xl mb-6">
            {activeLog ? (
              <>
                <p className="text-3xl font-semibold mb-4 text-center">
                  {Math.floor(elapsed / 60)}m {elapsed % 60}s
                </p>

                <button
                  onClick={clockOut}
                  disabled={saving}
                  className="w-full bg-red-600 py-3 rounded-lg font-semibold"
                >
                  {saving ? 'Saving...' : 'Clock Out'}
                </button>
              </>
            ) : (
              <button
                onClick={clockIn}
                disabled={saving}
                className="w-full bg-green-600 py-3 rounded-lg font-semibold"
              >
                {saving ? 'Saving...' : 'Clock In'}
              </button>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-neutral-400">This Week</p>
            <p className="text-xl font-semibold">
              {formatDuration(weekTotal)}
            </p>
          </div>

          <h2 className="mb-3 text-lg font-semibold">History</h2>

          {loading ? (
            <p className="text-neutral-500">Loading...</p>
          ) : (
            Object.entries(groupedLogs).map(([date, dayLogs]) => {
              const total = dayLogs.reduce(
                (sum, log) => sum + getDuration(log),
                0
              )

              return (
                <div key={date} className="mb-6">
                  <div className="flex justify-between mb-2">
                    <p className="text-sm text-neutral-400">{date}</p>
                    <p className="text-sm font-semibold">
                      {formatDuration(total)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {dayLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-neutral-900 p-3 rounded-lg text-sm"
                      >
                        <div>
                          In: {new Date(log.clock_in).toLocaleTimeString()}
                        </div>
                        <div>
                          Out:{' '}
                          {log.clock_out
                            ? new Date(log.clock_out).toLocaleTimeString()
                            : 'Active'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}