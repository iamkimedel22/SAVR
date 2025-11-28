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

    const { name, color } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Missing category name" }, { status: 400 })
    }

    const exists = await executeQuery("SELECT id FROM categories WHERE user_id = ? AND name = ?", [decoded.userId, name])
    if (Array.isArray(exists) && exists.length > 0) {
      return NextResponse.json({ message: "Category already exists" }, { status: 400 })
    }

    await executeQuery("INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)", [decoded.userId, name, color || null])

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ message: "Server error" }, { status: 500 })
  }
}
