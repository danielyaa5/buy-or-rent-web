import type { Metadata, Viewport } from 'next'
import { DM_Sans, Manrope } from 'next/font/google'

import { getSiteUrl } from '@/lib/site'

import './globals.css'

const display = Manrope({
  variable: '--font-display',
  subsets: ['latin'],
})

const body = DM_Sans({
  variable: '--font-body',
  subsets: ['latin'],
})

const siteUrl = getSiteUrl()

export const metadata: Metadata = {
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  robots: siteUrl ? { index: true, follow: true } : { index: false, follow: false },
  title: {
    default: 'Buy or Rent? Make the Call With Better Math',
    template: '%s | Buy or Rent',
  },
  description:
    'Compare the true cost of buying a home versus renting and investing. See your break-even point, projected wealth, and the assumptions driving the result.',
  keywords: [
    'buy vs rent calculator',
    'rent or buy',
    'home buying calculator',
    'mortgage calculator',
    'rent vs own',
  ],
  openGraph: {
    title: 'Buy or Rent? Make the Call With Better Math',
    description:
      'A transparent home-buying calculator that shows the wealth impact, break-even point, and assumptions behind your result.',
    type: 'website',
    siteName: 'Buy or Rent',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Buy or Rent? Make the Call With Better Math',
    description:
      'Compare buying with renting and investing—without the spreadsheet headache.',
  },
  alternates: siteUrl ? { canonical: '/' } : undefined,
}

export const viewport: Viewport = {
  themeColor: '#102a2a',
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        {children}
      </body>
    </html>
  )
}
