
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  // ✅ Hide nav on login page
  if (pathname === '/') return null

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
              className="flex flex-col items-center justify-center text-xs"
            >
              <div
                className={`flex flex-col items-center transition-all duration-200 ${
                  isActive
                    ? 'text-green-600 scale-105'
                    : 'text-black opacity-60'
                }`}
              >
                <Icon size={22} strokeWidth={2.2} />
                <span className="mt-1 font-medium">{item.name}</span>
              </div>

              {/* active indicator */}
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