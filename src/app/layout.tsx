import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LekToDo — จัดการงานของคุณ',
  description: 'แอป To-Do สวยงาม ใช้งานง่าย รองรับทุกอุปกรณ์ พร้อมติดตามความคืบหน้าทุกงาน',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LekToDo',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isProd = process.env.NODE_ENV === 'production'

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="LekToDo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const sys = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && sys)) document.documentElement.classList.add('dark');
              } catch (e) {}
              const isProd = ${JSON.stringify(isProd)};
              if (isProd && 'serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              } else if (!isProd && 'serviceWorker' in navigator) {
                window.addEventListener('load', async () => {
                  try {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map((reg) => reg.unregister()));
                    if ('caches' in window) {
                      const keys = await caches.keys();
                      await Promise.all(keys.map((key) => caches.delete(key)));
                    }
                  } catch (e) {}
                });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gradient-mesh antialiased">{children}</body>
    </html>
  )
}
