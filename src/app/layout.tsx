import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import Providers from '@/app/providers'
import type { Metadata, Viewport } from 'next'
import { siteConfig } from '@/app/data/site'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | ${siteConfig.shortName}`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  keywords: ['DMRC', 'Divine Mercy', 'Retreat Center', 'Tanzania', 'Vikindu', 'Spiritual Retreat', 'Prayer', 'Faith', 'Mass intentions'],
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    locale: 'en_TZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
  },
}

export const viewport: Viewport = {
  themeColor: '#172a4a',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
      <body className='font-sans antialiased'>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
