import type { Metadata, Viewport } from 'next';
import { DM_Sans, Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '../components/theme-provider';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://kodecollab.com'),
  title: {
    default: 'kodecollab - Free Real-time Collaborative Code Editor | No Sign-up Required',
    template: '%s | kodecollab'
  },
  description: 'Professional online collaborative code editor for real-time pair programming and team development. Free collaborative coding platform with instant sessions, syntax highlighting for 20+ languages, and live cursor tracking. No sign-up required - start your collaborative coding session instantly.',
  keywords: [
    'online collaborative editor',
    'collaborative code editor',
    'online code editor',
    'real-time collaboration',
    'pair programming',
    'collaborative coding',
    'free code editor',
    'team coding',
    'remote programming',
    'web development',
    'programming tools',
    'collaborative programming',
    'no signup',
    'instant coding sessions'
  ],
  authors: [{ name: 'kodecollab team' }],
  creator: 'kodecollab',
  publisher: 'kodecollab',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  alternates: {
    canonical: 'https://kodecollab.com',
  },
  openGraph: {
    title: 'kodecollab - Free Real-time Collaborative Code Editor | No Sign-up Required',
    description: 'Professional online collaborative code editor for real-time pair programming and team development. Free collaborative coding platform with no sign-up required.',
    url: 'https://kodecollab.com',
    siteName: 'kodecollab',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'kodecollab - Real-time Collaborative Code Editor',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'kodecollab - Free Real-time Collaborative Code Editor',
    description: 'Professional online collaborative code editor for real-time pair programming. Free collaborative coding platform with no sign-up required.',
    images: ['/og-image.png'],
    creator: '@kodecollab',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Technology',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Toaster position="bottom-right" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
