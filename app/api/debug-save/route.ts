import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Get credentials from environment variables
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    let privateKey = process.env.GOOGLE_PRIVATE_KEY

    // Check if credentials exist
    if (!email || !privateKey) {
      return NextResponse.json(
        { success: false, error: "Missing Google credentials in environment variables" },
        { status: 400 },
      )
    }

    // Fix private key formatting if needed
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----\n`
    } else if (privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n")
    }

    // Initialize JWT
    const jwt = new JWT({
      email,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
    })

    // Initialize spreadsheet
    const SPREADSHEET_ID = "16k03FrZ4eTGXnn8aWgBK1qnzGhdUV7wJqnTuLkEiEgU"
    const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt)

    // Load spreadsheet info
    await doc.loadInfo()

    // Get or create the debug sheet
    let sheet
    if (doc.sheetsByIndex.length < 3) {
      sheet = await doc.addSheet({ title: "Debug Data" })
    } else {
      sheet = doc.sheetsByIndex[2]
    }

    // Check if headers exist
    await sheet.loadHeaderRow()

    // If the sheet is empty or has no headers, add them
    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(["timestamp", "type", "data"])
    }

    // Add the debug data
    await sheet.addRow({
      timestamp: new Date().toISOString(),
      type: data.type || "unknown",
      data: JSON.stringify(data),
    })

    return NextResponse.json({
      success: true,
      message: "Debug data saved successfully",
    })
  } catch (error) {
    console.error("Error saving debug data:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
