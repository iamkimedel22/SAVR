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

    const userId = decoded.userId

    // Get user info
    const userResult = await executeQuery("SELECT name FROM users WHERE id = ?", [userId])
    const user = Array.isArray(userResult) && userResult[0] ? (userResult[0] as any).name : "User"

    // Get transactions
    const transactions = await executeQuery(
      "SELECT amount, type FROM transactions WHERE user_id = ? AND MONTH(date) = MONTH(NOW()) AND YEAR(date) = YEAR(NOW())",
      [userId],
    )

    let totalBalance = 0
    let monthlyIncome = 0
    let monthlyExpense = 0

    if (Array.isArray(transactions)) {
      for (const tx of transactions) {
        const txData = tx as any
        if (txData.type === "income") {
          monthlyIncome += Number.parseFloat(txData.amount)
          totalBalance += Number.parseFloat(txData.amount)
        } else {
          monthlyExpense += Number.parseFloat(txData.amount)
          totalBalance -= Number.parseFloat(txData.amount)
        }
      }
    }

    // Get savings goals progress
    const goalsResult = await executeQuery(
      "SELECT SUM(current_amount) as current, SUM(target_amount) as target FROM savings_goals WHERE user_id = ?",
      [userId],
    )

    let savingsGoalsProgress = 0
    if (Array.isArray(goalsResult) && goalsResult[0]) {
      const goals = goalsResult[0] as any
      if (goals.target > 0) {
        savingsGoalsProgress = (goals.current / goals.target) * 100
      }
    }

    return NextResponse.json({
      userName: user,
      totalBalance: Math.round(totalBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpense: Math.round(monthlyExpense * 100) / 100,
      savingsGoalsProgress: Math.round(savingsGoalsProgress),
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
