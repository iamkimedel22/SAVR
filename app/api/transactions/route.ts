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

    const transactions = await executeQuery(
      `SELECT t.*, c.name as category_name FROM transactions t 
       LEFT JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = ? 
       ORDER BY t.date DESC LIMIT 100`,
      [userId],
    )

    const mapped = Array.isArray(transactions)
      ? transactions.map((t: any) => ({
          id: t.id,
          category: t.category_name || "Other",
          amount: Number.parseFloat(t.amount ?? 0) || 0,
          type: t.type,
          date: t.date,
          note: t.note,
        }))
      : []

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("[v0] Get transactions error:", error)
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
    const { amount, type, date, note, categoryId, category } = await request.json()

    if (!amount || !type || !date) {
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

    const parsedAmount = Number.parseFloat(amount)
    const result = await executeQuery(
      "INSERT INTO transactions (user_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, resolvedCategoryId, parsedAmount, type, date, note || null],
    )

    return NextResponse.json({ message: "Transaction created", id: (result as any).insertId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create transaction error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
