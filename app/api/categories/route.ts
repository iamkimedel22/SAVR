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

    const categories = await executeQuery(
      "SELECT * FROM categories WHERE user_id = ? OR user_id IS NULL ORDER BY name",
      [userId],
    )

    // Deduplicate categories by name, preferring user-specific categories over global ones
    const mapped = Array.isArray(categories)
      ? categories.reduce((acc: any[], row: any) => {
          const existing = acc.find((r) => r.name === row.name)
          if (!existing) acc.push(row)
          else if (existing.user_id === null && row.user_id !== null) {
            // prefer user-specific version
            acc[acc.indexOf(existing)] = row
          }
          return acc
        }, [])
      : []

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("[v0] Get categories error:", error)
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

    const body = await request.json()
    const { name, color } = body

    if (!name) return NextResponse.json({ message: "Missing category name" }, { status: 400 })

    const exists = await executeQuery("SELECT id FROM categories WHERE user_id = ? AND name = ?", [decoded.userId, name])
    if (Array.isArray(exists) && exists.length > 0) return NextResponse.json({ message: "Category exists" }, { status: 400 })

    await executeQuery("INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)", [decoded.userId, name, color || null])

    return NextResponse.json({ message: "Category created" }, { status: 201 })
  } catch (error) {
    console.error("[v0] Create category error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
