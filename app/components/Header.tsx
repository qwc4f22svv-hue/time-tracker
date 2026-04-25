'use client'

import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function Header() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="w-full border-b bg-white px-4 py-3 flex justify-between items-center">
      <h1 className="font-semibold text-black">
        Time Tracker
      </h1>

      <div className="flex gap-4 text-sm">
        <Link href="/" className="text-black">Home</Link>
        <Link href="/history" className="text-black">History</Link>
        <button onClick={handleLogout} className="text-red-600">
          Logout
        </button>
      </div>
    </div>
  )
}