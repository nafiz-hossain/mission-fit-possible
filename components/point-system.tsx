import { InfoIcon } from "lucide-react"

export function PointSystem() {
  return (
    <div className="rounded-2xl p-6 md:p-8 shadow-md bg-gradient-to-br from-purple-50 via-white to-white border border-purple-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-full">
          <InfoIcon className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Challenge Point System</h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">Steps</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Walk/Run over 5,000 steps — <span className="font-medium text-gray-900">10 points</span></li>
            <li>Walk/Run over 10,000 steps — <span className="font-medium text-gray-900">15 points</span></li>
            <li>Walk/Run over 15,000 steps — <span className="font-medium text-gray-900">20 points</span></li>
            <li>Walk/Run over 20,000 steps — <span className="font-medium text-gray-900">25 points</span></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-2">Other Activities</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>No added sugar — <span className="font-medium text-gray-900">4 points</span></li>
            <li>30-minute activity (workout, stretch, yoga, Afterburners) — <span className="font-medium text-gray-900">12 points</span></li>
            <li>Drank minimum 2 liters of water — <span className="font-medium text-gray-900">5 points</span></li>
            <li>Slept 6+ hours last night — <span className="font-medium text-gray-900">8 points</span></li>
          </ul>
        </div>
      </div>
    </div>
  )
}