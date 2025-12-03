import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get("teamId")
    const supabase = await createClient()

    let query = supabase.from("team_members").select(
      `
        *,
        team:teams(*),
        github_user:github_users(*)
      `,
    )

    if (teamId) {
      query = query.eq("team_id", teamId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ team_members: data })
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { team_id, github_user_id } = await request.json()

    if (!team_id || !github_user_id) {
      return NextResponse.json({ error: "team_id and github_user_id are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.from("team_members").insert([{ team_id, github_user_id }]).select()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "User is already assigned to this team" }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ team_member: data })
  } catch (error) {
    console.error("Error assigning team member:", error)
    return NextResponse.json({ error: "Failed to assign team member" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get("id")

    if (!teamMemberId) {
      return NextResponse.json({ error: "Team member ID is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from("team_members").delete().eq("id", teamMemberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 })
  }
}
