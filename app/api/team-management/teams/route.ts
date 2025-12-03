import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: teams, error } = await supabase.from("teams").select("*").order("name")

    if (error) throw error

    return NextResponse.json({ teams })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: team, error } = await supabase.from("teams").insert([{ name, description }]).select().single()

    if (error) throw error

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 })
  }
}
