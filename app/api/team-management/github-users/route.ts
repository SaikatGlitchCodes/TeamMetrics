import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: users, error } = await supabase.from("github_users").select("*").order("github_username")

    if (error) throw error

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching GitHub users:", error)
    return NextResponse.json({ error: "Failed to fetch GitHub users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json()

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Users array is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Upsert users (update if exists, insert if new)
    const { data, error } = await supabase
      .from("github_users")
      .upsert(users, { onConflict: "github_username" })
      .select()

    if (error) throw error

    return NextResponse.json({ users: data })
  } catch (error) {
    console.error("Error upserting GitHub users:", error)
    return NextResponse.json({ error: "Failed to upsert GitHub users" }, { status: 500 })
  }
}
