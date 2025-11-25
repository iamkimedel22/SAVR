"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Transaction {
  id: number
  category: string
  amount: number
  type: "income" | "expense"
  date: string
  note: string
}

interface Category {
  id: number
  name: string
}

export default function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(searchParams.get("action") === "new")
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    type: "expense" as "income" | "expense",
    date: new Date().toISOString().split("T")[0],
    note: "",
  })

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      const [transRes, catRes] = await Promise.all([
        fetch("/api/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (transRes.status === 401 || catRes.status === 401) {
        localStorage.removeItem("accessToken")
        router.push("/login")
        return
      }

      const transData = await transRes.json()
      const catData = await catRes.json()
      setTransactions(transData)
      setCategories(catData)
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({
          amount: "",
          category: "",
          type: "expense",
          date: new Date().toISOString().split("T")[0],
          note: "",
        })
        fetchData()
      }
    } catch (err) {
      console.error("Failed to add transaction", err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    router.push("/login")
  }

  const handleDeleteTransaction = async (id: number) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        const token = localStorage.getItem("accessToken")
        const response = await fetch(`/api/transactions/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          fetchData()
        }
      } catch (err) {
        console.error("Failed to delete transaction", err)
      }
    }
  }

  const handleExportCSV = () => {
    const headers = ["Date", "Category", "Type", "Amount", "Note"]
    const rows = transactions.map((t) => [t.date, t.category, t.type, t.amount, t.note])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transactions.csv"
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading transactions...</div>
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
          <Link href="/transactions" className="text-primary font-medium border-b-2 border-primary pb-2">
            Transactions
          </Link>
          <Link href="/budgets" className="text-muted-foreground hover:text-foreground pb-2">
            Budgets
          </Link>
          <Link href="/goals" className="text-muted-foreground hover:text-foreground pb-2">
            Goals
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="border-card-border text-foreground bg-transparent"
            >
              📥 Export CSV
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-primary hover:bg-primary-dark text-black font-semibold"
            >
              ➕ Add Transaction
            </Button>
          </div>
        </div>

        {/* Transaction List */}
        <Card className="bg-card-bg border-card-border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-card-border">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Date</th>
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Category</th>
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Type</th>
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Note</th>
                  <th className="text-left px-6 py-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No transactions yet. Add one to get started!
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-card-border hover:bg-neutral-800/50">
                      <td className="px-6 py-4 text-foreground">{tx.date}</td>
                      <td className="px-6 py-4 text-foreground">{tx.category}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center gap-2 font-medium ${tx.type === "income" ? "text-success" : "text-error"}`}
                        >
                          {tx.type === "income" ? "📥" : "📤"}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        ₱{tx.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">{tx.note}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                          ✏️
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-error hover:text-error/80"
                        >
                          🗑️
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="bg-card-bg border-card-border w-full max-w-md">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">Add Transaction</h2>

                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Amount</label>
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

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                      className="w-full bg-neutral-800 border border-card-border rounded px-3 py-2 text-foreground"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as "income" | "expense" })}
                      className="w-full bg-neutral-800 border border-card-border rounded px-3 py-2 text-foreground"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="bg-neutral-800 border-card-border text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Note</label>
                    <Input
                      type="text"
                      placeholder="Optional note"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                      Add
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
