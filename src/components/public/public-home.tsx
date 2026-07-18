'use client'

import { useState } from 'react'
import { Navbar } from './navbar'
import { Hero } from './hero'
import { About } from './about'
import { Contact } from './contact'
import { Footer } from './footer'
import { LoginDialog } from '@/components/auth/login-dialog'

export function PublicHome() {
  const [loginOpen, setLoginOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onLogin={() => setLoginOpen(true)} />
      <main className="flex-1">
        <Hero onLogin={() => setLoginOpen(true)} />
        <About />
        <Contact />
      </main>
      <Footer onLogin={() => setLoginOpen(true)} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  )
}
