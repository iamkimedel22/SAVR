import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getAuthToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const budgetId = params.id
    const { categoryId, month, amount } = await request.json()

    const budgets = await executeQuery("SELECT id FROM budgets WHERE id = ? AND user_id = ?", [budgetId, userId])

    if ((budgets as any[]).length === 0) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    await executeQuery("UPDATE budgets SET category_id = ?, month = ?, amount = ? WHERE id = ?", [
      categoryId,
      month,
      amount,
      budgetId,
    ])

    return NextResponse.json({ message: "Budget updated" })
  } catch (error) {
    console.error("[v0] Update budget error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const budgetId = params.id

    const budgets = await executeQuery("SELECT id FROM budgets WHERE id = ? AND user_id = ?", [budgetId, userId])

    if ((budgets as any[]).length === 0) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM budgets WHERE id = ?", [budgetId])

    return NextResponse.json({ message: "Budget deleted" })
  } catch (error) {
    console.error("[v0] Delete budget error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
