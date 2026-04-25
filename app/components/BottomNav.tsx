'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function BottomNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user ?? null)
    }

    getUser()
  }, [])

  // ❌ Hide if not logged in
  if (!user) return null

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'History', href: '/history', icon: Clock },
  ]

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto flex justify-around py-3">

        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex flex-col items-center text-xs"
            >
              <div
                className={`flex flex-col items-center ${
                  isActive
                    ? 'text-green-600 scale-105'
                    : 'text-black opacity-60'
                }`}
              >
                <Icon size={22} />
                <span className="mt-1 font-medium">{item.name}</span>
              </div>

              {isActive && (
                <div className="mt-1 h-[3px] w-6 rounded-full bg-green-600" />
              )}
            </Link>
          )
        })}

      </div>
    </div>
  )
}