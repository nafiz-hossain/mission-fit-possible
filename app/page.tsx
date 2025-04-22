"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function Home() {
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Fetch actual participant count from Firebase
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true)
        const usersRef = collection(db, "users")
        const snapshot = await getDocs(usersRef)
        setParticipantCount(snapshot.size)
      } catch (error) {
        console.error("Error fetching participants:", error)
        // Fallback to a default value if there's an error
        setParticipantCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchParticipants()
  }, [])

  return (
    <div className="bg-gradient-to-b from-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
            Mission: Fit Possible <span className="text-purple-600">💪</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
            Join our 30-day fitness challenge and transform your health habits with your team. Track daily activities,
            compete on the leaderboard, and achieve your fitness goals together.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Join Challenge <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
          <div className="mt-8 inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <span className="mr-2 text-lg">🏃</span>
            <span>
              {loading
                ? "Loading participants..."
                : `${participantCount} participant${participantCount !== 1 ? "s" : ""} and counting!`}
            </span>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <span className="text-3xl">📊</span>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Track Daily Progress</h3>
              <p className="mt-3 text-base text-gray-500">
                Log your steps, water intake, sleep, and more to build healthy habits.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <span className="text-3xl">🏆</span>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Compete with Friends</h3>
              <p className="mt-3 text-base text-gray-500">
                See where you stand on the leaderboard and motivate each other.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <span className="text-3xl">🎯</span>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Achieve Your Goals</h3>
              <p className="mt-3 text-base text-gray-500">
                Set personal fitness goals and track your progress over 30 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
