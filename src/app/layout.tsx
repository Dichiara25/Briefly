import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/structure/Header'
import Footer from './components/structure/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Briefly',
  description: 'Your AI-powered newsfeed in Slack',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <Header />
      <div>{children}</div>
      <Footer />
    </html>
  )
}
