'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<any[]>([])

  // FORMAT TIME
  const formatTime = (dateString: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(dateString + 'Z'))

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const user = data.session?.user ?? null
      setUser(user)

      if (!user) return

      // get role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      setRole(roleData?.role ?? null)

      // ✅ get active sessions WITH profiles join
      const { data: active } = await supabase
        .from('time_logs')
        .select(`
          id,
          user_id,
          clock_in,
          profiles (
            email
          )
        `)
        .is('clock_out', null)

      setActiveUsers(active || [])
    }

    load()
  }, [])

  // 🔒 PROTECT PAGE
  if (role !== 'admin') {
    return (
      <div className="p-6 text-center">
        Not allowed
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="max-w-md mx-auto">

        <h1 className="text-xl font-semibold mb-4">
          Admin Dashboard
        </h1>

        <div className="bg-white rounded-3xl p-5 shadow border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">
            Currently Clocked In
          </h2>

          {activeUsers.length === 0 ? (
            <p className="text-sm text-gray-500">
              No active users
            </p>
          ) : (
            activeUsers.map((u) => (
              <div
                key={u.id}
                className="text-sm mb-3 border-b pb-2 last:border-0"
              >
                <p className="font-medium text-black">
                  {u.profiles?.email || 'Unknown user'}
                </p>
                <p className="text-gray-500 text-xs">
                  Started at {formatTime(u.clock_in)}
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}