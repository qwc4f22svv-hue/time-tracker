'use client'

import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useEffect, useState } from 'react'

export default function Header() {
  const [user, setUser] = useState<any>(null)

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

  const handleLogout = async () => {
  await supabase.auth.signOut()
  window.location.reload()
}

  return (
    <header className="w-full border-b bg-white px-4 py-3 flex justify-between items-center">
      <Link href="/" className="font-semibold">
        ⏱ Time Tracker
      </Link>

      {user && (
        <div className="flex gap-4 text-sm items-center">
          <Link href="/">Home</Link>
          <Link href="/history">History</Link>

          <button
            onClick={handleLogout}
            className="text-red-500"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  )
}