"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"

interface ChartData {
  spendingByCategory: Array<{ name: string; value: number }>
  monthlyTrend: Array<{ month: string; total: number }>
  incomeVsExpense: Array<{ month: string; income: number; expense: number }>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [chartData, setChartData] = useState<ChartData>({
    spendingByCategory: [],
    monthlyTrend: [],
    incomeVsExpense: [],
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">("month")

  const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"]

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }

    fetchChartData()
  }, [router, timeRange])

  const fetchChartData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.status === 401) {
        localStorage.removeItem("accessToken")
        router.push("/login")
        return
      }

      if (!response.ok) {
        console.error("Analytics API error:", response.status)
        return
      }

      const data = await response.json()
      setChartData({
        spendingByCategory: data.spendingByCategory || [],
        monthlyTrend: data.monthlyTrend || [],
        incomeVsExpense: data.incomeVsExpense || [],
      })
    } catch (err) {
      console.error("Failed to fetch chart data", err)
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
        <div className="text-muted-foreground">Loading analytics...</div>
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
                <DollarSign className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-foreground">SAVR</span>
            </Link>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="p-0 hover:opacity-80">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground hover:text-foreground"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
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
          <Link href="/goals" className="text-muted-foreground hover:text-foreground pb-2">
            Goals
          </Link>
          <Link href="/analytics" className="text-primary font-medium border-b-2 border-primary pb-2">
            Analytics
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Financial Analytics</h1>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(["month", "quarter", "year"] as const).map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range)}
                variant={timeRange === range ? "default" : "outline"}
                className={timeRange === range ? "bg-primary text-black" : "border-card-border"}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Spending by Category - Pie Chart */}
          <Card className="bg-card-bg border-card-border">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Spending by Category</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData?.spendingByCategory || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ₱${Number(value ?? 0).toFixed(2)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(chartData?.spendingByCategory || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₱${Number(value ?? 0).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Income vs Expenses - Bar Chart */}
          <Card className="bg-card-bg border-card-border">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Income vs Expenses</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData?.incomeVsExpense || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                    formatter={(value) => `₱${Number(value ?? 0).toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Monthly Trend - Line Chart */}
        <Card className="bg-card-bg border-card-border">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Monthly Spending Trend</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                  formatter={(value) => `₱${Number(value ?? 0).toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  name="Total Spending"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </main>
    </div>
  )
}
