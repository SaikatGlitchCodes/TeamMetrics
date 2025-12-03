"use client";

import type React from "react";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Plus, Trash2, RefreshCw } from "lucide-react";
import { BoringAvatar } from "@/components/ui/avatar";

interface Team {
  id: string;
  name: string;
  description: string;
}

interface GitHubUser {
  id: string;
  github_username: string;
  github_id: number;
  display_name: string;
  avatar_url: string;
  bio: string;
  company: string;
  location: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  github_user_id: string;
  github_user: GitHubUser;
}

export function TeamManagementPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [githubUsers, setGithubUsers] = useState<GitHubUser[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>(
    []
  );
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<GitHubUser | null>(null);
  const [githubToken, setGithubToken] = useState("");
  const [githubOrg, setGithubOrg] = useState("Digital");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Load initial data
  useEffect(() => {
    loadTeams();
    loadGithubUsers();
    loadTeamMembers();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadSelectedTeamMembers(selectedTeam);
    } else {
      setSelectedTeamMembers([]);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/team-management/teams");
      const data = await res.json();
      setTeams(data.teams || []);
    } catch (err) {
      setError("Failed to load teams");
    }
  };

  const loadGithubUsers = async () => {
    try {
      const res = await fetch("/api/team-management/github-users");
      const data = await res.json();
      setGithubUsers(data.users || []);
    } catch (err) {
      setError("Failed to load GitHub users");
    }
  };

  const loadTeamMembers = async () => {
    try {
      const res = await fetch(`/api/team-management/team-members`);
      const data = await res.json();
      setTeamMembers(data.team_members || []);
    } catch (err) {
      setError("Failed to load team members");
    }
  };

  const loadSelectedTeamMembers = async (teamId: string) => {
    try {
      const res = await fetch(
        `/api/team-management/team-members?teamId=${teamId}`
      );
      const data = await res.json();
      setSelectedTeamMembers(data.team_members || []);
    } catch (err) {
      setError("Failed to load team members for selected team");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      setError("Team name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/team-management/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTeams([...teams, data.team]);
      setNewTeamName("");
      setNewTeamDescription("");
      setSuccess("Team created successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchGithubUsers = async () => {
    if (!githubToken || !githubOrg) {
      setError("GitHub token and organization name are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/github/fetch-org-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: githubToken,
          org: githubOrg,
        }),
      });

      const data = await res.json();
      console.log('data', data)
      if (!res.ok) throw new Error(data.error);

      // Save users to database
      const saveRes = await fetch("/api/team-management/github-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: data.users }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error);

      setGithubUsers(saveData.users || []);
      setGithubToken("");
      setSuccess(
        `Successfully fetched and saved ${data?.users?.length || 0} GitHub users!`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch GitHub users"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUser) {
      setError("Please select a team and user");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/team-management/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: selectedTeam,
          github_user_id: selectedUser?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeamMembers([...teamMembers, data.team_member]);
      await loadSelectedTeamMembers(selectedTeam);

      setSuccess("User assigned to team successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign user");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (teamMemberId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/team-management/team-members?id=${teamMemberId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to remove user");
      setSelectedTeamMembers(
        selectedTeamMembers.filter((member) => member.id !== teamMemberId)
      );
      await loadTeamMembers();
      setSuccess("User removed from team successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Team Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Create teams and assign GitHub developers
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            <p>{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Team Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
              <CardDescription>
                Add a new team (pharmacy, redbox, grocery, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder="e.g., Pharmacy, RedBox, Grocery"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="team-desc">Description (optional)</Label>
                  <Input
                    id="team-desc"
                    placeholder="Team description"
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Fetch GitHub Users Card */}
          <Card>
            <CardHeader>
              <CardTitle>Fetch GitHub Users</CardTitle>
              <CardDescription>
                Fetch developers from your GitHub organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="github-token">
                    GitHub Personal Access Token
                  </Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="github-org">GitHub Organization</Label>
                  <Input
                    id="github-org"
                    placeholder="Digital"
                    value={githubOrg}
                    onChange={(e) => setGithubOrg(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleFetchGithubUsers}
                  disabled={loading}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Users
                </Button>
                <p className="text-sm text-muted-foreground">
                  Click once and wait. Cached until you click again.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assign Users to Team */}
        <Card>
          <CardHeader>
            <CardTitle>Assign Developers to Teams</CardTitle>
            <CardDescription>
              Select a team and assign GitHub developers to it
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Team Selection */}
              <div>
                <Label htmlFor="team-select">Select Team</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger id="team-select">
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User Selection and Assignment */}
              {selectedTeam && (
                <>
                  <div>
                    <Label htmlFor="user-select">Select Developer</Label>
                    <div className="flex gap-2">
                      <Select
                        value={selectedUser?.id}
                        onValueChange={(value) =>
                          setSelectedUser(
                            githubUsers.find((user) => user.id === value) ||
                              null
                          )
                        }
                      >
                        <SelectTrigger id="user-select" className="flex-1">
                          <SelectValue placeholder="Choose a developer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {githubUsers
                            .filter(
                              (user) =>
                                !teamMembers.some(
                                  (tm) => tm.github_user_id === user.id
                                )
                            )
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.display_name} (@{user.github_username})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={handleAssignUser}
                        disabled={loading || !selectedUser}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div className="mt-6">
                    <h3 className="font-semibold text-foreground mb-3">
                      Team Members ({selectedTeamMembers.length})
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTeamMembers.length > 0 ? (
                        selectedTeamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-muted rounded"
                          >
                            <div className="flex items-center gap-3">
                              {member?.github_user?.avatar_url && (
                                <BoringAvatar
                                  name={member.github_user?.github_username || ""}
                                  size={32}
                                  variant="beam"
                                  className="w-8 h-8"
                                />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {member?.github_user?.display_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{member?.github_user?.github_username}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleRemoveUser(member.id)}
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No developers assigned to this team yet
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Teams Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Teams Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teams.map((team) => {
                const memberCount = teamMembers.filter(
                  (tm) => tm.team_id === team.id
                ).length;
                return (
                  <div
                    key={team.id}
                    className="flex items-center justify-between p-3 bg-muted rounded"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      {team.description && (
                        <p className="text-sm text-muted-foreground">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full">
                      {memberCount} members
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
