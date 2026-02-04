import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token, org } = await request.json();

    if (!token || !org) {
      return NextResponse.json(
        { error: "Token and organization are required" },
        { status: 400 }
      );
    }

    /* -------------------------------
       1. Fetch ALL org members (pagination)
    -------------------------------- */
    const allMembers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://github.hy-vee.cloud/api/v3/orgs/${org}/members?per_page=100&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || "Failed to fetch organization members" },
          { status: response.status }
        );
      }

      const members = await response.json();
      allMembers.push(...members);

      // stop when less than per_page
      hasMore = members.length === 100;
      page++;
    }

    /* --------------------------------
       2. Fetch detailed user info
    --------------------------------- */
    const usersPromises = allMembers.map(async (member: any) => {
      const userResponse = await fetch(member.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!userResponse.ok) return null;

      const userData = await userResponse.json();

      return {
        github_username: userData.login,
        github_id: userData.id,
        display_name: userData.name || userData.login,
        avatar_url: userData.avatar_url,
        bio: userData.bio || "",
        company: userData.company || "",
        location: userData.location || "",
      };
    });

    const users = (await Promise.all(usersPromises)).filter(Boolean);

    return NextResponse.json(
      { users, total: users.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching GitHub users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
