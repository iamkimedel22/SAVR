import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getAuthToken } from "@/lib/auth"
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

    const userId = decoded.userId
    const range = request.nextUrl.searchParams.get("range") || "month"

    let dateFilter = ""
    switch (range) {
      case "year":
        dateFilter = "YEAR(date) = YEAR(CURDATE())"
        break
      case "quarter":
        dateFilter = `QUARTER(date) = QUARTER(CURDATE()) AND YEAR(date) = YEAR(CURDATE())`
        break
      default:
        dateFilter = "MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())"
    }

    // Category breakdown
    const categoryData = await executeQuery(
      `SELECT c.name, SUM(t.amount) as total 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = ? AND t.type = 'expense' AND ${dateFilter}
       GROUP BY c.name`,
      [userId],
    )

    // Income vs Expense
    const incomeVsExpense = await executeQuery(
      `SELECT type, SUM(amount) as total 
       FROM transactions 
       WHERE user_id = ? AND ${dateFilter}
       GROUP BY type`,
      [userId],
    )

    // Monthly trend
    const monthlyTrend = await executeQuery(
      `SELECT DATE_FORMAT(date, '%Y-%m') as month, type, SUM(amount) as total 
       FROM transactions 
       WHERE user_id = ? AND YEAR(date) = YEAR(CURDATE())
       GROUP BY month, type
       ORDER BY month`,
      [userId],
    )

    return NextResponse.json({
      categoryData,
      incomeVsExpense,
      monthlyTrend,
    })
  } catch (error) {
    console.error("[v0] Analytics API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
