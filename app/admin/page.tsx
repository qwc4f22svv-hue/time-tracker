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

  // ✅ WEEKLY REPORT (NO JOINS - STABLE)
  const downloadWeeklyReport = async () => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    // 1. GET LOGS
    const { data: logs, error } = await supabase
      .from('time_logs')
      .select('user_id, clock_in, clock_out')
      .gte('clock_in', startOfWeek.toISOString())

    if (error) {
      console.error(error)
      alert('Failed to fetch logs')
      return
    }

    // 2. GET USERS
    const { data: users } = await supabase
      .from('profiles')
      .select('id, email')

    // 3. MAP IDs → EMAILS
    const emailMap: Record<string, string> = {}
    ;(users || []).forEach((u: any) => {
      emailMap[u.id] = u.email
    })

    // 4. GROUP DATA
    const totals: Record<string, { email: string; total: number }> = {}

    ;(logs || []).forEach((log: any) => {
      const start = new Date(log.clock_in).getTime()
      const end = log.clock_out
        ? new Date(log.clock_out).getTime()
        : Date.now()

      const duration = end - start
      const email = emailMap[log.user_id] || log.user_id

      if (!totals[email]) {
        totals[email] = { email, total: 0 }
      }

      totals[email].total += duration
    })

    // 5. FORMAT CSV
    const rows = Object.values(totals).map((u) => {
      const mins = Math.floor(u.total / 60000)
      const h = Math.floor(mins / 60)
      const m = mins % 60

      return [u.email, `${h}h ${m}m`]
    })

    const csv = [
      ['Email', 'Total Time'],
      ...rows,
    ]
      .map((r) => r.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'weekly-summary.csv'
    a.click()

    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user ?? null
      setUser(user)

      if (!user) return

      // ROLE
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setRole(roleData?.role ?? null)

      // ✅ ACTIVE USERS (NO JOIN NEEDED)
      const { data: active } = await supabase
        .from('time_logs')
        .select('id, user_id, clock_in')
        .is('clock_out', null)

      // GET EMAILS FOR ACTIVE USERS
      const { data: users } = await supabase
        .from('profiles')
        .select('id, email')

      const emailMap: Record<string, string> = {}
      ;(users || []).forEach((u: any) => {
        emailMap[u.id] = u.email
      })

      const activeWithEmails = (active || []).map((log: any) => ({
        ...log,
        email: emailMap[log.user_id] || log.user_id,
      }))

      setActiveUsers(activeWithEmails)

      // MISSING USERS
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, email')

      const { data: todayLogs } = await supabase
        .from('time_logs')
        .select('user_id, clock_in')
        .gte('clock_in', today.toISOString())

      const loggedInIds = new Set(
        (todayLogs || []).map((l) => l.user_id)
      )

      const missing = (allUsers || []).filter(
        (u) => !loggedInIds.has(u.id)
      )

      setMissingUsers(missing)
    }

    load()
  }, [])

  // 🔒 PROTECT PAGE
  if (role !== 'admin') {
    return <div className="p-6 text-center">Not allowed</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="max-w-md mx-auto">

        <h1 className="text-xl font-semibold mb-4">
          Admin Dashboard
        </h1>

        {/* DOWNLOAD */}
        <button
          onClick={downloadWeeklyReport}
          className="w-full bg-green-600 text-white py-2 rounded-xl mb-4"
        >
          Download Weekly Report
        </button>

        {/* ACTIVE USERS */}
        <div className="bg-white rounded-3xl p-5 shadow border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">
            Currently Clocked In
          </h2>

          {activeUsers.length === 0 ? (
            <p className="text-sm text-gray-500">
              No active users
            </p>
          ) : (
            activeUsers.map((u: any) => (
              <div
                key={u.id}
                className="text-sm mb-3 border-b pb-2 last:border-0"
              >
                <p className="font-medium text-black">
                  {u.email}
                </p>
                <p className="text-gray-500 text-xs">
                  Started at {formatTime(u.clock_in)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* MISSING USERS */}
        <div className="bg-white rounded-3xl p-5 shadow border border-gray-200 mt-4">
          <h2 className="text-lg font-semibold mb-3">
            Not Clocked In Today
          </h2>

          {missingUsers.length === 0 ? (
            <p className="text-sm text-gray-500">
              Everyone has clocked in 🎉
            </p>
          ) : (
            missingUsers.map((u: any) => (
              <div
                key={u.id}
                className="text-sm mb-2 border-b pb-2 last:border-0"
              >
                {u.email}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}