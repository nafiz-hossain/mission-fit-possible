import { InfoIcon } from "lucide-react"

export function PointSystem() {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex items-center mb-4">
        <InfoIcon className="h-5 w-5 text-purple-600 mr-2" />
        <h2 className="text-lg font-medium text-gray-900">Challenge Point System</h2>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Steps</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Walk/Run over 5,000 steps — 10 points</li>
            <li>Walk/Run over 10,000 steps — 15 points</li>
            <li>Walk/Run over 15,000 steps — 20 points</li>
            <li>Walk/Run over 20,000 steps — 25 points</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Other Activities</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>No added sugar — 4 points</li>
            <li>30-minute activity (workout, stretch, yoga, Afterburners) — 12 points</li>
            <li>Drank minimum 2 liters of water — 5 points</li>
            <li>Slept 6+ hours last night — 8 points</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
