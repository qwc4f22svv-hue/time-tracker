'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Settings } from 'lucide-react'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'History', href: '/history', icon: Clock },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur border-t shadow-lg">
      <div className="max-w-md mx-auto flex justify-around py-2">
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
                    ? 'text-blue-600 scale-105'
                    : 'text-gray-400'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className="mt-1">{item.name}</span>
              </div>

              {/* active indicator */}
              {isActive && (
                <div className="mt-1 h-1 w-6 rounded-full bg-blue-600" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}