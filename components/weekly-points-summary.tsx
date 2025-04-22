"use client"

import { useState, useEffect } from "react"
import { Loader2, Award, ArrowUp, ArrowDown } from "lucide-react"
import { subscribeToUserLogs } from "@/lib/firebase-db"
import { calculatePointsForLog, getCurrentWeekDates, formatDateForDisplay } from "@/lib/calculate-points"

interface WeeklyPointsSummaryProps {
  userId: string
}

export function WeeklyPointsSummary({ userId }: WeeklyPointsSummaryProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [weeklyPoints, setWeeklyPoints] = useState<any[]>([])
  const [totalWeeklyPoints, setTotalWeeklyPoints] = useState(0)
  const [bestDay, setBestDay] = useState<{ day: string; points: number } | null>(null)
  const [showBreakdown, setShowBreakdown] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    // Get current week's date range
    const { startDate, endDate } = getCurrentWeekDates()

    // Subscribe to user logs
    const unsubscribe = subscribeToUserLogs(userId, (logs) => {
      // Filter logs for the current week
      const weekLogs = logs.filter((log) => {
        const logDate = new Date(log.date)
        return logDate >= startDate && logDate <= endDate
      })

      // Initialize daily points for each day of the week
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const dailyPoints = days.map((day, index) => {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + index)

        return {
          day,
          shortDay: formatDateForDisplay(date),
          date: new Date(date),
          points: 0,
          hasLog: false,
          breakdown: {
            steps: 0,
            noSugar: 0,
            workout: 0,
            water: 0,
            sleep: 0,
          },
        }
      })

      // Calculate points for each log and add to the corresponding day
      weekLogs.forEach((log) => {
        const logDate = new Date(log.date)
        const dayIndex = logDate.getDay() // 0 = Sunday, 6 = Saturday

        const pointsData = calculatePointsForLog(log)

        dailyPoints[dayIndex].points = pointsData.total
        dailyPoints[dayIndex].hasLog = true
        dailyPoints[dayIndex].breakdown = pointsData.breakdown
      })

      // Calculate total weekly points
      const total = dailyPoints.reduce((sum, day) => sum + day.points, 0)
      setTotalWeeklyPoints(total)

      // Find the best day
      const best = dailyPoints.reduce((best, current) => (current.points > (best?.points || 0) ? current : best), null)
      setBestDay(best ? { day: best.day, points: best.points } : null)

      setWeeklyPoints(dailyPoints)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [userId])

  const toggleBreakdown = (day: string) => {
    if (showBreakdown === day) {
      setShowBreakdown(null)
    } else {
      setShowBreakdown(day)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600 mr-2" />
        <span className="text-gray-700">Loading weekly points...</span>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">This Week's Points</h2>
        <div className="flex items-center bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
          <Award className="h-4 w-4 mr-1" />
          <span>{totalWeeklyPoints} total points</span>
        </div>
      </div>

      {bestDay && bestDay.points > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md">
          <p className="text-sm text-green-800">
            <span className="font-medium">Best day:</span> {bestDay.day} with {bestDay.points} points
          </p>
        </div>
      )}

      <div className="space-y-3">
        {weeklyPoints.map((day) => (
          <div key={day.day} className="relative">
            <div
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                day.hasLog ? "bg-gray-50 hover:bg-gray-100" : "bg-gray-50 opacity-70"
              }`}
              onClick={() => day.hasLog && toggleBreakdown(day.day)}
            >
              <div className="flex items-center">
                <div className="w-20 font-medium text-gray-700">{day.shortDay}</div>
                <div className="flex-1">
                  {day.hasLog ? (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">{day.points} points</span>
                      {showBreakdown === day.day ? (
                        <ArrowUp className="h-4 w-4 ml-1 text-gray-500" />
                      ) : (
                        <ArrowDown className="h-4 w-4 ml-1 text-gray-500" />
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">No log yet</span>
                  )}
                </div>
              </div>

              {/* Visual indicator of points */}
              <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${Math.min(100, (day.points / 50) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Point breakdown */}
            {showBreakdown === day.day && day.hasLog && (
              <div className="mt-1 ml-8 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
                <h4 className="font-medium text-gray-700 mb-2">Point Breakdown:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex justify-between">
                    <span>Steps:</span>
                    <span>{day.breakdown.steps} pts</span>
                  </li>
                  <li className="flex justify-between">
                    <span>No Added Sugar:</span>
                    <span>{day.breakdown.noSugar} pts</span>
                  </li>
                  <li className="flex justify-between">
                    <span>30-min Activity:</span>
                    <span>{day.breakdown.workout} pts</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Water (2+ liters):</span>
                    <span>{day.breakdown.water} pts</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Sleep (6+ hours):</span>
                    <span>{day.breakdown.sleep} pts</span>
                  </li>
                  <li className="flex justify-between font-medium border-t border-gray-200 pt-1 mt-1">
                    <span>Total:</span>
                    <span>{day.points} pts</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
