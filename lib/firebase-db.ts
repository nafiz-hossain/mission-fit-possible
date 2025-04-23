import { db } from "./firebase"
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore"
import type { User } from "firebase/auth"

// Define the structure of user data
export interface UserData {
  uid?: string
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
  joinDate?: Date
  photoURL?: string
  challengeStartDate?: string
}

// Define the structure of daily log data
export interface DailyLogData {
  uid?: string
  email: string
  steps: string
  noAddedSugar: boolean
  waterIntake: string
  sleepHours: string
  didWorkout: boolean
  date: string | Date
  id?: string // Added to track document ID for updates
}

// Check if a user already exists in the users collection
export async function checkUserExists(uid: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    return userSnap.exists()
  } catch (error) {
    console.error("Error checking user:", error)
    return false
  }
}

// Save user data to Firestore
export async function saveUserData(userData: UserData, user: User): Promise<void> {
  try {
    // Check if user already exists
    const exists = await checkUserExists(user.uid)

    if (exists) {
      // Update existing user
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        ...userData,
        updatedAt: new Date(),
      })
    } else {
      // Create new user document with user's UID as the document ID
      const userRef = doc(db, "users", user.uid)
      await setDoc(userRef, {
        ...userData,
        uid: user.uid,
        email: user.email,
        photoURL: user.photoURL,
        joinDate: new Date(),
      })
    }

    console.log("User data saved successfully to Firebase")
  } catch (error) {
    console.error("Error saving user data:", error)
    throw new Error(`Failed to save user data to Firebase: ${error.message}`)
  }
}

// Get user data from Firestore
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data() as UserData
    }

    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    return null
  }
}

// Update user profile
export async function updateUserProfile(uid: string, data: Partial<UserData>): Promise<void> {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date(),
    })
    console.log("User profile updated successfully")
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw new Error(`Failed to update user profile: ${error.message}`)
  }
}

// Check if a log exists for the current date
export async function checkLogExistsForDate(uid: string, date: Date): Promise<{ exists: boolean; log?: DailyLogData }> {
  try {
    const logsRef = collection(db, "dailyLogs")

    // Format date to YYYY-MM-DD
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    const dd = String(date.getDate()).padStart(2, "0")
    const formattedDate = `${yyyy}-${mm}-${dd}`

    // Use doc ID pattern to directly check
    const docId = `${uid}_${formattedDate}`
    const logRef = doc(db, "dailyLogs", docId)
    const logSnap = await getDoc(logRef)

    if (!logSnap.exists()) {
      return { exists: false }
    }

    const data = logSnap.data()
    console.log("✅ Log found for:", formattedDate, data)

    const logData: DailyLogData = {
      uid: data.uid,
      email: data.email,
      steps: data.steps,
      noAddedSugar: data.noAddedSugar,
      waterIntake: data.waterIntake,
      sleepHours: data.sleepHours,
      didWorkout: data.didWorkout,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      id: logSnap.id,
    }

    return { exists: true, log: logData }
  } catch (error) {
    console.error("Error checking log for date:", error)
    return { exists: false }
  }
}


// Update an existing daily log
export async function updateDailyLog(logId: string, logData: Partial<DailyLogData>): Promise<void> {
  try {
    const logRef = doc(db, "dailyLogs", logId)

    // Remove id from the data to be updated
    const { id, ...dataToUpdate } = logData

    await updateDoc(logRef, {
      ...dataToUpdate,
      updatedAt: new Date(),
    })

    console.log("Daily log updated successfully")
  } catch (error) {
    console.error("Error updating daily log:", error)
    throw new Error(`Failed to update daily log: ${error.message}`)
  }
}

// // Save daily log to Firestore
// export async function saveDailyLog(logData: DailyLogData, uid: string): Promise<void> {
//   try {
//     const logsRef = collection(db, "dailyLogs")

//     // Convert string date to Date object if it's not already
//     const date = typeof logData.date === "string" ? new Date(logData.date) : logData.date

//     await addDoc(logsRef, {
//       ...logData,
//       uid,
//       date,
//       timestamp: Timestamp.now(),
//     })
//     console.log("Daily log saved successfully to Firebase")
//   } catch (error) {
//     console.error("Error saving daily log:", error)
//     throw new Error(`Failed to save daily log to Firebase: ${error.message}`)
//   }
// }

