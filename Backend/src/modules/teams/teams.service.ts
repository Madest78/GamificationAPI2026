import { prisma } from '@/shared/prisma.js';

interface EmplannerTeamsJson {
    member?: { id?: string; name?: string }[];
    leader?: { id?: string; name?: string }[];
}

export interface TeamMemberDto {
    id: string;
    name: string;
    avatarUrl: string | null;
    isLeader: boolean;
}

export interface TeamDirectoryEntry {
    name: string;
    leaders: TeamMemberDto[];
    members: TeamMemberDto[];
}

export class TeamsService {
    async getDirectory(): Promise<TeamDirectoryEntry[]> {
        const users = await prisma.user.findMany({
            where: { emplannerFired: false },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                emplannerTeams: true,
            },
        });

        const teams = new Map<string, TeamDirectoryEntry>();

        for (const user of users) {
            const displayName = user.name || user.email;
            const member = {
                id: user.id,
                name: displayName,
                avatarUrl: user.avatarUrl,
                isLeader: false,
            };

            const teamsJson = (user.emplannerTeams ?? null) as EmplannerTeamsJson | null;
            if (!teamsJson) continue;

            const leaderTeamNames = new Set<string>();
            for (const team of teamsJson.leader || []) {
                if (!team?.name) continue;
                leaderTeamNames.add(team.name);
                let entry = teams.get(team.name);
                if (!entry) {
                    entry = { name: team.name, leaders: [], members: [] };
                    teams.set(team.name, entry);
                }
                entry.leaders.push({ ...member, isLeader: true });
            }

            for (const team of teamsJson.member || []) {
                if (!team?.name || leaderTeamNames.has(team.name)) continue;
                let entry = teams.get(team.name);
                if (!entry) {
                    entry = { name: team.name, leaders: [], members: [] };
                    teams.set(team.name, entry);
                }
                entry.members.push(member);
            }
        }

        return Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
}
