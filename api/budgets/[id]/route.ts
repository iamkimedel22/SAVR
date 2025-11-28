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
      return NextResponse.json({ message: "Budget ID missing" }, { status: 400 })
    }
    const idNum = Number.parseInt(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ message: "Invalid budget id" }, { status: 400 })
    }

    const result = await executeQuery("SELECT user_id FROM budgets WHERE id = ?", [idNum])

    if (!Array.isArray(result) || result.length === 0 || (result[0] as any).user_id !== decoded.userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM budgets WHERE id = ?", [idNum])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete budget error:", error)
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
      return NextResponse.json({ message: "Budget ID missing" }, { status: 400 })
    }
    const idNum = Number.parseInt(id)
    if (!Number.isFinite(idNum)) {
      return NextResponse.json({ message: "Invalid budget id" }, { status: 400 })
    }
    const body = await request.json()

    const result = await executeQuery("SELECT user_id FROM budgets WHERE id = ?", [idNum])

    if (!Array.isArray(result) || result.length === 0 || (result[0] as any).user_id !== decoded.userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    const fields: string[] = []
    const values: any[] = []

    if (body.amount !== undefined) {
      fields.push("amount = ?")
      values.push(Number.parseFloat(body.amount))
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

    values.push(idNum)

    const updateQuery = `UPDATE budgets SET ${fields.join(", ")} WHERE id = ?`

    await executeQuery(updateQuery, values)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update budget error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return PUT(request, context)
}
