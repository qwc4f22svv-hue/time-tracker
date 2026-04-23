'use client'

import { supabase } from '@/lib/supabase'

export default function LogoutButton() {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
      return
    }

    // safer than reload
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-600"
    >
      Logout
    </button>
  )
}