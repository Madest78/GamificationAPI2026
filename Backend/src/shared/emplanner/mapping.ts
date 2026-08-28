import { EmplannerUser } from './adapter.js';

interface TeamInfo {
    id: string;
    name: string;
}

// Team name → Specialization mapping
// 1. Pattern matching by first character
// 2. Exact name matching for special teams
function teamNameToSpecialization(teamName: string): string | null {
    const name = teamName.trim();

    // Pattern matching by first digit
    const firstDigit = name.charAt(0);
    if (firstDigit === '1') return 'FP';
    if (firstDigit === '2') return 'ESX';
    if (firstDigit === '3') return 'MULTI';

    // Exact matching for special teams
    const specialTeams: Record<string, string> = {
        '90-225 FF Team': 'FF',
        '90-210 Out ESX': 'EXTERIOR',
        '95-230 SYM RU': 'SYMBILITY',
        '95-229 SYM ENG': 'SYMBILITY',
        '95-231 SYM VN': 'SYMBILITY',
        '95-200 FP SuperV': 'SUPER_V',
        '95-191 ESX SuperV': 'SUPER_V',
    };

    return specialTeams[name] ?? null;
}

export interface MappingResult {
    specializations: string[];   // e.g. ['FP', 'FF']
    roles: string[];             // e.g. ['DRAFTER', 'TEAMLEAD']
}

/**
 * Maps Emplanner teams to our roles and specializations.
 *
 * Logic:
 * - If user is in leaderTeams of any profile spec team → DRAFTER + TEAMLEAD
 * - If user is in memberTeams of any profile spec team → DRAFTER
 * - If user is not in any profile spec team → MEMBER
 * - Specializations are derived from team names
 */
export function mapEmplannerTeamsToRoles(
    memberTeams: TeamInfo[],
    leaderTeams: TeamInfo[],
): MappingResult {
    const specializationSet = new Set<string>();
    let isTeamLead = false;
    let isInTeam = false;

    // Check member teams
    for (const team of memberTeams) {
        const spec = teamNameToSpecialization(team.name);
        if (spec) {
            specializationSet.add(spec);
            isInTeam = true;
        }
    }

    // Check leader teams
    for (const team of leaderTeams) {
        const spec = teamNameToSpecialization(team.name);
        if (spec) {
            specializationSet.add(spec);
            isInTeam = true;
            isTeamLead = true;
        }
    }

    const roles = isTeamLead ? ['DRAFTER', 'TEAMLEAD'] : isInTeam ? ['DRAFTER'] : ['MEMBER'];

    return {
        specializations: Array.from(specializationSet),
        roles,
    };
}
