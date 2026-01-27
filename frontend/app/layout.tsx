import {Providers} from "../components/Provider"
import Navbar from "@/components/Navbar"
import "./globals.css"
import {Toaster} from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="{inter.className}">
        <Providers>
          <Navbar />
          {children}
        </Providers>
        <Toaster position="top-right" richColors/>
      </body>
    </html>
  )
}
