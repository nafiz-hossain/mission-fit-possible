"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Droplet, Footprints, Moon, Loader2 } from "lucide-react"
import { saveDailyLog } from "@/lib/spreadsheet-logs"

export default function DailyLog() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    steps: "",
    noAddedSugar: false,
    waterIntake: "",
    sleepHours: "",
    didWorkout: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  useEffect(() => {
    // Get user data from localStorage
    const userData = JSON.parse(localStorage.getItem("user") || "{}")
    if (userData.email) {
      setUserEmail(userData.email)
    } else {
      // Redirect to onboarding if no user data
      router.push("/onboarding")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!userEmail) {
        throw new Error("User email not found")
      }

      // Save log to Google Sheets
      await saveDailyLog({
        email: userEmail,
        ...formData,
        date: new Date().toISOString(),
      })

      // Store log in localStorage for demo purposes
      const logs = JSON.parse(localStorage.getItem("logs") || "[]")
      logs.push({
        ...formData,
        date: new Date().toISOString(),
      })
      localStorage.setItem("logs", JSON.stringify(logs))

      // Show success message
      setIsSuccess(true)

      // Reset form
      setFormData({
        steps: "",
        noAddedSugar: false,
        waterIntake: "",
        sleepHours: "",
        didWorkout: false,
      })

      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white shadow-md rounded-lg p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Fitness Log</h1>
        <p className="text-gray-500 mb-6">Track your healthy habits for today</p>

        {isSuccess ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Your daily log has been saved successfully!</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="steps" className="flex items-center text-sm font-medium text-gray-700">
                <Footprints className="h-5 w-5 mr-2 text-purple-500" />
                Steps walked/ran
              </label>
              <input
                type="number"
                id="steps"
                name="steps"
                required
                min="0"
                max="100000"
                value={formData.steps}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                placeholder="How many steps today?"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="noAddedSugar"
                name="noAddedSugar"
                checked={formData.noAddedSugar}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="noAddedSugar" className="ml-2 block text-sm text-gray-700">
                No added sugar today
              </label>
            </div>

            <div>
              <label htmlFor="waterIntake" className="flex items-center text-sm font-medium text-gray-700">
                <Droplet className="h-5 w-5 mr-2 text-blue-500" />
                Water intake (liters)
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
                placeholder="How much water did you drink?"
              />
            </div>

            <div>
              <label htmlFor="sleepHours" className="flex items-center text-sm font-medium text-gray-700">
                <Moon className="h-5 w-5 mr-2 text-indigo-500" />
                Sleep hours
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
                placeholder="How many hours did you sleep?"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="didWorkout"
                name="didWorkout"
                checked={formData.didWorkout}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="didWorkout" className="ml-2 block text-sm text-gray-700">
                Completed workout/stretch/yoga/Afterburners
              </label>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Submit Daily Log"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
