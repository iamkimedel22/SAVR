"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface SavingsGoal {
  id: number
  title: string
  targetAmount: number
  currentAmount: number
  deadline: string
  percentage: number
}

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    deadline: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchGoals()
  }, [router])

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/goals", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        localStorage.removeItem("accessToken")
        router.push("/login")
        return
      }

      const data = await response.json()
      setGoals(data)
    } catch (err) {
      console.error("Failed to fetch goals", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ title: "", targetAmount: "", deadline: "" })
        fetchGoals()
      }
    } catch (err) {
      console.error("Failed to add goal", err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    router.push("/login")
  }

  const handleDeleteGoal = async (id: number) => {
    if (confirm("Delete this goal?")) {
      try {
        const token = localStorage.getItem("accessToken")
        const response = await fetch(`/api/goals/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          fetchGoals()
        }
      } catch (err) {
        console.error("Failed to delete goal", err)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading goals...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-black text-lg">💰</span>
              </div>
              <span className="text-xl font-bold text-foreground">SAVR</span>
            </Link>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            🚪
          </Button>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <div className="border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-6">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground pb-2">
            Dashboard
          </Link>
          <Link href="/transactions" className="text-muted-foreground hover:text-foreground pb-2">
            Transactions
          </Link>
          <Link href="/budgets" className="text-muted-foreground hover:text-foreground pb-2">
            Budgets
          </Link>
          <Link href="/goals" className="text-primary font-medium border-b-2 border-primary pb-2">
            Goals
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Savings Goals</h1>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary-dark text-black font-semibold"
          >
            ➕ New Goal
          </Button>
        </div>

        {/* Goals Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {goals.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No savings goals yet</p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-primary hover:bg-primary-dark text-black font-semibold"
              >
                Create your first goal
              </Button>
            </div>
          ) : (
            goals.map((goal) => (
              <Card key={goal.id} className="bg-card-bg border-card-border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{goal.title}</h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-error hover:text-error/80"
                    >
                      🗑️
                    </Button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        ₱{Number(goal.currentAmount ?? 0).toFixed(2)} of ₱{Number(goal.targetAmount ?? 0).toFixed(2)}
                      </span>
                      <span className="font-semibold text-foreground">{goal.percentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div
                        className="h-full bg-success rounded-full transition-all"
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Target: {goal.deadline}</span>
                      <span className="text-success font-medium">
                      ₱{Number((goal.targetAmount ?? 0) - (goal.currentAmount ?? 0)).toFixed(2)} to go
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-card-bg border-card-border w-full max-w-md">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">New Savings Goal</h2>

                <form onSubmit={handleAddGoal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Goal Title</label>
                    <Input
                      type="text"
                      placeholder="e.g., New Laptop"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="bg-neutral-800 border-card-border text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Target Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.targetAmount}
                      onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                      required
                      className="bg-neutral-800 border-card-border text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Target Date</label>
                    <Input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      required
                      className="bg-neutral-800 border-card-border text-foreground"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                      className="flex-1 border-card-border"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-black font-semibold">
                      Create
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
