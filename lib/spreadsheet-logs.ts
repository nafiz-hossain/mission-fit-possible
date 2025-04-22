import { GoogleSpreadsheet } from "google-spreadsheet"

// Define the DailyLogData interface
interface DailyLogData {
  email: string
  date: string
  steps: number
  noAddedSugar: boolean
  waterIntake: number
  sleepHours: number
  didWorkout: boolean
}

// Define the LOGS_SHEET_INDEX constant
const LOGS_SHEET_INDEX = 0

// Define a simple debugLog function (replace with your actual implementation)
function debugLog(message: string, ...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log(`DEBUG: ${message}`, ...args)
  }
}

// Define a function to get the Google Spreadsheet document (replace with your actual implementation)
async function getDoc(): Promise<GoogleSpreadsheet> {
  // Replace with your actual spreadsheet ID and credentials loading logic
  const doc = new GoogleSpreadsheet("YOUR_SPREADSHEET_ID")
  // Replace with your service account credentials or API key
  // await doc.useServiceAccountAuth(require('./path/to/your/credentials.json'));
  await doc.loadInfo() // loads document properties and worksheets
  return doc
}

// Save daily log to the spreadsheet
export async function saveDailyLog(logData: DailyLogData): Promise<void> {
  debugLog("Saving daily log", logData)

  try {
    const doc = await getDoc()

    // Check if logs sheet exists, if not create it
    let sheet
    if (doc.sheetsByIndex.length <= LOGS_SHEET_INDEX) {
      debugLog("Creating new sheet for logs")
      sheet = await doc.addSheet({ title: "Daily Logs" })
    } else {
      sheet = doc.sheetsByIndex[LOGS_SHEET_INDEX]
    }

    // Check if headers exist by getting the header values
    debugLog("Checking for headers")
    await sheet.loadHeaderRow()

    // If the sheet is empty or has no headers, add them
    if (!sheet.headerValues || sheet.headerValues.length === 0) {
      debugLog("Setting header row")
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
    debugLog("Adding new row")
    await sheet.addRow(rowData)
    debugLog("Daily log saved successfully")
  } catch (error) {
    console.error("Error saving daily log:", error)
    throw new Error(`Failed to save daily log: ${error.message}`)
  }
}
