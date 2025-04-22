import type { DailyLogData } from "./firebase-db"

/**
 * Calculate points for a single log entry based on the challenge point system
 */
export function calculatePointsForLog(log: DailyLogData): {
  total: number
  breakdown: {
    steps: number
    noSugar: number
    workout: number
    water: number
    sleep: number
  }
} {
  const steps = Number.parseInt(log.steps) || 0
  const waterIntake = Number.parseFloat(log.waterIntake) || 0
  const sleepHours = Number.parseFloat(log.sleepHours) || 0

  // Calculate points for steps based on tiers
  let stepsPoints = 0
  if (steps >= 20000) {
    stepsPoints = 25 // 25 points for 20000+ steps
  } else if (steps >= 15000) {
    stepsPoints = 20 // 20 points for 15000-19999 steps
  } else if (steps >= 10000) {
    stepsPoints = 15 // 15 points for 10000-14999 steps
  } else if (steps >= 5000) {
    stepsPoints = 10 // 10 points for 5000-9999 steps
  }

  // Calculate points for other activities
  const noSugarPoints = log.noAddedSugar ? 4 : 0 // 4 points for no sugar
  const workoutPoints = log.didWorkout ? 12 : 0 // 12 points for 30-minute activity
  const waterPoints = waterIntake >= 2 ? 5 : 0 // 5 points if 2+ liters
  const sleepPoints = sleepHours >= 6 ? 8 : 0 // 8 points if 6+ hours

  // Calculate total points
  const totalPoints = stepsPoints + noSugarPoints + workoutPoints + waterPoints + sleepPoints

  return {
    total: totalPoints,
    breakdown: {
      steps: stepsPoints,
      noSugar: noSugarPoints,
      workout: workoutPoints,
      water: waterPoints,
      sleep: sleepPoints,
    },
  }
}

/**
 * Get the start and end dates for the current week (Sunday to Saturday)
 */
export function getCurrentWeekDates(): { startDate: Date; endDate: Date } {
  const now = new Date()
  const currentDay = now.getDay() // 0 = Sunday, 6 = Saturday

  // Calculate the date for Sunday (start of week)
  const startDate = new Date(now)
  startDate.setDate(now.getDate() - currentDay)
  startDate.setHours(0, 0, 0, 0)

  // Calculate the date for Saturday (end of week)
  const endDate = new Date(now)
  endDate.setDate(now.getDate() + (6 - currentDay))
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}

/**
 * Format a date as a string (e.g., "Mon 5/15")
 */
export function formatDateForDisplay(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const dayName = days[date.getDay()]
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${dayName} ${month}/${day}`
}
