'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type TimeLog = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [user, setUser] = useState<any>(null)

  // GET USER
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
    }

    loadUser()
  }, [])

  // FETCH LOGS
  useEffect(() => {
    if (!user) return

    const fetchLogs = async () => {
      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .eq('user_id', user.id)

      setLogs(data || [])
    }

    fetchLogs()
  }, [user])

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

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)

  // 🔹 Get Monday of current week
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay() || 7
    if (day !== 1) d.setDate(d.getDate() - day + 1)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const startOfThisWeek = getStartOfWeek(new Date())

  // 🔹 Go back 1 week → gives us 2-week window
  const startOfTwoWeeksAgo = new Date(startOfThisWeek)
  startOfTwoWeeksAgo.setDate(startOfTwoWeeksAgo.getDate() - 7)

  // 🔹 Filter logs
  const filteredLogs = logs.filter(
    (log) => new Date(log.clock_in) >= startOfTwoWeeksAgo
  )

  // 🔹 Group by day
  const grouped = filteredLogs.reduce((acc, log) => {
    const date = new Date(log.clock_in).toDateString()

    if (!acc[date]) acc[date] = []
    acc[date].push(log)

    return acc
  }, {} as Record<string, TimeLog[]>)

  // 🔹 Create daily summaries
  const dailySummary = Object.entries(grouped)
    .map(([date, logs]) => {
      const times = logs.map((log) => ({
        in: new Date(log.clock_in),
        out: log.clock_out ? new Date(log.clock_out) : null,
        duration: getDuration(log),
      }))

      const earliest = new Date(
        Math.min(...times.map((t) => t.in.getTime()))
      )

      const latest = new Date(
        Math.max(
          ...times.map((t) =>
            t.out ? t.out.getTime() : Date.now()
          )
        )
      )

      const totalDuration = times.reduce(
        (sum, t) => sum + t.duration,
        0
      )

      return {
        date,
        earliest,
        latest,
        totalDuration,
      }
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      <div className="max-w-md mx-auto px-4 py-6 pb-24">

        <h1 className="text-lg font-semibold text-gray-900 mb-4">
          Last 2 Weeks
        </h1>

        {dailySummary.length === 0 ? (
          <p className="text-gray-600 text-sm text-center mt-10">
            No logs yet
          </p>
        ) : (
          dailySummary.map((day) => (
            <div
              key={day.date}
              className="bg-white p-5 rounded-3xl shadow mb-3 border border-gray-200"
            >
              <p className="text-sm text-gray-500 mb-2">
                {day.date}
              </p>

              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">
                  In: {formatTime(day.earliest)}
                </span>
                <span className="text-gray-700">
                  Out: {formatTime(day.latest)}
                </span>
              </div>

              {/* ✅ NEW: TOTAL DURATION */}
              <p className="text-sm font-semibold text-black mt-2">
                Duration: {formatDuration(day.totalDuration)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}