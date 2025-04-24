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
import { PointSystem } from "@/components/point-system"
// Import the WeeklyPointsSummary component
import { WeeklyPointsSummary } from "@/components/weekly-points-summary"

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
  const [challengeStartDate, setChallengeStartDate] = useState("")
  const [daysCompleted, setDaysCompleted] = useState(0)
  const [daysRemaining, setDaysRemaining] = useState(30)
  const [averageSteps, setAverageSteps] = useState(0)
  const [userData, setUserData] = useState(null)

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
        const userDataResult = await getUserData(user.uid)
        if (userDataResult) {
          setUserData(userDataResult)
          setUserName(userDataResult.name || user.displayName || "")
          setUserEmail(userDataResult.email || user.email || "")
          setChallengeStartDate(userDataResult.challengeStartDate || new Date().toISOString().split("T")[0])

          // Store in localStorage for other components
          localStorage.setItem(
            "user",
            JSON.stringify({
              name: userDataResult.name || user.displayName || "",
              email: userDataResult.email || user.email || "",
              uid: user.uid,
              challengeStartDate: userDataResult.challengeStartDate,
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
            // Calculate days completed
            calculateDaysCompleted(logs, userDataResult.challengeStartDate)

            // Calculate average steps
            const totalSteps = logs.reduce((sum, log) => sum + Number(log.steps || 0), 0)
            setAverageSteps(Math.round(totalSteps / logs.length))

            // Process logs for charts
            const processedData = processLogsForCharts(logs)
            setWeeklyData(processedData)

            // Generate activity distribution data
            setActivityDistribution(generateActivityDistribution(logs))

            // Generate weekly progress data
            setWeeklyProgress(generateWeeklyProgress(logs, userDataResult.challengeStartDate))

            // Generate fitness radar data
            setFitnessRadar(generateFitnessRadar(logs))
          } else {
            setDaysCompleted(0)
            setDaysRemaining(30)
            setAverageSteps(0)
            setWeeklyData([])
            setActivityDistribution([])
            setWeeklyProgress([])
            setFitnessRadar([])
          }
          setIsLoading(false)
        })

        // Subscribe to real-time updates for leaderboard
        unsubscribeLeaderboard = subscribeToLeaderboard((data) => {
          setLeaderboard(data)
        })
      } catch (error) {
        console.error("Error fetching data:", error)
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

  // Calculate days completed and remaining based on challenge start date
  const calculateDaysCompleted = (logs, startDateStr) => {
    if (!startDateStr) {
      setDaysCompleted(0)
      setDaysRemaining(30)
      return
    }

    const startDate = new Date(startDateStr)
    const today = new Date()

    // Calculate days elapsed since challenge start
    const diffTime = Math.abs(today - startDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Calculate days with logs
    const uniqueDates = new Set()
    logs.forEach((log) => {
      const logDate = new Date(log.date)
      uniqueDates.add(logDate.toISOString().split("T")[0])
    })

    const completedDays = uniqueDates.size
    setDaysCompleted(completedDays)

    // Calculate remaining days (30-day challenge)
    const remaining = Math.max(0, 30 - diffDays)
    setDaysRemaining(remaining)
  }

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
  const generateWeeklyProgress = (logs, startDateStr) => {// Get the last 7 days
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
        let score = 0
    
        // Steps
        const steps = Number.parseInt(log.steps)
        if (steps >= 20000) {
          score += 25
        } else if (steps >= 15000) {
          score += 20
        } else if (steps >= 10000) {
          score += 15
        } else if (steps >= 5000) {
          score += 10
        }
        else if (steps >= 2500) {
          score += 5
        }
    
        // No added sugar
        if (log.noAddedSugar) {
          score += 4
        }
    
        // 30-minute activity
        if (log.didWorkout) {
          score += 12
        }
    
        // Water intake (2+ liters)
        if (Number.parseFloat(log.waterIntake) >= 2) {
          score += 5
        }
    
        // Sleep (6+ hours)
        if (Number.parseFloat(log.sleepHours) >= 6) {
          score += 8
        }
        else if (Number.parseFloat(log.sleepHours) >= 5 && Number.parseFloat(log.sleepHours) < 6) {
          score += 5;
        }
    
        last7Days[dayIndex].value = score
      }
    })
    console.log(last7Days)
    return last7Days
  }

  const generateFitnessRadar = (logs) => {
    if (!logs || logs.length === 0) return []
  
    let totalPoints = {
      Steps: 0,
      Water: 0,
      Sleep: 0,
      Workouts: 0,
      NoSugar: 0,
    }
  
    logs.forEach((log) => {
      const steps = parseInt(log.steps) || 0
      const water = parseFloat(log.waterIntake) || 0
      const sleep = parseFloat(log.sleepHours) || 0
      const workout = log.didWorkout
      const noSugar = log.noAddedSugar
  
      // Updated Step Points
      if (steps >= 20000) totalPoints.Steps += 25
      else if (steps >= 15000) totalPoints.Steps += 20
      else if (steps >= 10000) totalPoints.Steps += 15
      else if (steps >= 5000) totalPoints.Steps += 10
      
  
      // New Step Bonus: 2500+ steps = 5 pts
      else if (steps >= 2500) totalPoints.Steps += 5
  
      // Water
      if (water >= 2) totalPoints.Water += 5
  
      // Sleep
      if (sleep >= 6) totalPoints.Sleep += 8
      else if (sleep >= 5) totalPoints.Sleep += 5 // extra bonus for 5+ hrs sleep
  
      // Workout
      if (workout) totalPoints.Workouts += 12
  
      // No Sugar
      if (noSugar) totalPoints.NoSugar += 4
    })
  
    const maxPoints = {
      Steps: 25 * logs.length,      // Max: 25 + 5 bonus
      Water: 5 * logs.length,
      Sleep: 8 * logs.length,      // Max: 8 + 5 bonus
      Workouts: 12 * logs.length,
      NoSugar: 4 * logs.length,
    }
  
    return [
      {
        subject: "Steps",
        A: Math.round((totalPoints.Steps / maxPoints.Steps) * 100),
        fullMark: 100,
      },
      {
        subject: "Water",
        A: Math.round((totalPoints.Water / maxPoints.Water) * 100),
        fullMark: 100,
      },
      {
        subject: "Sleep",
        A: Math.round((totalPoints.Sleep / maxPoints.Sleep) * 100),
        fullMark: 100,
      },
      {
        subject: "Workouts",
        A: Math.round((totalPoints.Workouts / maxPoints.Workouts) * 100),
        fullMark: 100,
      },
      {
        subject: "No Sugar",
        A: Math.round((totalPoints.NoSugar / maxPoints.NoSugar) * 100),
        fullMark: 100,
      },
    ]
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
                    <div className="text-lg font-medium text-gray-900">{averageSteps.toLocaleString()}</div>
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
                    <div className="text-lg font-medium text-gray-900">{daysCompleted} of 30</div>
                    <div className="text-sm text-gray-500">
                      {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Challenge completed!"}
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

      {/* Weekly Points Summary - Add this section */}
      <div className="mb-8">{user && <WeeklyPointsSummary userId={user.uid} />}</div>

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

      {/* Add this right before the Leaderboard section */}
      <div className="mb-8">
        <PointSystem />
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
