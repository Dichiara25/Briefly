import type { Metadata } from 'next'
import { Roboto } from 'next/font/google'
import {Toaster} from "react-hot-toast";
import './globals.css';
import Header from './components/structure/Header';
import Footer from './components/structure/Footer';

export const APP_NAME = "Briefly";
export const DOMAIN_NAME = "briefly.rocks"

const roboto = Roboto({
  weight: '400',
  subsets: ['latin'],
})

function AppMetadata() {
  return <head>
    <title>{APP_NAME}</title>
    <meta name='description' content='Your AI-powered newsfeed in Slack' />
  </head>
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={roboto.className}>
      <AppMetadata />
      <Toaster />
      <Header />
      <div>{children}</div>
      <Footer />
    </html>
  )
}
