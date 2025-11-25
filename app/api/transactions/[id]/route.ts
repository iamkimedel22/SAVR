import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getAuthToken } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const transactionId = params.id
    const { amount, type, date, note, categoryId } = await request.json()

    // Verify ownership
    const transactions = await executeQuery("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [
      transactionId,
      userId,
    ])

    if ((transactions as any[]).length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    await executeQuery(
      "UPDATE transactions SET amount = ?, type = ?, date = ?, note = ?, category_id = ? WHERE id = ?",
      [amount, type, date, note || null, categoryId || null, transactionId],
    )

    return NextResponse.json({ message: "Transaction updated" })
  } catch (error) {
    console.error("[v0] Update transaction error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const transactionId = params.id

    // Verify ownership
    const transactions = await executeQuery("SELECT id FROM transactions WHERE id = ? AND user_id = ?", [
      transactionId,
      userId,
    ])

    if ((transactions as any[]).length === 0) {
      return NextResponse.json({ message: "Transaction not found" }, { status: 404 })
    }

    await executeQuery("DELETE FROM transactions WHERE id = ?", [transactionId])

    return NextResponse.json({ message: "Transaction deleted" })
  } catch (error) {
    console.error("[v0] Delete transaction error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
