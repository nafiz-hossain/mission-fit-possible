"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getUserData, updateUserProfile } from "@/lib/firebase-db"
import { Loader2, AlertCircle, Check } from "lucide-react"

export default function Profile() {
  const { user, loading } = useAuth()
  const router = useRouter()
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
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    async function loadUserProfile() {
      if (!user) return

      try {
        const userData = await getUserData(user.uid)
        if (userData) {
          setFormData({
            name: userData.name || user.displayName || "",
            currentWeight: userData.currentWeight || "",
            averageSteps: userData.averageSteps || "",
            hasSugarTooth: userData.hasSugarTooth || "",
            waterIntake: userData.waterIntake || "",
            sleepHours: userData.sleepHours || "",
            workoutHours: userData.workoutHours || "",
            fitnessGoal: userData.fitnessGoal || "",
            healthFocus: userData.healthFocus || "",
          })
        }
      } catch (error) {
        console.error("Error loading user profile:", error)
        setError("Failed to load your profile. Please try again.")
      } finally {
        setProfileLoading(false)
      }
    }

    if (user) {
      loadUserProfile()
    } else if (!loading) {
      router.push("/login")
    }
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
    setIsSuccess(false)

    try {
      await updateUserProfile(user.uid, formData)
      setIsSuccess(true)

      // Update local storage for other components
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}")
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          ...formData,
          email: user.email,
        }),
      )

      // Clear success message after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update your profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-lg text-gray-700">Loading profile...</span>
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
            <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
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

        {isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Profile updated successfully!</p>
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
            />
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
