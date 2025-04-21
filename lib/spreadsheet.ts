"use server"

import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

// Define the structure of user data
interface UserData {
  name: string
  email: string
  currentWeight: string
  averageSteps: string
  hasSugarTooth: string
  waterIntake: string
  sleepHours: string
  workoutHours: string
  fitnessGoal: string
  healthFocus: string
}

// Google Sheets configuration
const SPREADSHEET_ID = "16k03FrZ4eTGXnn8aWgBK1qnzGhdUV7wJqnTuLkEiEgU"
const SHEET_INDEX = 0 // First sheet

// Initialize auth - use service account credentials
const getJWT = () => {
  // In a real application, these would be environment variables
  // For this demo, we're using a service account key
  // You would need to create a service account and download the JSON key
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

// Check if an email already exists in the spreadsheet
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const doc = await getDoc()
    const sheet = doc.sheetsByIndex[SHEET_INDEX]
    await sheet.loadHeaderRow() // Load the header row

    // Load all rows to check for the email
    const rows = await sheet.getRows()

    // Check if the email exists in any row
    return rows.some((row) => row.get("email") === email)
  } catch (error) {
    console.error("Error checking email:", error)
    throw new Error("Failed to check if email exists")
  }
}

// Save user data to the spreadsheet
export async function saveUserData(userData: UserData): Promise<void> {
  try {
    const doc = await getDoc()
    const sheet = doc.sheetsByIndex[SHEET_INDEX]

    // If the sheet is empty, add headers
    if (sheet.headerValues.length === 0) {
      await sheet.setHeaderRow([
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

    // Add the new row with user data
    await sheet.addRow({
      ...userData,
      joinDate: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error saving user data:", error)
    throw new Error("Failed to save user data")
  }
}
