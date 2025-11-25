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

    const goals = await executeQuery(
      "SELECT id, title, target_amount, current_amount, deadline FROM savings_goals WHERE user_id = ? ORDER BY deadline ASC",
      [userId],
    )

    const mapped = Array.isArray(goals)
      ? goals.map((g: any) => {
          const targetAmount = Number.parseFloat(g.target_amount ?? 0) || 0
          const currentAmount = Number.parseFloat(g.current_amount ?? 0) || 0
          const percentage = targetAmount > 0 ? Math.round((currentAmount / targetAmount) * 100) : 0
          return {
            id: g.id,
            title: g.title,
            targetAmount,
            currentAmount,
            deadline: g.deadline,
            percentage: Math.min(percentage, 100),
          }
        })
      : []

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("[v0] Get goals error:", error)
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
    const { title, targetAmount, currentAmount, deadline } = await request.json()

    if (!title || !targetAmount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const result = await executeQuery(
      "INSERT INTO savings_goals (user_id, title, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)",
      [userId, title, Number.parseFloat(targetAmount), Number.parseFloat(currentAmount) || 0, deadline || null],
    )

    return NextResponse.json({ message: "Goal created", id: (result as any).insertId }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create goal error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
