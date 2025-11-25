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

    // Get user info
    const users = await executeQuery("SELECT name FROM users WHERE id = ?", [userId])
    const user = (users as any[])[0]

    // Get total balance (sum of all transactions)
    const balanceResult = await executeQuery(
      "SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END), 0) as totalBalance FROM transactions WHERE user_id = ?",
      [userId],
    )
    const totalBalance = (balanceResult as any[])[0]?.totalBalance || 0

    // Get monthly income
    const incomeResult = await executeQuery(
      "SELECT COALESCE(SUM(amount), 0) as monthlyIncome FROM transactions WHERE user_id = ? AND type='income' AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())",
      [userId],
    )
    const monthlyIncome = (incomeResult as any[])[0]?.monthlyIncome || 0

    // Get monthly expenses
    const expenseResult = await executeQuery(
      "SELECT COALESCE(SUM(amount), 0) as monthlyExpense FROM transactions WHERE user_id = ? AND type='expense' AND MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())",
      [userId],
    )
    const monthlyExpense = (expenseResult as any[])[0]?.monthlyExpense || 0

    // Get savings goals progress
    const goalsResult = await executeQuery(
      "SELECT COALESCE(SUM(current_amount) / NULLIF(SUM(target_amount), 0) * 100, 0) as progress FROM savings_goals WHERE user_id = ? AND current_amount > 0",
      [userId],
    )
    const savingsGoalsProgress = (goalsResult as any[])[0]?.progress || 0

    return NextResponse.json({
      userName: user?.name || "User",
      totalBalance: Number(totalBalance),
      monthlyIncome: Number(monthlyIncome),
      monthlyExpense: Number(monthlyExpense),
      savingsGoalsProgress: Number(savingsGoalsProgress),
    })
  } catch (error) {
    console.error("[v0] Dashboard API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
