import { Toaster } from 'react-hot-toast'
import BottomNav from './components/BottomNav'
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Header from "./components/Header"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Time Tracker",
  description: "Track your working hours",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-black">
        <Header />

        {/* 🔥 TOASTS */}
        <Toaster position="top-center" />

        <main className="flex-1 w-full">
          {children}
        </main>
      </body>
    </html>
  )
}