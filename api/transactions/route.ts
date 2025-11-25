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

    const transactions = await executeQuery(
      `SELECT t.id, c.name as category, t.amount, t.type, t.date, t.note 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ?
       ORDER BY t.date DESC`,
      [decoded.userId],
    )

    return NextResponse.json(
      Array.isArray(transactions)
        ? transactions.map((t: any) => ({
            id: t.id,
            category: t.category || "Other",
            amount: Number.parseFloat(t.amount),
            type: t.type,
            date: t.date,
            note: t.note,
          }))
        : [],
    )
  } catch (error) {
    console.error("Get transactions error:", error)
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

    const { amount, category, type, date, note } = await request.json()

    if (!amount || !category || !type || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const categoryResult = await executeQuery(
      "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)",
      [category, decoded.userId],
    )

    const categoryId = Array.isArray(categoryResult) && categoryResult[0] ? (categoryResult[0] as any).id : null

    await executeQuery(
      "INSERT INTO transactions (user_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?)",
      [decoded.userId, categoryId, Number.parseFloat(amount), type, date, note || ""],
    )

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Create transaction error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
