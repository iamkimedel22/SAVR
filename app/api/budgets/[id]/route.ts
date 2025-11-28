import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getAuthToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { params } = context
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: "Budget ID missing" }, { status: 400 })
    }
    const budgetId = Number.parseInt(id)

    if (!Number.isFinite(budgetId)) {
      return NextResponse.json({ message: "Invalid budget id" }, { status: 400 })
    }
    const { categoryId, month, amount } = await request.json()

    const userId = decoded.userId

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

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { params } = context
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: "Budget ID missing" }, { status: 400 })
    }
    const budgetId = Number.parseInt(id)
    if (!Number.isFinite(budgetId)) {
      return NextResponse.json({ message: "Invalid budget id" }, { status: 400 })
    }
    const body = await request.json()

    const userId = decoded.userId

    const budgets = await executeQuery("SELECT id FROM budgets WHERE id = ? AND user_id = ?", [budgetId, userId])

    if ((budgets as any[]).length === 0) {
      return NextResponse.json({ message: "Budget not found" }, { status: 404 })
    }

    const fields: string[] = []
    const values: any[] = []

    if (body.amount !== undefined) {
      fields.push("amount = ?")
      values.push(Number.parseFloat(body.amount))
    }

    if (body.categoryId !== undefined || body.category !== undefined) {
      if (body.categoryId !== undefined) {
        fields.push("category_id = ?")
        values.push(body.categoryId)
      } else {
        const cat = await executeQuery(
          "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)",
          [body.category, userId],
        )
        const categoryId = Array.isArray(cat) && cat[0] ? (cat[0] as any).id : null
        fields.push("category_id = ?")
        values.push(categoryId)
      }
    }

    if (body.month !== undefined) {
      fields.push("month = ?")
      values.push(body.month)
    }

    if (fields.length === 0) return NextResponse.json({ message: "No fields to update" }, { status: 400 })

    values.push(budgetId)
    const updateQuery = `UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`
    await executeQuery(updateQuery, values)

    return NextResponse.json({ message: "Budget updated" })
  } catch (error) {
    console.error("[v0] Patch budget error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { params } = context
    const { id } = await params
    if (!id) {
      return NextResponse.json({ message: "Budget ID missing" }, { status: 400 })
    }
    const budgetId = Number.parseInt(id)
    if (!Number.isFinite(budgetId)) {
      return NextResponse.json({ message: "Invalid budget id" }, { status: 400 })
    }

    const userId = decoded.userId

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
