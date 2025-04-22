"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { saveUserData, checkUserExists } from "@/lib/firebase-db"
import { useAuth } from "@/contexts/auth-context"

export default function Onboarding() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    currentWeight: "",
    averageSteps: "",
    hasSugarTooth: "",
    waterIntake: "",
    sleepHours: "",
    workoutHours: "",
    fitnessGoal: "",
    healthFocus: "",
    challengeStartDate: new Date().toISOString().split("T")[0], // Default to today
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Check authentication status
  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    // Pre-fill name from user profile if available
    if (user.displayName) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
      }))
    }

    // Check if user already has a profile
    const checkProfile = async () => {
      try {
        const exists = await checkUserExists(user.uid)
        if (exists) {
          // User already has a profile, redirect to dashboard
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking user profile:", error)
      }
    }

    checkProfile()
  }, [user, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setError("")

    try {
      // Update form data with user info
      const updatedFormData = {
        ...formData,
        email: user.email,
        name: formData.name || user.displayName || "",
      }

      // Save user data to Firebase
      await saveUserData(updatedFormData, user)
      console.log("User data saved to Firebase successfully")

      // Store user data in localStorage for other components
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...updatedFormData,
          uid: user.uid,
        }),
      )

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("An error occurred while submitting the form. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg text-gray-700">Loading...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <div className="flex items-center mb-6">
          {user?.photoURL && (
            <img src={user.photoURL || "/placeholder.svg"} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Join the Challenge</h1>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder={user?.displayName || ""}
            />
          </div>

          <div>
            <label htmlFor="challengeStartDate" className="block text-sm font-medium text-gray-700">
              Challenge Start Date
            </label>
            <input
              type="date"
              id="challengeStartDate"
              name="challengeStartDate"
              required
              value={formData.challengeStartDate}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-gray-500">This is when your 30-day challenge begins</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="currentWeight" className="block text-sm font-medium text-gray-700">
                Current Weight (kg)
              </label>
              <input
                type="number"
                id="currentWeight"
                name="currentWeight"
                required
                min="30"
                max="300"
                value={formData.currentWeight}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="averageSteps" className="block text-sm font-medium text-gray-700">
                Average Current Step Count
              </label>
              <input
                type="number"
                id="averageSteps"
                name="averageSteps"
                required
                min="0"
                max="50000"
                value={formData.averageSteps}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="hasSugarTooth" className="block text-sm font-medium text-gray-700">
                Do you have a sugar tooth?
              </label>
              <select
                id="hasSugarTooth"
                name="hasSugarTooth"
                required
                value={formData.hasSugarTooth}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="">Select an option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Sometimes">Sometimes</option>
              </select>
            </div>

            <div>
              <label htmlFor="waterIntake" className="block text-sm font-medium text-gray-700">
                Daily Water Intake (liters)
              </label>
              <input
                type="number"
                id="waterIntake"
                name="waterIntake"
                required
                min="0"
                max="10"
                step="0.1"
                value={formData.waterIntake}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="sleepHours" className="block text-sm font-medium text-gray-700">
                Approximate Sleep Hours
              </label>
              <input
                type="number"
                id="sleepHours"
                name="sleepHours"
                required
                min="0"
                max="24"
                step="0.5"
                value={formData.sleepHours}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="workoutHours" className="block text-sm font-medium text-gray-700">
                Approximate Workout Hours (weekly)
              </label>
              <input
                type="number"
                id="workoutHours"
                name="workoutHours"
                required
                min="0"
                max="50"
                step="0.5"
                value={formData.workoutHours}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700">
              Fitness Goals (1-2 lines)
            </label>
            <textarea
              id="fitnessGoal"
              name="fitnessGoal"
              rows={2}
              value={formData.fitnessGoal}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="What do you hope to achieve during this challenge?"
            />
          </div>

          <div>
            <label htmlFor="healthFocus" className="block text-sm font-medium text-gray-700">
              Any personal health focus (e.g. sugar reduction, sleep improvement)
            </label>
            <textarea
              id="healthFocus"
              name="healthFocus"
              rows={2}
              value={formData.healthFocus}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              placeholder="What specific health area would you like to focus on?"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...
                </>
              ) : (
                "Join Challenge"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
