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

    // Create date range for the given date (start of day to end of day)
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)

    const q = query(logsRef, where("uid", "==", uid), where("date", ">=", startDate), where("date", "<=", endDate))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return { exists: false }
    }

    // Return the first log found for that day
    const docData = querySnapshot.docs[0].data()
    const logData: DailyLogData = {
      uid: docData.uid,
      email: docData.email,
      steps: docData.steps,
      noAddedSugar: docData.noAddedSugar,
      waterIntake: docData.waterIntake,
      sleepHours: docData.sleepHours,
      didWorkout: docData.didWorkout,
      date: docData.date.toDate(),
      id: querySnapshot.docs[0].id,
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

// Save daily log to Firestore
export async function saveDailyLog(logData: DailyLogData, uid: string): Promise<void> {
  try {
    const logsRef = collection(db, "dailyLogs")

    // Convert string date to Date object if it's not already
    const date = typeof logData.date === "string" ? new Date(logData.date) : logData.date

    await addDoc(logsRef, {
      ...logData,
      uid,
      date,
      timestamp: Timestamp.now(),
    })
    console.log("Daily log saved successfully to Firebase")
  } catch (error) {
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
        date: data.date.toDate(),
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
        date: data.date.toDate(),
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

          // Add points for activities
          points += Number.parseInt(logData.steps) / 1000 // 1 point per 1000 steps
          points += logData.noAddedSugar ? 10 : 0 // 10 points for no sugar
          points += Number.parseFloat(logData.waterIntake) * 5 // 5 points per liter
          points += Number.parseFloat(logData.sleepHours) * 2 // 2 points per hour of sleep
          points += logData.didWorkout ? 20 : 0 // 20 points for workout

          // Track dates for streak calculation
          if (logData.date) {
            const dateStr = logData.date.toDate().toDateString()
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
