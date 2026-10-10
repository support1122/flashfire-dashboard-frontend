import { isOpsRole } from "../state_management/Operations";

/**
 * Who sees the operator tools: the Mail tab, the Operations tab and the
 * "Connect Gmail" button on the profile.
 *
 * Operators always do. A small set of client accounts do as well: the server
 * decides which (Utils/opsToolsAccess.js in the dashboard backend) and marks
 * the session with `opsTools: true`.
 *
 * Those clients stay clients. Their role is untouched, so they keep Logout
 * rather than "Switch Client", and every tool works on their own email. They
 * also skip the operations secret key, because the server has already vouched
 * for them; that is the whole point of the list.
 *
 * Absence means no. Only an explicit true from the server grants anything.
 */

/** The only part of the session this module cares about. */
export interface OpsToolsBearingUser {
     opsTools?: boolean;
}

/** A client account the server has granted the operator tools. */
export function isOpsToolsClient(userDetails: OpsToolsBearingUser | null | undefined): boolean {
     return userDetails?.opsTools === true;
}

/** Operators, plus granted clients. */
export function canUseOpsTools(
     role: string | undefined | null,
     userDetails: OpsToolsBearingUser | null | undefined
): boolean {
     return isOpsRole(role) || isOpsToolsClient(userDetails);
}
