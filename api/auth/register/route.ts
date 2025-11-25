import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 400 })
    }

    const existing = await executeQuery("SELECT id FROM users WHERE email = ?", [email])

    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = bcrypt.hashSync(password, 12)

    await executeQuery("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)", [
      email,
      hashedPassword,
      name || "User",
    ])

    const userResult = await executeQuery("SELECT id FROM users WHERE email = ?", [email])

    const userId = Array.isArray(userResult) && userResult[0] ? (userResult[0] as any).id : null

    if (!userId) {
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
    }

    // Create default categories
    const defaultCategories = ["Food", "Transport", "Bills", "Entertainment", "Other"]
    for (const category of defaultCategories) {
      await executeQuery("INSERT INTO categories (user_id, name) VALUES (?, ?)", [userId, category])
    }

    const token = generateToken(userId)

    return NextResponse.json(
      {
        accessToken: token,
        userId,
        email,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Registration failed" }, { status: 500 })
  }
}
