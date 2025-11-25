import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUsers = await executeQuery("SELECT id FROM users WHERE email = ?", [email])
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Create user
    const result = await executeQuery("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)", [
      email,
      hashedPassword,
      name,
    ])

    const userId = (result as any).insertId

    // Create default categories for user
    const defaultCategories = [
      { name: "Food", color: "#FF6B6B" },
      { name: "Transport", color: "#4ECDC4" },
      { name: "Entertainment", color: "#45B7D1" },
      { name: "Shopping", color: "#FFA07A" },
      { name: "Bills", color: "#98D8C8" },
      { name: "Healthcare", color: "#FF7675" },
      { name: "Education", color: "#A29BFE" },
      { name: "Other", color: "#DFE6E9" },
    ]

    for (const category of defaultCategories) {
      await executeQuery("INSERT INTO categories (user_id, name, color) VALUES (?, ?, ?)", [
        userId,
        category.name,
        category.color,
      ])
    }

    // Generate JWT token
    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        accessToken: token,
        user: { id: userId, email, name },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
