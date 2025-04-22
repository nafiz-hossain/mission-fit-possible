import { NextResponse } from "next/server"

export async function GET() {
  // Check environment variables
  const variables = [
    {
      name: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      status: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "found" : "missing",
    },
    {
      name: "GOOGLE_PRIVATE_KEY",
      status: process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")
          ? "found"
          : "invalid"
        : "missing",
    },
    {
      name: "GOOGLE_CLIENT_ID",
      status: process.env.GOOGLE_CLIENT_ID ? "found" : "missing",
    },
    {
      name: "GOOGLE_CLIENT_SECRET",
      status: process.env.GOOGLE_CLIENT_SECRET ? "found" : "missing",
    },
  ]

  return NextResponse.json({ variables })
}
