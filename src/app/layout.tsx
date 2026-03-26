import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/shared/Toast'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'DayCal — Your Daily Schedule',
  description: 'Stay on track, adapt when life happens, and celebrate your daily progress.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DayCal',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Runs before hydration to prevent dark mode flash */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('daycal_theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FAFAFA] dark:bg-[#0F0F10] text-[#1A1A1A] dark:text-gray-50">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
