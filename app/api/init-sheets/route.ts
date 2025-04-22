import { NextResponse } from "next/server"
import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

export async function GET() {
  try {
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

    // Initialize Users sheet (index 0)
    let usersSheet
    if (doc.sheetsByIndex.length === 0) {
      usersSheet = await doc.addSheet({ title: "Users" })
    } else {
      usersSheet = doc.sheetsByIndex[0]
    }

    // Set headers for Users sheet
    await usersSheet.loadHeaderRow()
    if (!usersSheet.headerValues || usersSheet.headerValues.length === 0) {
      await usersSheet.setHeaderRow([
        "name",
        "email",
        "currentWeight",
        "averageSteps",
        "hasSugarTooth",
        "waterIntake",
        "sleepHours",
        "workoutHours",
        "fitnessGoal",
        "healthFocus",
        "joinDate",
      ])
    }

    // Initialize Daily Logs sheet (index 1)
    let logsSheet
    if (doc.sheetsByIndex.length <= 1) {
      logsSheet = await doc.addSheet({ title: "Daily Logs" })
    } else {
      logsSheet = doc.sheetsByIndex[1]
    }

    // Set headers for Daily Logs sheet
    await logsSheet.loadHeaderRow()
    if (!logsSheet.headerValues || logsSheet.headerValues.length === 0) {
      await logsSheet.setHeaderRow([
        "email",
        "date",
        "steps",
        "noAddedSugar",
        "waterIntake",
        "sleepHours",
        "didWorkout",
      ])
    }

    // Initialize Debug Data sheet (index 2)
    let debugSheet
    if (doc.sheetsByIndex.length <= 2) {
      debugSheet = await doc.addSheet({ title: "Debug Data" })
    } else {
      debugSheet = doc.sheetsByIndex[2]
    }

    // Set headers for Debug Data sheet
    await debugSheet.loadHeaderRow()
    if (!debugSheet.headerValues || debugSheet.headerValues.length === 0) {
      await debugSheet.setHeaderRow(["timestamp", "type", "data"])
    }

    return NextResponse.json({
      success: true,
      message: "All sheets initialized successfully",
      sheets: doc.sheetsByIndex.map((sheet) => ({
        title: sheet.title,
        headerValues: sheet.headerValues,
      })),
    })
  } catch (error) {
    console.error("Error initializing sheets:", error)
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
