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

    const goals = await executeQuery(
      `SELECT id, title, target_amount, current_amount, deadline
       FROM savings_goals
       WHERE user_id = ?
       ORDER BY deadline ASC`,
      [decoded.userId],
    )

    return NextResponse.json(
      Array.isArray(goals)
        ? goals.map((g: any) => {
            const targetAmount = Number.parseFloat(g.target_amount)
            const currentAmount = Number.parseFloat(g.current_amount)
            const percentage = Math.round((currentAmount / targetAmount) * 100)
            return {
              id: g.id,
              title: g.title,
              targetAmount,
              currentAmount,
              deadline: g.deadline,
              percentage: Math.min(percentage, 100),
            }
          })
        : [],
    )
  } catch (error) {
    console.error("Get goals error:", error)
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

    const { title, targetAmount, deadline } = await request.json()

    if (!title || !targetAmount || !deadline) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    await executeQuery("INSERT INTO savings_goals (user_id, title, target_amount, deadline) VALUES (?, ?, ?, ?)", [
      decoded.userId,
      title,
      Number.parseFloat(targetAmount),
      deadline,
    ])

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Create goal error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
