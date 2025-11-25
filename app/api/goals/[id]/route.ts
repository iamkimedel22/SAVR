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
    const goalId = params.id
    const { title, targetAmount, currentAmount, deadline } = await request.json()

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
    const goalId = params.id

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
