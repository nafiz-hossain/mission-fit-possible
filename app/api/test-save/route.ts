import { NextResponse } from "next/server"
import { saveUserData } from "@/lib/spreadsheet"
import { saveDailyLog } from "@/lib/spreadsheet-logs"

export async function GET() {
  try {
    // Test user data
    const testUserData = {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      currentWeight: "70",
      averageSteps: "8000",
      hasSugarTooth: "Sometimes",
      waterIntake: "2.5",
      sleepHours: "7",
      workoutHours: "3",
      fitnessGoal: "Test fitness goal",
      healthFocus: "Test health focus",
    }

    // Test log data
    const testLogData = {
      email: `test-${Date.now()}@example.com`,
      steps: "9000",
      noAddedSugar: true,
      waterIntake: "3",
      sleepHours: "8",
      didWorkout: true,
      date: new Date().toISOString(),
    }

    // Try to save test user data
    await saveUserData(testUserData)

    // Try to save test log data
    await saveDailyLog(testLogData)

    return NextResponse.json({
      success: true,
      message: "Test data saved successfully to Google Sheets",
      testUserData,
      testLogData,
    })
  } catch (error) {
    console.error("Error in test save:", error)
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
