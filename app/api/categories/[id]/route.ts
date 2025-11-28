import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getAuthToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = getAuthToken(request)
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 })

    const { params } = await context
    const { id: idRaw } = await params
    if (!idRaw) {
      return NextResponse.json({ message: "Category ID missing" }, { status: 400 })
    }
    const id = Number.parseInt(idRaw)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: "Invalid category id" }, { status: 400 })
    }

    const result = await executeQuery("SELECT user_id FROM categories WHERE id = ?", [id])
    if (!Array.isArray(result) || result.length === 0) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const row = result[0] as any
    if (row.user_id === null) return NextResponse.json({ message: "Cannot delete default category" }, { status: 403 })
    if (row.user_id !== decoded.userId) return NextResponse.json({ message: "Not found" }, { status: 404 })

    await executeQuery("DELETE FROM categories WHERE id = ?", [id])
    return NextResponse.json({ message: "Category deleted" })
  } catch (error) {
    console.error("[v0] Delete category error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const token = getAuthToken(request)
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ message: "Invalid token" }, { status: 401 })

    const { params } = context
    const { id: idRaw } = await params
    if (!idRaw) {
      return NextResponse.json({ message: "Category ID missing" }, { status: 400 })
    }
    const id = Number.parseInt(idRaw)
    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: "Invalid category id" }, { status: 400 })
    }
    const body = await request.json()

    const result = await executeQuery("SELECT user_id FROM categories WHERE id = ?", [id])
    if (!Array.isArray(result) || result.length === 0) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const row = result[0] as any
    if (row.user_id === null) return NextResponse.json({ message: "Cannot update default category" }, { status: 403 })
    if (row.user_id !== decoded.userId) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const fields: string[] = []
    const values: any[] = []

    if (body.name !== undefined) {
      fields.push("name = ?")
      values.push(body.name)
    }
    if (body.color !== undefined) {
      fields.push("color = ?")
      values.push(body.color)
    }

    if (fields.length === 0) return NextResponse.json({ message: "No fields to update" }, { status: 400 })

    values.push(id)
    const updateQuery = `UPDATE categories SET ${fields.join(", ")} WHERE id = ?`
    await executeQuery(updateQuery, values)

    return NextResponse.json({ message: "Category updated" })
  } catch (error) {
    console.error("[v0] Update category error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // alias to PUT (partial updates allowed)
  return PUT(request, context)
}
