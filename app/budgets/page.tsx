"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Budget {
  id: number
  category: string
  amount: number
  spent: number
  percentage: number
}

export default function BudgetsPage() {
  const router = useRouter()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchBudgets()
  }, [router])

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/budgets", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        localStorage.removeItem("accessToken")
        router.push("/login")
        return
      }

      const data = await response.json()
      setBudgets(data)
    } catch (err) {
      console.error("Failed to fetch budgets", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({ category: "", amount: "" })
        fetchBudgets()
      }
    } catch (err) {
      console.error("Failed to add budget", err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    router.push("/login")
  }

  const handleDeleteBudget = async (id: number) => {
    if (confirm("Delete this budget?")) {
      try {
        const token = localStorage.getItem("accessToken")
        console.log(`Deleting budget ${id}...`)
        const response = await fetch(`/api/budgets/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })

        console.log(`Delete response status: ${response.status}`)
        const data = await response.json()
        console.log(`Delete response data:`, data)

        if (response.ok) {
          setError("")
          fetchBudgets()
        } else {
          setError(data.message || "Failed to delete budget")
        }
      } catch (err) {
        console.error("Failed to delete budget", err)
        setError("An error occurred while deleting the budget")
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading budgets...</div>
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
          <Link href="/budgets" className="text-primary font-medium border-b-2 border-primary pb-2">
            Budgets
          </Link>
          <Link href="/goals" className="text-muted-foreground hover:text-foreground pb-2">
            Goals
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error text-error rounded">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-primary hover:bg-primary-dark text-black font-semibold"
          >
            ➕ Add Budget
          </Button>
        </div>

        {/* Budgets Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {budgets.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No budgets yet</p>
              <Button
                onClick={() => setShowModal(true)}
                className="bg-primary hover:bg-primary-dark text-black font-semibold"
              >
                Create your first budget
              </Button>
            </div>
          ) : (
            budgets.map((budget) => (
              <Card key={budget.id} className="bg-card-bg border-card-border">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{budget.category}</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBudget(budget.id)}
                      className="border-error text-error hover:bg-error/10"
                    >
                      DELETE
                    </Button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">
                        ₱{Number(budget.spent ?? 0).toFixed(2)} of ₱{Number(budget.amount ?? 0).toFixed(2)}
                      </span>
                      <span className="font-semibold text-foreground">{budget.percentage}%</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div
                        className={`h-full rounded-full transition-all ${
                          budget.percentage > 100 ? "bg-error" : "bg-primary"
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <p className={`text-sm ${budget.percentage > 100 ? "text-error" : "text-success"}`}>
                    {budget.percentage > 100
                      ? `Over budget by ₱${Number((budget.spent ?? 0) - (budget.amount ?? 0)).toFixed(2)}`
                      : `₱${Number((budget.amount ?? 0) - (budget.spent ?? 0)).toFixed(2)} remaining`}
                  </p>
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
                <h2 className="text-2xl font-bold text-foreground mb-6">Create Budget</h2>

                <form onSubmit={handleAddBudget} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <Input
                      type="text"
                      placeholder="e.g., Food, Transport"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="bg-neutral-800 border-card-border text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Budget Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
