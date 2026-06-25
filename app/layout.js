import './globals.css'

export const metadata = {
  title: 'KKPAY | KKYC 2026',
  description: 'ASSET MONITORING SYSTEM',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#020617] text-white">
        {children}
      </body>
    </html>
  )
}