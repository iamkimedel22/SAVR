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

    const categories = await executeQuery("SELECT id, name FROM categories WHERE user_id = ? OR user_id IS NULL", [
      decoded.userId,
    ])

    return NextResponse.json(
      Array.isArray(categories)
        ? categories.map((c: any) => ({
            id: c.id,
            name: c.name,
          }))
        : [],
    )
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
