'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import TimerCard from './components/TimerCard'
import WeeklyBreakdown from './components/WeeklyBreakdown'
import Header from './components/Header' // ✅ ADD THIS
import toast from 'react-hot-toast'

type TimeLog = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
}

// ✅ formatter
const formatTime = (dateString: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateString + 'Z'))

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [saving, setSaving] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  // AUTH
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
    }
    loadUser()
  }, [])

  // ✅ LIVE CLOCK (FIXED)
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

  const clockIn = async () => {
    if (saving) return
    setSaving(true)

    const { data } = await supabase
      .from('time_logs')
      .insert([{ user_id: user.id, clock_in: new Date().toISOString() }])
      .select()
      .single()

    setActiveLog(data)
    setSaving(false)
  }

  const clockOut = async () => {
    if (!activeLog) return
    setSaving(true)

    await supabase
      .from('time_logs')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', activeLog.id)

    setActiveLog(null)
    setSaving(false)
  }

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

      {/* ✅ HEADER BACK */}
      <Header />

      <div className="max-w-md mx-auto px-5 pt-6 pb-10 flex flex-col gap-5">

        {/* BUTTON */}
        <TimerCard
          activeLog={activeLog}
          saving={saving}
          onClockIn={clockIn}
          onClockOut={clockOut}
        />

        {/* TIME CARD */}
        <div className="bg-white shadow-xl border border-gray-300 rounded-3xl p-6 text-center">

          <p className="text-sm text-neutral-500 mb-1">
            Current time
          </p>

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
        <div className="bg-white shadow-xl border border-gray-300 rounded-3xl p-5">
          <h2 className="text-lg font-semibold text-black mb-4">
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