'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<any[]>([])
  const [missingUsers, setMissingUsers] = useState<any[]>([])

  // FORMAT TIME
  const formatTime = (dateString: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(dateString + 'Z'))

  // =========================
  // ✅ WEEKLY TOTAL REPORT
  // =========================
  const downloadWeeklyReport = async () => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const { data: logs } = await supabase
      .from('time_logs')
      .select('user_id, clock_in, clock_out')
      .gte('clock_in', startOfWeek.toISOString())

    const { data: users } = await supabase
      .from('profiles')
      .select('id, email')

    const emailMap: Record<string, string> = {}
    ;(users || []).forEach((u: any) => {
      emailMap[u.id] = u.email
    })

    const totals: Record<string, number> = {}

    ;(logs || []).forEach((log: any) => {
      const start = new Date(log.clock_in).getTime()
      const end = log.clock_out
        ? new Date(log.clock_out).getTime()
        : Date.now()

      const email = emailMap[log.user_id] || log.user_id

      if (!totals[email]) totals[email] = 0
      totals[email] += end - start
    })

    const rows = Object.entries(totals).map(([email, total]) => {
      const mins = Math.floor(total / 60000)
      const h = Math.floor(mins / 60)
      const m = mins % 60
      return [email, `${h}h ${m}m`]
    })

    const csv = [['Email', 'Total Time'], ...rows]
      .map((r) => r.join(','))
      .join('\n')

    downloadCSV(csv, 'weekly-summary.csv')
  }

  // =========================
  // ✅ WEEKLY BREAKDOWN REPORT
  // =========================
  const downloadWeeklyBreakdown = async () => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const { data: logs } = await supabase
      .from('time_logs')
      .select('user_id, clock_in, clock_out')
      .gte('clock_in', startOfWeek.toISOString())
      .lt('clock_in', endOfWeek.toISOString())

    const { data: users } = await supabase
      .from('profiles')
      .select('id, email')

    const emailMap: Record<string, string> = {}
    ;(users || []).forEach((u: any) => {
      emailMap[u.id] = u.email
    })

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(d.getDate() + i)
      days.push(d)
    }

    const dataMap: Record<string, Record<string, any[]>> = {}

    ;(logs || []).forEach((log: any) => {
      const dayKey = new Date(log.clock_in).toISOString().split('T')[0]
      const email = emailMap[log.user_id] || log.user_id

      if (!dataMap[email]) dataMap[email] = {}
      if (!dataMap[email][dayKey]) dataMap[email][dayKey] = []

      dataMap[email][dayKey].push(log)
    })

    const header = ['Email']

    days.forEach((d) => {
      header.push(
        d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: '2-digit',
        })
      )
    })

    const rows = Object.keys(dataMap).map((email) => {
      const row: string[] = [email]

      days.forEach((d) => {
        const key = d.toISOString().split('T')[0]
        const logs = dataMap[email][key] || []

        if (!logs.length) {
          row.push('')
          return
        }

        let earliest = Infinity
        let latest = 0
        let total = 0

        logs.forEach((log: any) => {
          const start = new Date(log.clock_in).getTime()
          const end = log.clock_out
            ? new Date(log.clock_out).getTime()
            : Date.now()

          earliest = Math.min(earliest, start)
          latest = Math.max(latest, end)
          total += end - start
        })

        const mins = Math.floor(total / 60000)
        const h = Math.floor(mins / 60)
        const m = mins % 60

        const format = (t: number) =>
          new Date(t).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })

        row.push(
          `${format(earliest)}-${format(latest)} (${h}h ${m}m)`
        )
      })

      return row
    })

    const csv = [header, ...rows]
      .map((r) => r.join(','))
      .join('\n')

    downloadCSV(csv, 'weekly-breakdown.csv')
  }

  // DOWNLOAD HELPER
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  }

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user ?? null
      setUser(user)

      if (!user) return

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setRole(roleData?.role ?? null)

      const { data: logs } = await supabase
        .from('time_logs')
        .select('id, user_id, clock_in')
        .is('clock_out', null)

      const { data: users } = await supabase
        .from('profiles')
        .select('id, email')

      const emailMap: Record<string, string> = {}
      ;(users || []).forEach((u: any) => {
        emailMap[u.id] = u.email
      })

      const active = (logs || []).map((l: any) => ({
        ...l,
        email: emailMap[l.user_id] || l.user_id,
      }))

      setActiveUsers(active)

      // MISSING USERS
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayLogs } = await supabase
        .from('time_logs')
        .select('user_id')
        .gte('clock_in', today.toISOString())

      const loggedIds = new Set(
        (todayLogs || []).map((l) => l.user_id)
      )

      const missing = (users || []).filter(
        (u) => !loggedIds.has(u.id)
      )

      setMissingUsers(missing)
    }

    load()
  }, [])

  if (role !== 'admin') {
    return <div className="p-6 text-center">Not allowed</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="max-w-md mx-auto">

        <h1 className="text-xl font-semibold mb-4">
          Admin Dashboard
        </h1>

        {/* BUTTONS */}
        <button
          onClick={downloadWeeklyReport}
          className="w-full bg-green-600 text-white py-2 rounded-xl mb-2"
        >
          Download Weekly Summary
        </button>

        <button
          onClick={downloadWeeklyBreakdown}
          className="w-full bg-blue-600 text-white py-2 rounded-xl mb-4"
        >
          Download Weekly Breakdown
        </button>

        {/* ACTIVE USERS */}
        <div className="bg-white rounded-3xl p-5 shadow border">
          <h2 className="text-lg font-semibold mb-3">
            Currently Clocked In
          </h2>

          {activeUsers.length === 0 ? (
            <p>No active users</p>
          ) : (
            activeUsers.map((u: any) => (
              <div key={u.id} className="mb-2">
                <p className="font-medium">{u.email}</p>
                <p className="text-xs text-gray-500">
                  Started at {formatTime(u.clock_in)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* MISSING USERS */}
        <div className="bg-white rounded-3xl p-5 shadow border mt-4">
          <h2 className="text-lg font-semibold mb-3">
            Not Clocked In Today
          </h2>

          {missingUsers.length === 0 ? (
            <p>Everyone has clocked in 🎉</p>
          ) : (
            missingUsers.map((u: any) => (
              <div key={u.id}>{u.email}</div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}