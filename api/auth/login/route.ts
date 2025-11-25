import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { generateToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const result = await executeQuery("SELECT id, password_hash FROM users WHERE email = ?", [email])

    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    const user = result[0] as any
    const isValidPassword = bcrypt.compareSync(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 })
    }

    await executeQuery("INSERT INTO logs (user_id, action) VALUES (?, ?)", [user.id, "login"])

    const token = generateToken(user.id)

    return NextResponse.json({ accessToken: token, userId: user.id }, { status: 200 })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Login failed" }, { status: 500 })
  }
}
