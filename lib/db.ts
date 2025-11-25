import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "savr",
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function executeQuery(query: string, values?: any[]) {
  try {
    const connection = await pool.getConnection()
    const [results] = await connection.execute(query, values)
    connection.release()
    return results
  } catch (error) {
    console.error("Database error:", error)
    throw error
  }
}

export default pool
