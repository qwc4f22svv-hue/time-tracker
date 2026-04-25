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

// ✅ consistent time formatter
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

  // CLOCK IN
  const clockIn = async () => {
    if (saving) return
    setSaving(true)

    const { data, error } = await supabase
      .from('time_logs')
      .insert([{ user_id: user.id, clock_in: new Date().toISOString() }])
      .select()
      .single()

    if (error) {
      toast.error('Failed to clock in')
    } else {
      setActiveLog(data)
      toast.success('Clocked in')
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

    if (error) {
      toast.error('Failed to clock out')
    } else {
      toast.success('Clocked out')
    }

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
      <div className="max-w-md mx-auto px-5 pt-6 pb-10 flex flex-col gap-5">

        {/* 🔥 TOP ACTION */}
        <TimerCard
          activeLog={activeLog}
          saving={saving}
          onClockIn={clockIn}
          onClockOut={clockOut}
        />

        {/* TIME CARD */}
        <div className="bg-white shadow-lg border border-gray-100 rounded-3xl p-6 text-center">

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
        <div className="bg-white shadow-lg border border-gray-100 rounded-3xl p-5">
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