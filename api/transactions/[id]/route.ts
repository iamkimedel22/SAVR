import { type NextRequest, NextResponse } from "next/server"
import { getAuthToken, verifyToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

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

    const { params } = await context
    const { id } = params
    if (!id) {
      return NextResponse.json({ message: "Transaction ID missing" }, { status: 400 })
    }
    const idNum = Number.parseInt(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ message: "Invalid transaction id" }, { status: 400 })
    }

    const result = await executeQuery("SELECT user_id FROM transactions WHERE id = ?", [idNum])

    if (!Array.isArray(result) || result.length === 0 || (result[0] as any).user_id !== decoded.userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM transactions WHERE id = ?", [idNum])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete transaction error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

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
    const body = await request.json()

    const result = await executeQuery("SELECT user_id FROM transactions WHERE id = ?", [Number.parseInt(id)])

    if (!Array.isArray(result) || result.length === 0 || (result[0] as any).user_id !== decoded.userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
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

    if (body.category !== undefined) {
      const categoryResult = await executeQuery(
        "SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)",
        [body.category, decoded.userId],
      )
      const categoryId = Array.isArray(categoryResult) && categoryResult[0] ? (categoryResult[0] as any).id : null
      fields.push("category_id = ?")
      values.push(categoryId)
    }

    if (fields.length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 })
    }

    values.push(Number.parseInt(id))

    const updateQuery = `UPDATE transactions SET ${fields.join(", ")} WHERE id = ?`

    await executeQuery(updateQuery, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update transaction error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // reuse PUT logic: accept partial updates
  return PUT(request, context)
}
