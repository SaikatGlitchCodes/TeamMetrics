'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Octokit } from '@octokit/rest';

const GithubContext = createContext(null);

export const GithubProvider = ({ children, token }) => {
    const [teamMetrics, setTeamMetrics] = useState([]);
    const [teamMembersName, setTeamMembersName] = useState([]);
    const [allPRs, setAllPRs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const baseUrl = "https://github.hy-vee.cloud/api/v3";

    useEffect(() => {
        if (teamMembersName.length > 0 && token) {
            setLoading(true);
            setError(null);
            setTeamMetrics([]); // Reset metrics before fetching new ones
            fetchTeamMetrics().catch((err) => {
                console.error('Error fetching team metrics:', err);
                setError(err.message || 'Failed to fetch team metrics');
            }).finally(() => setLoading(false));
        }
    }, [teamMembersName, token]);

    const fetchAllUserName = useCallback(async (teamId) => {
        try {
            console.log('Fetching team members for teamId:', teamId);
            const res = await fetch(`/api/team-management/team-members?teamId=${teamId}`);

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`API error: ${res.status} ${res.statusText}`, errorText);
                throw new Error(`Failed to fetch team members: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            console.log('API response data:', JSON.stringify(data, null, 2));
            
            if (!data.team_members) {
                console.warn('No team_members found in response');
                setTeamMembersName([]);
                return;
            }

            if (data.team_members.length === 0) {
                console.warn('team_members array is empty - no members assigned to this team');
                setTeamMembersName([]);
                return;
            }

            console.log('Team members data:', data.team_members);
            
            const usernames = data.team_members
                .map(member => {
                    console.log('Processing member:', member);
                    console.log('Member github_user:', member.github_user);
                    
                    if (!member.github_user) {
                        console.warn('Member missing github_user:', member);
                        return null;
                    }
                    
                    if (!member.github_user.github_username) {
                        console.warn('Member github_user missing github_username:', member.github_user);
                        return null;
                    }
                    
                    return member.github_user.github_username;
                })
                .filter(username => username); // Filter out null/undefined usernames

            console.log('Extracted usernames:', usernames);
            setTeamMembersName(usernames);
        } catch (error) {
            console.error('Error in fetchAllUserName:', error);
            setError(error.message);
            setTeamMembersName([]);
        }
    }, []);

    const fetchTeamMetrics = useCallback(async (timeLine = 3) => {
        if (!token || teamMembersName.length === 0) {
            return;
        }

        const newMetrics = [];
        const newPRs = [];

        for (const member of teamMembersName) {
            try {
                // Fetch and process metrics for each member
                const octokit = new Octokit({
                    auth: token,
                    baseUrl: baseUrl,
                });
                let repos = [];
                let page = 1;

                while (true) {
                    const res = await octokit.search.issuesAndPullRequests({
                        q: `author:${member} is:pr created:>=${new Date(new Date().setMonth(new Date().getMonth() - timeLine))
                            .toISOString()
                            .split("T")[0]
                            }`,
                        per_page: 100,
                        page,
                    });

                    repos = repos.concat(res.data.items);
                    
                    if (res.data.items.length < 100) {
                        break;
                    }
                    page++;
                }

                console.log(member, repos);

                const mergedPRs = repos.filter((pr) => pr.pull_request?.merged_at).length;
                console.log("mergedPRs", mergedPRs);

                const mergeRate = repos.length ? Math.round((mergedPRs / repos.length) * 100) : 0;
                console.log("mergeRate", mergeRate);

                const { 
                    averageComments, 
                    issueComments, 
                    reviewComments,
                    teamIssueComments,
                    teamReviewComments,
                    otherIssueComments,
                    otherReviewComments,
                    teamCommentsCount,
                    otherCommentsCount
                } = await fetchAllComments(repos);
                console.log("averageComments", averageComments, "teamCommentsCount", teamCommentsCount, "otherCommentsCount", otherCommentsCount);

                newMetrics.push({ 
                    member, 
                    prCount: repos.length, 
                    mergedPRs, 
                    mergeRate, 
                    repos, 
                    averageComments, 
                    issueComments, 
                    reviewComments,
                    teamIssueComments,
                    teamReviewComments,
                    otherIssueComments,
                    otherReviewComments,
                    teamCommentsCount,
                    otherCommentsCount
                });

                newPRs.push(...repos);
            } catch (error) {
                console.error(`Error fetching metrics for ${member}:`, error);
                // Continue with other members even if one fails
            }
        }

        // Set all metrics at once after processing all members
        setTeamMetrics(newMetrics);
        setAllPRs(newPRs);
        return { newMetrics, newPRs };
    }, [teamMembersName, token, baseUrl]);

    const fetchAllComments = useCallback(async (repos) => {
        // fetch listComments and listReviewComments for all PRs in allPrs
        if (!token || repos.length === 0) {
            return { 
                averageComments: 0, 
                issueComments: [], 
                reviewComments: [],
                teamIssueComments: [],
                teamReviewComments: [],
                otherIssueComments: [],
                otherReviewComments: [],
                teamCommentsCount: 0,
                otherCommentsCount: 0
            };
        }
        const octokit = new Octokit({
            auth: token,
            baseUrl: baseUrl,
        });

        let totalComments = 0;
        let allIssueComments = [];
        let allReviewComments = [];

        for (const pr of repos) {
            try {
                const htmlUrl = pr.html_url || "";
                const repoMatch = htmlUrl.match(
                    /github\.hy-vee\.cloud\/([^\/]+\/[^\/]+)\/pull\//
                );
                const fullRepoName = repoMatch ? repoMatch[1] : "Unknown Repository";
                const [owner, repo] = fullRepoName.split("/");

                if (!owner || !repo) {
                    console.warn(`Could not parse repository from URL: ${htmlUrl}`);
                    continue;
                }

                // Fetch all issue comments with pagination
                let issueCommentsData = [];
                let issueCommentsPage = 1;
                while (true) {
                    const issueCommentsRes = await octokit.rest.issues.listComments({
                        owner: owner,
                        repo: repo,
                        issue_number: pr.number,
                        per_page: 100,
                        page: issueCommentsPage,
                    });
                    issueCommentsData.push(...issueCommentsRes.data);
                    if (issueCommentsRes.data.length < 100) {
                        break;
                    }
                    issueCommentsPage++;
                }

                // Fetch all review comments with pagination
                let reviewCommentsData = [];
                let reviewCommentsPage = 1;
                while (true) {
                    const reviewCommentsRes = await octokit.rest.pulls.listReviewComments({
                        owner: owner,
                        repo: repo,
                        pull_number: pr.number,
                        per_page: 100,
                        page: reviewCommentsPage,
                    });
                    reviewCommentsData.push(...reviewCommentsRes.data);
                    if (reviewCommentsRes.data.length < 100) {
                        break;
                    }
                    reviewCommentsPage++;
                }

                console.log(`PR #${pr.number}: ${issueCommentsData.length} issue comments, ${reviewCommentsData.length} review comments`);
                totalComments += issueCommentsData.length + reviewCommentsData.length;
                allIssueComments.push(...issueCommentsData);
                allReviewComments.push(...reviewCommentsData);
            } catch (error) {
                console.error(`Error fetching comments for PR #${pr.number}:`, error);
            }
        }

        // Separate comments by team members vs others
        const teamIssueComments = allIssueComments.filter(comment => 
            teamMembersName.includes(comment.user.login)
        );
        const otherIssueComments = allIssueComments.filter(comment => 
            !teamMembersName.includes(comment.user.login)
        );
        
        const teamReviewComments = allReviewComments.filter(comment => 
            teamMembersName.includes(comment.user.login)
        );
        const otherReviewComments = allReviewComments.filter(comment => 
            !teamMembersName.includes(comment.user.login)
        );

        const teamCommentsCount = teamIssueComments.length + teamReviewComments.length;
        const otherCommentsCount = otherIssueComments.length + otherReviewComments.length;

        const averageComments = repos.length ? Math.round(totalComments / repos.length) : 0;
        
        return { 
            averageComments, 
            issueComments: allIssueComments, 
            reviewComments: allReviewComments,
            teamIssueComments,
            teamReviewComments,
            otherIssueComments,
            otherReviewComments,
            teamCommentsCount,
            otherCommentsCount
        };
    }, [token, baseUrl, teamMembersName]);

    const fetchQuarterlyMetrics = useCallback(async (quarters = 4) => {
        if (!token || teamMembersName.length === 0) {
            return [];
        }

        const quarterlyData = [];
        const currentDate = new Date();
        
        for (let i = 0; i < quarters; i++) {
            // Calculate quarter dates
            const quarterEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (i * 3), 0);
            const quarterStartDate = new Date(quarterEndDate.getFullYear(), quarterEndDate.getMonth() - 2, 1);

            

            const quarterLabel = `${quarterStartDate.getFullYear()}-Q${Math.floor(quarterStartDate.getMonth() / 3) + 1}`;

            console.log(`Fetching data for ${quarterStartDate.toISOString().split("T")[0]} to ${quarterEndDate.toISOString().split("T")[0]}`, quarterLabel);
            
            try {
                const quarterMetrics = await fetchTeamMetricsForPeriod(quarterStartDate, quarterEndDate);
                
                const totalPRs = quarterMetrics.reduce((sum, tm) => sum + (tm ? tm.prCount : 0), 0);
                const totalTeamComments = quarterMetrics.reduce((sum, tm) => sum + (tm ? tm.teamCommentsCount : 0), 0);
                const totalExternalComments = quarterMetrics.reduce((sum, tm) => sum + (tm ? tm.otherCommentsCount : 0), 0);
                const totalComments = totalTeamComments + totalExternalComments;
                
                quarterlyData.push({
                    quarter: quarterLabel,
                    totalPRs,
                    totalComments,
                    teamMemberComments: totalTeamComments,
                    externalComments: totalExternalComments,
                    teamMemberPercent: totalComments > 0 ? Math.round((totalTeamComments / totalComments) * 100) : 0,
                    externalPercent: totalComments > 0 ? Math.round((totalExternalComments / totalComments) * 100) : 0,
                    startDate: quarterStartDate,
                    endDate: quarterEndDate,
                    metrics: quarterMetrics
                });
            } catch (error) {
                console.error(`Error fetching quarterly data for ${quarterLabel}:`, error);
                // Add empty quarter data to maintain structure
                quarterlyData.push({
                    quarter: quarterLabel,
                    totalPRs: 0,
                    totalComments: 0,
                    teamMemberComments: 0,
                    externalComments: 0,
                    teamMemberPercent: 0,
                    externalPercent: 0,
                    startDate: quarterStartDate,
                    endDate: quarterEndDate,
                    metrics: []
                });
            }
        }
        
        return quarterlyData.reverse(); // Return in chronological order
    }, [teamMembersName, token]);

    const fetchTeamMetricsForPeriod = useCallback(async (startDate, endDate) => {
        if (!token || teamMembersName.length === 0) {
            return [];
        }

        const periodMetrics = [];

        for (const member of teamMembersName) {
            try {
                const octokit = new Octokit({
                    auth: token,
                    baseUrl: baseUrl,
                });
                
                let repos = [];
                let page = 1;

                while (true) {
                    const res = await octokit.search.issuesAndPullRequests({
                        q: `author:${member} is:pr created:${startDate.toISOString().split("T")[0]}..${endDate.toISOString().split("T")[0]}`,
                        per_page: 100,
                        page,
                    });

                    repos = repos.concat(res.data.items);

                    if (res.data.items.length < 100) {
                        break;
                    }
                    page++;
                }

                const mergedPRs = repos.filter((pr) => pr.pull_request?.merged_at).length;
                const mergeRate = repos.length ? Math.round((mergedPRs / repos.length) * 100) : 0;

                const { 
                    averageComments, 
                    issueComments, 
                    reviewComments,
                    teamIssueComments,
                    teamReviewComments,
                    otherIssueComments,
                    otherReviewComments,
                    teamCommentsCount,
                    otherCommentsCount
                } = await fetchAllComments(repos);

                periodMetrics.push({ 
                    member, 
                    prCount: repos.length, 
                    mergedPRs, 
                    mergeRate, 
                    repos, 
                    averageComments, 
                    issueComments, 
                    reviewComments,
                    teamIssueComments,
                    teamReviewComments,
                    otherIssueComments,
                    otherReviewComments,
                    teamCommentsCount,
                    otherCommentsCount,
                    period: { startDate, endDate }
                });
            } catch (error) {
                console.error(`Error fetching period metrics for ${member}:`, error);
            }
        }

        return periodMetrics;
    }, [teamMembersName, token, baseUrl, fetchAllComments]);

    const value = {
        teamMembersName,
        teamMetrics,
        allPRs,
        loading,
        error,

        fetchAllUserName,
        fetchTeamMetrics,
        fetchQuarterlyMetrics,
    };

    return (
        <GithubContext.Provider value={value}>
            {children}
        </GithubContext.Provider>
    );
};
export const useGithub = () => {
    const context = useContext(GithubContext);
    if (!context) {
        throw new Error('useGithub must be used within a GithubProvider');
    }
    return {
        ...context,
    };
};


