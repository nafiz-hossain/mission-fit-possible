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
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Trophy, TrendingUp, Calendar, Loader2 } from "lucide-react"
import { subscribeToUserLogs, subscribeToLeaderboard, getUserData } from "@/lib/firebase-db"
import { useAuth } from "@/contexts/auth-context"

export default function Dashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [weeklyData, setWeeklyData] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [activityDistribution, setActivityDistribution] = useState([])
  const [weeklyProgress, setWeeklyProgress] = useState([])
  const [fitnessRadar, setFitnessRadar] = useState([])

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    let unsubscribeUserLogs = () => {}
    let unsubscribeLeaderboard = () => {}

    const fetchData = async () => {
      try {
        // Get user data
        const userData = await getUserData(user.uid)
        if (userData) {
          setUserName(userData.name || user.displayName || "")
          setUserEmail(userData.email || user.email || "")

          // Store in localStorage for other components
          localStorage.setItem(
            "user",
            JSON.stringify({
              name: userData.name || user.displayName || "",
              email: userData.email || user.email || "",
              uid: user.uid,
            }),
          )
        } else {
          // Redirect to onboarding if no user data
          router.push("/onboarding")
          return
        }

        // Subscribe to real-time updates for user logs
        unsubscribeUserLogs = subscribeToUserLogs(user.uid, (logs) => {
          if (logs.length > 0) {
            // Process logs for charts
            const processedData = processLogsForCharts(logs)
            setWeeklyData(processedData)

            // Generate activity distribution data
            setActivityDistribution(generateActivityDistribution(logs))

            // Generate weekly progress data
            setWeeklyProgress(generateWeeklyProgress(logs))

            // Generate fitness radar data
            setFitnessRadar(generateFitnessRadar(logs))
          } else {
            // If no logs, use mock data
            setWeeklyData(generateMockData())
            setActivityDistribution(generateMockActivityDistribution())
            setWeeklyProgress(generateMockWeeklyProgress())
            setFitnessRadar(generateMockFitnessRadar())
          }
          setIsLoading(false)
        })

        // Subscribe to real-time updates for leaderboard
        unsubscribeLeaderboard = subscribeToLeaderboard((data) => {
          setLeaderboard(data)
        })
      } catch (error) {
        console.error("Error fetching data:", error)
        // Use mock data as fallback
        setWeeklyData(generateMockData())
        setLeaderboard(generateLeaderboard())
        setActivityDistribution(generateMockActivityDistribution())
        setWeeklyProgress(generateMockWeeklyProgress())
        setFitnessRadar(generateMockFitnessRadar())
        setIsLoading(false)
      }
    }

    fetchData()

    // Cleanup subscriptions
    return () => {
      unsubscribeUserLogs()
      unsubscribeLeaderboard()
    }
  }, [user, loading, router])

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

  // Generate activity distribution data
  const generateActivityDistribution = (logs) => {
    let totalSteps = 0
    let totalWater = 0
    let totalSleep = 0
    let totalWorkouts = 0
    let totalNoSugar = 0

    logs.forEach((log) => {
      totalSteps += Number.parseInt(log.steps) || 0
      totalWater += Number.parseFloat(log.waterIntake) || 0
      totalSleep += Number.parseFloat(log.sleepHours) || 0
      totalWorkouts += log.didWorkout ? 1 : 0
      totalNoSugar += log.noAddedSugar ? 1 : 0
    })

    return [
      { name: "Steps", value: totalSteps / 1000 }, // Divide by 1000 to make it comparable
      { name: "Water", value: totalWater * 10 }, // Multiply by 10 to make it comparable
      { name: "Sleep", value: totalSleep * 5 }, // Multiply by 5 to make it comparable
      { name: "Workouts", value: totalWorkouts * 20 }, // Multiply by 20 to make it comparable
      { name: "No Sugar", value: totalNoSugar * 15 }, // Multiply by 15 to make it comparable
    ]
  }

  // Generate weekly progress data
  const generateWeeklyProgress = (logs) => {
    // Get the last 7 days
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      last7Days.push({
        date,
        dateString: date.toISOString().split("T")[0],
        name: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
        value: 0,
      })
    }

    // Calculate progress for each day
    logs.forEach((log) => {
      const logDate = new Date(log.date)
      const logDateString = logDate.toISOString().split("T")[0]

      const dayIndex = last7Days.findIndex((day) => day.dateString === logDateString)
      if (dayIndex !== -1) {
        // Calculate a progress score
        let score = 0
        score += Number.parseInt(log.steps) / 1000 // 1 point per 1000 steps
        score += Number.parseFloat(log.waterIntake) * 5 // 5 points per liter
        score += Number.parseFloat(log.sleepHours) * 2 // 2 points per hour
        score += log.didWorkout ? 20 : 0 // 20 points for workout
        score += log.noAddedSugar ? 10 : 0 // 10 points for no sugar

        last7Days[dayIndex].value = score
      }
    })

    return last7Days
  }

  // Generate fitness radar data
  const generateFitnessRadar = (logs) => {
    if (logs.length === 0) return []

    // Calculate averages
    let totalSteps = 0
    let totalWater = 0
    let totalSleep = 0
    let totalWorkouts = 0
    let totalNoSugar = 0

    logs.forEach((log) => {
      totalSteps += Number.parseInt(log.steps) || 0
      totalWater += Number.parseFloat(log.waterIntake) || 0
      totalSleep += Number.parseFloat(log.sleepHours) || 0
      totalWorkouts += log.didWorkout ? 1 : 0
      totalNoSugar += log.noAddedSugar ? 1 : 0
    })

    const avgSteps = totalSteps / logs.length
    const avgWater = totalWater / logs.length
    const avgSleep = totalSleep / logs.length
    const workoutPercentage = (totalWorkouts / logs.length) * 100
    const noSugarPercentage = (totalNoSugar / logs.length) * 100

    return [
      {
        subject: "Steps",
        A: Math.min(100, (avgSteps / 10000) * 100), // 10000 steps is 100%
        fullMark: 100,
      },
      {
        subject: "Water",
        A: Math.min(100, (avgWater / 3) * 100), // 3 liters is 100%
        fullMark: 100,
      },
      {
        subject: "Sleep",
        A: Math.min(100, (avgSleep / 8) * 100), // 8 hours is 100%
        fullMark: 100,
      },
      {
        subject: "Workouts",
        A: workoutPercentage,
        fullMark: 100,
      },
      {
        subject: "No Sugar",
        A: noSugarPercentage,
        fullMark: 100,
      },
    ]
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

  const generateMockActivityDistribution = () => {
    return [
      { name: "Steps", value: 40 },
      { name: "Water", value: 25 },
      { name: "Sleep", value: 35 },
      { name: "Workouts", value: 20 },
      { name: "No Sugar", value: 15 },
    ]
  }

  const generateMockWeeklyProgress = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return days.map((day) => ({
      name: day,
      value: Math.floor(Math.random() * 50) + 30,
    }))
  }

  const generateMockFitnessRadar = () => {
    return [
      { subject: "Steps", A: 80, fullMark: 100 },
      { subject: "Water", A: 65, fullMark: 100 },
      { subject: "Sleep", A: 75, fullMark: 100 },
      { subject: "Workouts", A: 60, fullMark: 100 },
      { subject: "No Sugar", A: 70, fullMark: 100 },
    ]
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

  // Colors for pie chart
  const COLORS = ["#8884d8", "#83a6ed", "#8dd1e1", "#82ca9d", "#a4de6c"]

  if (loading || isLoading) {
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
                      {leaderboard.findIndex((u) => u.uid === user?.uid) + 1 || "N/A"} of {leaderboard.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Charts */}
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

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Activity Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {activityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Fitness Radar</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={fitnessRadar}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Your Performance" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Progress</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyProgress} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name="Progress Score" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
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
            {leaderboard.map((u, index) => (
              <li key={u.uid || u.name} className={`px-4 py-4 sm:px-6 ${u.uid === user?.uid ? "bg-purple-50" : ""}`}>
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
                  <div className="col-span-6 font-medium text-gray-900 flex items-center">
                    {u.photoURL && (
                      <img src={u.photoURL || "/placeholder.svg"} alt={u.name} className="w-6 h-6 rounded-full mr-2" />
                    )}
                    {u.name}
                    {u.uid === user?.uid && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        You
                      </span>
                    )}
                  </div>
                  <div className="col-span-3 text-gray-500">{u.points} pts</div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {u.streak} day{u.streak !== 1 ? "s" : ""}
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
