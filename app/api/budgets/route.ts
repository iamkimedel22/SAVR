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

    const budgets = await executeQuery(
      `SELECT b.*, c.name as category_name, 
              COALESCE(SUM(t.amount), 0) as spent 
       FROM budgets b 
       LEFT JOIN categories c ON b.category_id = c.id 
       LEFT JOIN transactions t ON t.category_id = b.category_id 
         AND t.user_id = ? 
         AND t.type = 'expense'
         AND MONTH(t.date) = MONTH(b.month)
         AND YEAR(t.date) = YEAR(b.month)
       WHERE b.user_id = ?
       GROUP BY b.id`,
      [userId, userId],
    )

    // Map rows to the expected client shape
    const mapped = Array.isArray(budgets)
      ? budgets.map((b: any) => {
          const amount = Number.parseFloat(b.amount ?? 0) || 0
          const spent = Number.parseFloat(b.spent ?? 0) || 0
          const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0
          return {
            id: b.id,
            category: b.category_name || "Other",
            amount,
            spent,
            percentage: Math.min(percentage, 100),
          }
        })
      : []

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("[v0] Get budgets error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { category, categoryId, month, amount } = await request.json()

    if (!amount || (!category && !categoryId)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    let resolvedCategoryId = categoryId ?? null
    if (!resolvedCategoryId && category) {
      const categoryResult = await executeQuery(
        "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)",
        [category, userId],
      )
      resolvedCategoryId = Array.isArray(categoryResult) && categoryResult[0] ? (categoryResult[0] as any).id : null
    }

    const insertMonth = month || new Date().toISOString().slice(0, 10)
    const result = await executeQuery(
      "INSERT INTO budgets (user_id, category_id, month, amount) VALUES (?, ?, ?, ?)",
      [userId, resolvedCategoryId, insertMonth, Number.parseFloat(amount)],
    )

    return NextResponse.json({ message: "Budget created", id: (result as any).insertId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create budget error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
