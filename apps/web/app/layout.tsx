import type { Metadata } from 'next'
import { Press_Start_2P, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const pressStart = Press_Start_2P({ 
  weight: '400',
  subsets: ["latin"],
  variable: '--font-pixel'
});

const geist = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist'
});

export const metadata: Metadata = {
  title: 'EggoWorld - Cute 8-Bit NFT Collection',
  description: 'Join the cutest egg-themed NFT collection in the metaverse. Collect, trade, and hatch your way to glory!',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${pressStart.variable} ${geist.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
