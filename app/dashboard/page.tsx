"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface DashboardStats {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  savingsGoalsProgress: number
  userName?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        localStorage.removeItem("accessToken")
        router.push("/login")
        return
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch dashboard data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-black text-lg font-bold">💰</span>
            </div>
            <span className="text-xl font-bold text-foreground">SAVR</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-foreground">Welcome, {stats?.userName || "User"}</span>
            <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <div className="border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-6">
          <Link href="/dashboard" className="text-primary font-medium border-b-2 border-primary pb-2">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-muted-foreground hover:text-foreground pb-2">
            Transactions
          </Link>
          <Link href="/budgets" className="text-muted-foreground hover:text-foreground pb-2">
            Budgets
          </Link>
          <Link href="/goals" className="text-muted-foreground hover:text-foreground pb-2">
            Goals
          </Link>
          <Link href="/analytics" className="text-muted-foreground hover:text-foreground pb-2">
            Analytics
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {/* Balance Card */}
          <Card className="bg-card-bg border-card-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-muted-foreground text-sm font-medium">Total Balance</h3>
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl">💰</div>
              </div>
              <p className="text-3xl font-bold text-foreground">
                ₱{(stats?.totalBalance || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </Card>

          {/* Monthly Income */}
          <Card className="bg-card-bg border-card-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-muted-foreground text-sm font-medium">Monthly Income</h3>
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center text-xl">📈</div>
              </div>
              <p className="text-3xl font-bold text-success">
                ₱{(stats?.monthlyIncome || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </Card>

          {/* Monthly Expenses */}
          <Card className="bg-card-bg border-card-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-muted-foreground text-sm font-medium">Monthly Expenses</h3>
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center text-xl">📉</div>
              </div>
              <p className="text-3xl font-bold text-error">
                ₱{(stats?.monthlyExpense || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
              </p>
            </div>
          </Card>

          {/* Savings Goals */}
          <Card className="bg-card-bg border-card-border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-muted-foreground text-sm font-medium">Savings Progress</h3>
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center text-xl">🎯</div>
              </div>
              <p className="text-3xl font-bold text-info">{(stats?.savingsGoalsProgress || 0).toFixed(0)}%</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <Link href="/transactions?action=new">
            <Card className="bg-card-bg border-card-border hover:border-primary/50 cursor-pointer transition">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">➕</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Add Transaction</h3>
                    <p className="text-sm text-muted-foreground">Record new expense or income</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/budgets">
            <Card className="bg-card-bg border-card-border hover:border-primary/50 cursor-pointer transition">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center text-2xl">⚙️</div>
                  <div>
                    <h3 className="font-semibold text-foreground">View Budgets</h3>
                    <p className="text-sm text-muted-foreground">Check spending limits and progress</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/goals">
            <Card className="bg-card-bg border-card-border hover:border-primary/50 cursor-pointer transition">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center text-2xl">🏆</div>
                  <div>
                    <h3 className="font-semibold text-foreground">Savings Goals</h3>
                    <p className="text-sm text-muted-foreground">Track your financial targets</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/analytics">
            <Card className="bg-card-bg border-card-border hover:border-primary/50 cursor-pointer transition">
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-2xl">📊</div>
                  <div>
                    <h3 className="font-semibold text-foreground">View Analytics</h3>
                    <p className="text-sm text-muted-foreground">Visualize spending patterns</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
