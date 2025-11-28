"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (token) {
      setIsLoggedIn(true)
      router.push("/dashboard")
    }
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center transition-all duration-1000 ease-in-out">
        <div className="text-center opacity-0 animate-fade-in">
          <h1 className="text-7xl font-bold text-black tracking-wider drop-shadow-lg">SAVR</h1>
          <p className="text-black text-lg mt-4 opacity-75">Take control of your finances</p>
        </div>

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .animate-fade-in {
            animation: fadeIn 1s ease-in-out forwards;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-card-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-black text-lg font-bold">💰</span>
          </div>
          <span className="text-xl font-bold text-foreground">SAVR</span>
        </div>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-foreground hover:bg-card-bg">
              Login
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary-dark text-black font-semibold">Sign Up</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Take Control of Your <span className="text-primary">Finances</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Track expenses, manage budgets, and achieve your savings goals. Simple, secure, and designed for you.
            </p>
            <div className="flex gap-4">
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary-dark text-black font-semibold px-8 py-6 text-lg">
                  Get Started →
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-card-border hover:bg-card-bg px-8 py-6 text-lg bg-transparent"
              >
                Learn More
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card-bg border border-card-border rounded-lg p-6">
              <span className="text-3xl mb-4 block">📊</span>
              <h3 className="font-semibold text-foreground mb-2">Track Spending</h3>
              <p className="text-sm text-muted-foreground">Monitor every transaction in real-time</p>
            </div>
            <div className="bg-card-bg border border-card-border rounded-lg p-6">
              <span className="text-3xl mb-4 block">🎯</span>
              <h3 className="font-semibold text-foreground mb-2">Set Goals</h3>
              <p className="text-sm text-muted-foreground">Define and reach your financial targets</p>
            </div>
            <div className="bg-card-bg border border-card-border rounded-lg p-6 md:col-span-2">
              <span className="text-3xl mb-4 block">📈</span>
              <h3 className="font-semibold text-foreground mb-2">Visual Analytics</h3>
              <p className="text-sm text-muted-foreground">See patterns in your spending with beautiful charts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-8 px-6 text-center text-muted-foreground">
        <p>© 2025 SAVR. Personal Finance Management Made Simple.</p>
      </footer>
    </div>
  )
}
