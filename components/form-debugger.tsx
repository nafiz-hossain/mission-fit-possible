"use client"

import { useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp } from "lucide-react"

interface FormDebuggerProps {
  formData: any
  formState: {
    isSubmitting: boolean
    error: string | null
  }
  environmentVariables: {
    name: string
    status: "found" | "missing" | "invalid"
  }[]
}

export function FormDebugger({ formData, formState, environmentVariables }: FormDebuggerProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-md mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
        type="button"
      >
        <span className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
          Form Debugger
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-gray-300 text-xs">
          <div className="mb-4">
            <h3 className="font-bold mb-2 text-gray-700">Form State:</h3>
            <div className="bg-white p-2 rounded border border-gray-300 overflow-x-auto">
              <pre>isSubmitting: {formState.isSubmitting.toString()}</pre>
              <pre>error: {formState.error || "null"}</pre>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold mb-2 text-gray-700">Form Data:</h3>
            <div className="bg-white p-2 rounded border border-gray-300 overflow-x-auto">
              <pre>{JSON.stringify(formData, null, 2)}</pre>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-2 text-gray-700">Environment Variables:</h3>
            <div className="bg-white p-2 rounded border border-gray-300">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="pr-4 py-1">Variable</th>
                    <th className="py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {environmentVariables.map((variable) => (
                    <tr key={variable.name}>
                      <td className="pr-4 py-1">{variable.name}</td>
                      <td className="py-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            variable.status === "found"
                              ? "bg-green-100 text-green-800"
                              : variable.status === "missing"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {variable.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-gray-600">
            <p>
              <strong>Troubleshooting Tips:</strong>
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>Check that all required environment variables are set</li>
              <li>Verify that your Google service account has access to the spreadsheet</li>
              <li>Make sure your private key is properly formatted with newlines</li>
              <li>Check the browser console and server logs for detailed error messages</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
