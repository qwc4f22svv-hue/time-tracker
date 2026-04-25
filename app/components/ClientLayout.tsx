'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import BottomNav from './BottomNav'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLogin = pathname === '/'

  return (
    <>
      {!isLogin && <Header />}

      {children}

      {!isLogin && <BottomNav />}
    </>
  )
}