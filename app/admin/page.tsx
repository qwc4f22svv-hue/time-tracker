'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [activeUsers, setActiveUsers] = useState<any[]>([])

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

      // get active sessions
      const { data: active } = await supabase
        .from('time_logs')
        .select('*')
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
                className="text-sm mb-2"
              >
                User: {u.user_id}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}