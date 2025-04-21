"use server"

import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

// Define the structure of daily log data
interface DailyLogData {
  email: string
  steps: string
  noAddedSugar: boolean
  waterIntake: string
  sleepHours: string
  didWorkout: boolean
  date: string
}

// Google Sheets configuration
const SPREADSHEET_ID = "16k03FrZ4eTGXnn8aWgBK1qnzGhdUV7wJqnTuLkEiEgU"
const LOGS_SHEET_INDEX = 1 // Second sheet for logs

// Initialize auth - use service account credentials
const getJWT = () => {
  // In a real application, these would be environment variables
  const CREDENTIALS = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }

  return new JWT({
    email: CREDENTIALS.client_email,
    key: CREDENTIALS.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
  })
}

// Initialize the sheet
const getDoc = async () => {
  const jwt = getJWT()
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, jwt)
  await doc.loadInfo() // Load document properties and worksheets
  return doc
}

// Save daily log to the spreadsheet
export async function saveDailyLog(logData: DailyLogData): Promise<void> {
  try {
    const doc = await getDoc()

    // Check if logs sheet exists, if not create it
    let sheet
    if (doc.sheetsByIndex.length <= LOGS_SHEET_INDEX) {
      sheet = await doc.addSheet({ title: "Daily Logs" })
    } else {
      sheet = doc.sheetsByIndex[LOGS_SHEET_INDEX]
    }

    // If the sheet is empty, add headers
    if (sheet.headerValues.length === 0) {
      await sheet.setHeaderRow(["email", "date", "steps", "noAddedSugar", "waterIntake", "sleepHours", "didWorkout"])
    }

    // Format the data for the spreadsheet
    const rowData = {
      email: logData.email,
      date: logData.date,
      steps: logData.steps,
      noAddedSugar: logData.noAddedSugar ? "Yes" : "No",
      waterIntake: logData.waterIntake,
      sleepHours: logData.sleepHours,
      didWorkout: logData.didWorkout ? "Yes" : "No",
    }

    // Add the new row with log data
    await sheet.addRow(rowData)
  } catch (error) {
    console.error("Error saving daily log:", error)
    throw new Error("Failed to save daily log")
  }
}

// Get logs for a specific user
export async function getUserLogs(email: string): Promise<any[]> {
  try {
    const doc = await getDoc()

    // Check if logs sheet exists
    if (doc.sheetsByIndex.length <= LOGS_SHEET_INDEX) {
      return [] // No logs sheet, return empty array
    }

    const sheet = doc.sheetsByIndex[LOGS_SHEET_INDEX]
    await sheet.loadHeaderRow() // Load the header row

    // Load all rows
    const rows = await sheet.getRows()

    // Filter rows for the specific user
    return rows
      .filter((row) => row.get("email") === email)
      .map((row) => ({
        date: row.get("date"),
        steps: row.get("steps"),
        noAddedSugar: row.get("noAddedSugar") === "Yes",
        waterIntake: row.get("waterIntake"),
        sleepHours: row.get("sleepHours"),
        didWorkout: row.get("didWorkout") === "Yes",
      }))
  } catch (error) {
    console.error("Error getting user logs:", error)
    throw new Error("Failed to get user logs")
  }
}
