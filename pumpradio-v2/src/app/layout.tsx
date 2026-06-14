import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PumpRadio v2 — Underground Radio',
  description:
    'Hardtechno · Hardcore · Nu Jazz · Electronic. Argentina al mundo.',
  keywords: [
    'pumpradio',
    'hardtechno',
    'hardcore',
    'nujazz',
    'electronic',
    'radio',
    'underground',
  ],
  authors: [{ name: 'PumpRadio' }],
  creator: 'PumpRadio',
  openGraph: {
    title: 'PumpRadio v2',
    description: 'Hardtechno · Hardcore · Nu Jazz · Electronic',
    type: 'website',
    siteName: 'PumpRadio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PumpRadio v2',
    description: 'Hardtechno · Hardcore · Nu Jazz · Electronic',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to stream domains for faster loading */}
        <link rel="preconnect" href="https://stream.zeno.fm" />
        <link rel="dns-prefetch" href="https://stream.zeno.fm" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
