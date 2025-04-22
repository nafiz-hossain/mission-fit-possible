import { GoogleSpreadsheet } from "google-spreadsheet"

// Define the UserData type
interface UserData {
  name: string
  email: string
  currentWeight: number
  averageSteps: number
  hasSugarTooth: boolean
  waterIntake: number
  sleepHours: number
  workoutHours: number
  fitnessGoal: string
  healthFocus: string
}

// Define debugLog function
function debugLog(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(`DEBUG: ${message}`, ...args)
  }
}

// Define getDoc function (replace with your actual implementation)
async function getDoc(): Promise<GoogleSpreadsheet> {
  // Replace with your actual spreadsheet ID and credentials loading
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID)
  try {
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    })
  } catch (error) {
    console.error("Error using service account auth:", error)
    throw new Error(`Failed to authenticate with Google Sheets: ${error.message}`)
  }
  await doc.loadInfo() // loads document properties and worksheets
  return doc
}

// Define SHEET_INDEX
const SHEET_INDEX = 0

// Save user data to the spreadsheet
export async function saveUserData(userData: UserData): Promise<void> {
  debugLog("Saving user data", userData)

  try {
    const doc = await getDoc()

    // Get the first sheet or create it if it doesn't exist
    let sheet
    if (doc.sheetsByIndex.length === 0) {
      debugLog("Creating new sheet")
      sheet = await doc.addSheet({ title: "Users" })
    } else {
      sheet = doc.sheetsByIndex[SHEET_INDEX]
    }

    // Check if headers exist by getting the header values
    debugLog("Checking for headers")
    await sheet.loadHeaderRow()

    // If the sheet is empty or has no headers, add them
    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      debugLog("Setting header row")
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
    debugLog("Adding new row")
    await sheet.addRow({
      ...userData,
      joinDate: new Date().toISOString(),
    })

    debugLog("User data saved successfully")
  } catch (error) {
    console.error("Error saving user data:", error)
    throw new Error(`Failed to save user data to Google Sheets: ${error.message}`)
  }
}
