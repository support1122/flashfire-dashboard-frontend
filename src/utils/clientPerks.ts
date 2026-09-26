/**
 * Whether this client still has the Upgrade and Refer n Earn perks.
 *
 * The decision is made on the server and arrives on the session as
 * `perksDisabled`: the flag is written by DASH/clients-tracking once a client
 * goes inactive AND has had no job card added or applied for 14 days, and it is
 * never cleared automatically. This module only reads it, so the sidebar, the
 * mobile bar and the tab router cannot end up disagreeing about who is allowed
 * what.
 *
 * DEFAULTS TO ENABLED. An older session in localStorage has no `perksDisabled`
 * key at all, and a backend that has not been deployed yet will not send one.
 * Treating a missing flag as "disabled" would strip the buttons from every
 * paying client the moment this shipped, so absence means enabled and only an
 * explicit true takes them away.
 *
 * This is presentation, not security. It removes the buttons from the nav and
 * turns away the two tabs; it is not what stops a determined client from
 * reaching a payment page, and it was never meant to be.
 */

/** The only part of the session this module cares about. */
export interface PerkBearingUser {
     perksDisabled?: boolean;
}

/** @param userDetails the object held in UserContext / localStorage userAuth */
export function arePerksDisabled(userDetails: PerkBearingUser | null | undefined): boolean {
     return userDetails?.perksDisabled === true;
}
