import { type NextRequest, NextResponse } from "next/server"
import { getAuthToken, verifyToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const range = request.nextUrl.searchParams.get("range") || "month"
    const userId = decoded.userId

    // Get spending by category
    const categoryResult = await executeQuery(
      `SELECT c.name, SUM(t.amount) as value
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.date >= DATE_SUB(NOW(), INTERVAL 1 ${getDateInterval(range)})
       GROUP BY c.name
       ORDER BY value DESC`,
      [userId],
    )

    const spendingByCategory = Array.isArray(categoryResult)
      ? categoryResult.map((row: any) => ({
          name: row.name || "Other",
          value: Math.round(Number.parseFloat(row.value) * 100) / 100,
        }))
      : []

    // Get monthly trend
    const trendResult = await executeQuery(
      `SELECT DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as total
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND date >= DATE_SUB(NOW(), INTERVAL ${getRangeMonths(range)} MONTH)
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month ASC`,
      [userId],
    )

    const monthlyTrend = Array.isArray(trendResult)
      ? trendResult.map((row: any) => ({
          month: row.month,
          total: Math.round(Number.parseFloat(row.total) * 100) / 100,
        }))
      : []

    // Get income vs expense comparison
    const incomeExpenseResult = await executeQuery(
      `SELECT
        DATE_FORMAT(date, '%Y-%m') as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
       FROM transactions
       WHERE user_id = ? AND date >= DATE_SUB(NOW(), INTERVAL ${getRangeMonths(range)} MONTH)
       GROUP BY DATE_FORMAT(date, '%Y-%m')
       ORDER BY month ASC`,
      [userId],
    )

    const incomeVsExpense = Array.isArray(incomeExpenseResult)
      ? incomeExpenseResult.map((row: any) => ({
          month: row.month,
          income: Math.round(Number.parseFloat(row.income) * 100) / 100,
          expense: Math.round(Number.parseFloat(row.expense) * 100) / 100,
        }))
      : []

    return NextResponse.json({
      spendingByCategory,
      monthlyTrend,
      incomeVsExpense,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

function getDateInterval(range: string) {
  switch (range) {
    case "month":
      return "MONTH"
    case "quarter":
      return "QUARTER"
    case "year":
      return "YEAR"
    default:
      return "MONTH"
  }
}

function getRangeMonths(range: string) {
  switch (range) {
    case "month":
      return 1
    case "quarter":
      return 3
    case "year":
      return 12
    default:
      return 1
  }
}
