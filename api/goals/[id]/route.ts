import { type NextRequest, NextResponse } from "next/server"
import { getAuthToken, verifyToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getAuthToken(request)
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { id } = await params

    const result = await executeQuery("SELECT user_id FROM savings_goals WHERE id = ?", [Number.parseInt(id)])

    if (!Array.isArray(result) || result.length === 0 || (result[0] as any).user_id !== decoded.userId) {
      return NextResponse.json({ message: "Not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM savings_goals WHERE id = ?", [Number.parseInt(id)])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete goal error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
