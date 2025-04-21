"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Trophy, TrendingUp, Calendar, Loader2 } from "lucide-react"
import { getUserLogs } from "@/lib/spreadsheet-logs"

export default function Dashboard() {
  const router = useRouter()
  const [weeklyData, setWeeklyData] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem("user") || "{}")
        if (userData.name && userData.email) {
          setUserName(userData.name)
          setUserEmail(userData.email)

          // Fetch user logs from Google Sheets
          const logs = await getUserLogs(userData.email)

          if (logs.length > 0) {
            // Process logs for charts
            const processedData = processLogsForCharts(logs)
            setWeeklyData(processedData)
          } else {
            // If no logs, use mock data
            setWeeklyData(generateMockData())
          }
        } else {
          // Redirect to onboarding if no user data
          router.push("/onboarding")
        }

        // Generate mock leaderboard data
        setLeaderboard(generateLeaderboard())
      } catch (error) {
        console.error("Error fetching data:", error)
        // Use mock data as fallback
        setWeeklyData(generateMockData())
        setLeaderboard(generateLeaderboard())
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Process logs for chart display
  const processLogsForCharts = (logs) => {
    // Group logs by day of week
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayData = {}

    // Initialize days
    days.forEach((day) => {
      dayData[day] = {
        name: day,
        steps: 0,
        water: 0,
        sleep: 0,
        count: 0,
      }
    })

    // Process each log
    logs.forEach((log) => {
      const date = new Date(log.date)
      const day = days[date.getDay()]

      dayData[day].steps += Number.parseInt(log.steps) || 0
      dayData[day].water += Number.parseFloat(log.waterIntake) || 0
      dayData[day].sleep += Number.parseFloat(log.sleepHours) || 0
      dayData[day].count += 1
    })

    // Calculate averages
    return days.map((day) => {
      const data = dayData[day]
      if (data.count > 0) {
        return {
          name: day,
          steps: Math.round(data.steps / data.count),
          water: Number.parseFloat((data.water / data.count).toFixed(1)),
          sleep: Number.parseFloat((data.sleep / data.count).toFixed(1)),
        }
      }
      return {
        name: day,
        steps: 0,
        water: 0,
        sleep: 0,
      }
    })
  }

  // Mock data for the dashboard
  const generateMockData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day) => ({
      name: day,
      steps: Math.floor(Math.random() * 5000) + 3000,
      water: (Math.random() * 2 + 1).toFixed(1),
      sleep: (Math.random() * 3 + 5).toFixed(1),
    }))
  }

  const generateLeaderboard = () => {
    const names = [
      "Alex Johnson",
      "Taylor Smith",
      "Jordan Lee",
      "Casey Brown",
      "Morgan Wilson",
      "Riley Davis",
      "Jamie Miller",
      "Quinn Thomas",
      "Avery Martin",
    ]

    return names
      .map((name) => ({
        name,
        points: Math.floor(Math.random() * 500) + 100,
        streak: Math.floor(Math.random() * 10) + 1,
      }))
      .sort((a, b) => b.points - a.points)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg text-gray-700">Loading dashboard...</span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{userName ? `${userName}'s Dashboard` : "Your Dashboard"}</h1>
        <p className="text-gray-500">Track your progress in the 30-day challenge</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Daily Steps</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {weeklyData.length > 0
                        ? Math.round(weeklyData.reduce((acc, day) => acc + day.steps, 0) / weeklyData.length)
                        : 0}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Days Completed</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">7 of 30</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Your Rank</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {leaderboard.findIndex((user) => user.name === userName) + 1 || "N/A"} of {leaderboard.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Steps</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="steps" fill="#8884d8" name="Steps" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Water & Sleep Tracking</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="water"
                  stroke="#3b82f6"
                  name="Water (L)"
                  activeDot={{ r: 8 }}
                />
                <Line yAxisId="right" type="monotone" dataKey="sleep" stroke="#8b5cf6" name="Sleep (hrs)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Team Leaderboard</h2>
          <p className="mt-1 text-sm text-gray-500">See how you compare to your teammates</p>
        </div>
        <div className="border-t border-gray-200">
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-6">Name</div>
              <div className="col-span-3">Points</div>
              <div className="col-span-2">Streak</div>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {leaderboard.map((user, index) => (
              <li key={user.name} className={`px-4 py-4 sm:px-6 ${user.name === userName ? "bg-purple-50" : ""}`}>
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-1 font-medium text-gray-900">
                    {index === 0 ? (
                      <span className="text-yellow-500">🥇</span>
                    ) : index === 1 ? (
                      <span className="text-gray-400">🥈</span>
                    ) : index === 2 ? (
                      <span className="text-orange-500">🥉</span>
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <div className="col-span-6 font-medium text-gray-900">
                    {user.name}
                    {user.name === userName && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        You
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-gray-500">{user.points} pts</div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {user.streak} day{user.streak !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
