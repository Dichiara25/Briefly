import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import './globals.css'
import Header from './components/structure/Header'
import Footer from './components/structure/Footer'

export const APP_NAME = "Briefly";
export const DOMAIN_NAME = "briefly.rocks"

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Your AI-powered newsfeed in Slack',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={roboto.className}>
      <Header />
      <div>{children}</div>
      <Footer />
    </html>
  )
}