export async function saveDailyLog(logData: DailyLogData, uid: string): Promise<void> {
  try {
    // Convert string date to Date object if it's not already
    const dateObj = typeof logData.date === "string" ? new Date(logData.date) : logData.date

    const yyyy = dateObj.getFullYear()
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0')
    const dd = String(dateObj.getDate()).padStart(2, '0')
    const formattedDate = `${yyyy}-${mm}-${dd}`

    const docId = `${uid}_${formattedDate}`
    const docRef = doc(db, "dailyLogs", docId)

    await setDoc(docRef, {
      ...logData,
      uid,
      date: dateObj,
      timestamp: Timestamp.now(),
    })

    console.log("Daily log saved successfully to Firebase")
  } catch (error: any) {
    console.error("Error saving daily log:", error)
    throw new Error(`Failed to save daily log to Firebase: ${error.message}`)
  }
}

// Get logs for a specific user
export async function getUserLogs(uid: string): Promise<DailyLogData[]> {
  try {
    const logsRef = collection(db, "dailyLogs")
    const q = query(logsRef, where("uid", "==", uid), orderBy("date", "desc"))

    const querySnapshot = await getDocs(q)
    const logs: DailyLogData[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      logs.push({
        uid: data.uid,
        email: data.email,
        steps: data.steps,
        noAddedSugar: data.noAddedSugar,
        waterIntake: data.waterIntake,
        sleepHours: data.sleepHours,
        didWorkout: data.didWorkout,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        id: doc.id,
      })
    })

    return logs
  } catch (error) {
    console.error("Error getting user logs:", error)
    return []
  }
}

// Subscribe to real-time updates for user logs
export function subscribeToUserLogs(uid: string, callback: (logs: DailyLogData[]) => void) {
  const logsRef = collection(db, "dailyLogs")
  const q = query(logsRef, where("uid", "==", uid), orderBy("date", "desc"))

  return onSnapshot(q, (querySnapshot) => {
    const logs: DailyLogData[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      logs.push({
        uid: data.uid,
        email: data.email,
        steps: data.steps,
        noAddedSugar: data.noAddedSugar,
        waterIntake: data.waterIntake,
        sleepHours: data.sleepHours,
        didWorkout: data.didWorkout,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        id: doc.id,
      })
    })
    callback(logs)
  })
}

// Get leaderboard data
export async function getLeaderboardData(): Promise<any[]> {
  try {
    // Get all users
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(usersRef)

    const users: any[] = []
    usersSnapshot.forEach((doc) => {
      const userData = doc.data()
      users.push({
        uid: doc.id,
        name: userData.name,
        email: userData.email,
        photoURL: userData.photoURL,
      })
    })

    // Get logs for each user to calculate points
    const leaderboard = await Promise.all(
      users.map(async (user) => {
        const logsRef = collection(db, "dailyLogs")
        const q = query(logsRef, where("uid", "==", user.uid))
        const logsSnapshot = await getDocs(q)

        let points = 0
        let streak = 0
        const logDates = new Set()

        logsSnapshot.forEach((doc) => {
          const logData = doc.data()
          const steps = Number.parseInt(logData.steps) || 0

          // Add points for steps based on tiers
          if (steps >= 20000) {
            points += 25 // 25 points for 20000+ steps
          } else if (steps >= 15000) {
            points += 20 // 20 points for 15000-19999 steps
          } else if (steps >= 10000) {
            points += 15 // 15 points for 10000-14999 steps
          } else if (steps >= 5000) {
            points += 10 // 10 points for 5000-9999 steps
          }

          // Add points for other activities
          points += logData.noAddedSugar ? 4 : 0 // 4 points for no sugar
          points += logData.didWorkout ? 12 : 0 // 12 points for 30-minute activity

          // Add points for water intake (5 points if 2+ liters)
          const waterIntake = Number.parseFloat(logData.waterIntake) || 0
          points += waterIntake >= 2 ? 5 : 0

          // Add points for sleep (8 points if 6+ hours)
          const sleepHours = Number.parseFloat(logData.sleepHours) || 0
          points += sleepHours >= 6 ? 8 : 0

          // Track dates for streak calculation
          if (logData.date) {
            const dateObj = logData.date?.toDate ? logData.date.toDate() : new Date(logData.date)
const dateStr = dateObj.toDateString()
            logDates.add(dateStr)
          }
        })

        // Calculate streak (simplified version)
        streak = logDates.size

        return {
          uid: user.uid,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          points: Math.round(points),
          streak,
        }
      }),
    )

    // Sort by points
    return leaderboard.sort((a, b) => b.points - a.points)
  } catch (error) {
    console.error("Error getting leaderboard data:", error)
    return []
  }
}

// Subscribe to real-time leaderboard updates
export function subscribeToLeaderboard(callback: (leaderboard: any[]) => void) {
  // This is a simplified implementation that re-fetches the leaderboard when any daily log changes
  const logsRef = collection(db, "dailyLogs")

  return onSnapshot(logsRef, async () => {
    const leaderboard = await getLeaderboardData()
    callback(leaderboard)
  })
}

// Import missing functions
import { setDoc } from "firebase/firestore"
