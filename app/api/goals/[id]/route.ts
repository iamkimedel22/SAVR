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
      return NextResponse.json({ message: "Goal ID missing" }, { status: 400 })
    }
    const goalId = Number.parseInt(id)

    if (!Number.isFinite(goalId)) {
      return NextResponse.json({ message: "Invalid goal id" }, { status: 400 })
    }
    const { title, targetAmount, currentAmount, deadline } = await request.json()

    const userId = decoded.userId

    const goals = await executeQuery("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", [goalId, userId])

    if ((goals as any[]).length === 0) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    await executeQuery(
      "UPDATE savings_goals SET title = ?, target_amount = ?, current_amount = ?, deadline = ? WHERE id = ?",
      [title, targetAmount, currentAmount, deadline || null, goalId],
    )

    return NextResponse.json({ message: "Goal updated" })
  } catch (error) {
    console.error("[v0] Update goal error:", error)
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
      return NextResponse.json({ message: "Goal ID missing" }, { status: 400 })
    }
    const goalId = Number.parseInt(id)
    if (!Number.isFinite(goalId)) {
      return NextResponse.json({ message: "Invalid goal id" }, { status: 400 })
    }
    const body = await request.json()

    const userId = decoded.userId

    const goals = await executeQuery("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", [goalId, userId])

    if ((goals as any[]).length === 0) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    const fields: string[] = []
    const values: any[] = []

    if (body.title !== undefined) {
      fields.push("title = ?")
      values.push(body.title)
    }

    if (body.targetAmount !== undefined) {
      fields.push("target_amount = ?")
      values.push(Number.parseFloat(body.targetAmount))
    }

    if (body.currentAmount !== undefined) {
      fields.push("current_amount = ?")
      values.push(Number.parseFloat(body.currentAmount))
    }

    if (body.deadline !== undefined) {
      fields.push("deadline = ?")
      values.push(body.deadline)
    }

    if (fields.length === 0) return NextResponse.json({ message: "No fields to update" }, { status: 400 })

    values.push(goalId)
    const updateQuery = `UPDATE savings_goals SET ${fields.join(", ")} WHERE id = ?`
    await executeQuery(updateQuery, values)

    return NextResponse.json({ message: "Goal updated" })
  } catch (error) {
    console.error("[v0] Patch goal error:", error)
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
      return NextResponse.json({ message: "Goal ID missing" }, { status: 400 })
    }
    const goalId = Number.parseInt(id)
    if (!Number.isFinite(goalId)) {
      return NextResponse.json({ message: "Invalid goal id" }, { status: 400 })
    }

    const userId = decoded.userId

    const goals = await executeQuery("SELECT id FROM savings_goals WHERE id = ? AND user_id = ?", [goalId, userId])

    if ((goals as any[]).length === 0) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM savings_goals WHERE id = ?", [goalId])

    return NextResponse.json({ message: "Goal deleted" })
  } catch (error) {
    console.error("[v0] Delete goal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
