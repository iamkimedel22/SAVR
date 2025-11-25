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

    const categories = await executeQuery(
      "SELECT id, name, user_id FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name",
      [decoded.userId],
    )

    const mapped = Array.isArray(categories)
      ? categories.reduce((acc: any[], row: any) => {
          const existingIndex = acc.findIndex((r) => r.name === row.name)
          if (existingIndex === -1) acc.push(row)
          else if (acc[existingIndex].user_id === null && row.user_id !== null) {
            // prefer user specific category
            acc[existingIndex] = row
          }
          return acc
        }, [])
      : []

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
