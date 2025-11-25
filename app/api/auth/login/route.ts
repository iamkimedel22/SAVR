import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    const users = await executeQuery("SELECT id, email, password_hash, name FROM users WHERE email = ?", [email])

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0] as any

    // Compare passwords
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    // Log the login action
    await executeQuery("INSERT INTO logs (user_id, action) VALUES (?, ?)", [user.id, "login"])

    return NextResponse.json(
      {
        message: "Login successful",
        accessToken: token,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
