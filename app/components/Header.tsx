'use client'

import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../providers/AuthProvider' // ✅ use global auth

export default function Header() {
  const { user, loading } = useAuth() // ✅ reactive

  // ✅ prevent flicker
  if (loading) return null

  // ❌ Hide header if NOT logged in
  if (!user) return null

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 py-3 flex justify-between items-center">

      <h1 className="font-semibold text-black">
        Time Tracker
      </h1>

      <div className="flex gap-4 text-sm">
        <Link href="/" className="text-black">
          Home
        </Link>

        <Link href="/history" className="text-black">
          History
        </Link>

        <button
          onClick={handleLogout}
          className="text-red-600"
        >
          Logout
        </button>
      </div>
    </div>
  )
}