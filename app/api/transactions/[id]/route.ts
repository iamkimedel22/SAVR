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

    const { params } = await context
    const { id } = params
    if (!id) {
      return NextResponse.json({ message: "Transaction ID missing" }, { status: 400 })
    }
    const transactionId = Number.parseInt(id)

    if (!Number.isFinite(transactionId)) {
      return NextResponse.json({ message: "Invalid transaction id" }, { status: 400 })
    }
    const { amount, type, date, note, categoryId } = await request.json()

    const userId = decoded.userId

    // Verify ownership
    const transactions = await executeQuery(
      "SELECT id FROM transactions WHERE id = ? AND user_id = ?",
      [transactionId, userId],
    )

    if ((transactions as any[]).length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    await executeQuery(
      "UPDATE transactions SET amount = ?, type = ?, date = ?, note = ?, category_id = ? WHERE id = ?",
      [amount, type, date, note || null, categoryId || null, transactionId],
    )

    return NextResponse.json({ message: "Transaction updated" })
  } catch (error) {
    console.error("[v0] Update transaction error:", error)
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
      return NextResponse.json({ message: "Transaction ID missing" }, { status: 400 })
    }
    const transactionId = Number.parseInt(id)
    if (!Number.isFinite(transactionId)) {
      return NextResponse.json({ message: "Invalid transaction id" }, { status: 400 })
    }
    const { amount, type, date, note, categoryId } = await request.json()

    const userId = decoded.userId

    // Verify ownership
    const transactions = await executeQuery("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [
      transactionId,
      userId,
    ])

    if ((transactions as any[]).length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    const fields: string[] = []
    const values: any[] = []

    if (body.amount !== undefined) {
      fields.push("amount = ?")
      values.push(Number.parseFloat(body.amount))
    }
    if (body.type !== undefined) {
      fields.push("type = ?")
      values.push(body.type)
    }
    if (body.date !== undefined) {
      fields.push("date = ?")
      values.push(body.date)
    }
    if (body.note !== undefined) {
      fields.push("note = ?")
      values.push(body.note)
    }
    if (body.categoryId !== undefined || body.category !== undefined) {
      // accept either categoryId or category name
      if (body.categoryId !== undefined) {
        fields.push("category_id = ?")
        values.push(body.categoryId)
      } else if (body.category !== undefined) {
        const cat = await executeQuery(
          "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)",
          [body.category, userId],
        )
        const categoryId = Array.isArray(cat) && cat[0] ? (cat[0] as any).id : null
        fields.push("category_id = ?")
        values.push(categoryId)
      }
    }

    if (fields.length === 0) return NextResponse.json({ message: "No fields to update" }, { status: 400 })

    values.push(transactionId)
    const updateQuery = `UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`
    await executeQuery(updateQuery, values)

    return NextResponse.json({ message: "Transaction updated" })
  } catch (error) {
    console.error("[v0] Patch transaction error:", error)
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
      return NextResponse.json({ message: "Transaction ID missing" }, { status: 400 })
    }
    const transactionId = Number.parseInt(id)
    if (!Number.isFinite(transactionId)) {
      return NextResponse.json({ message: "Invalid transaction id" }, { status: 400 })
    }

    const userId = decoded.userId

    // Verify ownership
    const transactions = await executeQuery("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [
      transactionId,
      userId,
    ])

    if ((transactions as any[]).length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM transactions WHERE id = ?", [transactionId])

    return NextResponse.json({ message: "Transaction deleted" })
  } catch (error) {
    console.error("[v0] Delete transaction error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
