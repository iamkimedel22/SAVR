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

    const budgets = await executeQuery(
      `SELECT b.id, c.name as category, b.amount,
              COALESCE(SUM(t.amount), 0) as spent
       FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       LEFT JOIN transactions t ON t.category_id = b.category_id AND t.user_id = b.user_id AND t.type = 'expense'
       WHERE b.user_id = ? AND MONTH(b.month) = MONTH(NOW()) AND YEAR(b.month) = YEAR(NOW())
       GROUP BY b.id`,
      [decoded.userId],
    )

    return NextResponse.json(
      Array.isArray(budgets)
        ? budgets.map((b: any) => {
            const spent = Number.parseFloat(b.spent)
            const amount = Number.parseFloat(b.amount)
            const percentage = Math.round((spent / amount) * 100)
            return {
              id: b.id,
              category: b.category || "Other",
              amount,
              spent,
              percentage,
            }
          })
        : [],
    )
  } catch (error) {
    console.error("Get budgets error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
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

    const { category, amount } = await request.json()

    if (!category || !amount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const categoryResult = await executeQuery(
      "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)",
      [category, decoded.userId],
    )

    const categoryId = Array.isArray(categoryResult) && categoryResult[0] ? (categoryResult[0] as any).id : null

    await executeQuery("INSERT INTO budgets (user_id, category_id, month, amount) VALUES (?, ?, NOW(), ?)", [
      decoded.userId,
      categoryId,
      Number.parseFloat(amount),
    ])

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Create budget error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
