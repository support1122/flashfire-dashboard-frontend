import type { CSSProperties } from "react";

// Browsers only offer to save/autofill a credential when the form contains an
// <input type="password">. For internal @flashfirehq accounts we render the
// field as type="text" masked with -webkit-text-security instead, so Google
// Password Manager never sees anything to store. Client accounts keep the
// normal save/autofill behavior.

export const isInternalEmail = (email: string): boolean =>
    email.trim().toLowerCase().includes("@flashfirehq");

// True while the typed email could still turn out to be an internal
// @flashfirehq address: empty, no domain yet, or a domain that is a prefix of
// "flashfirehq". Used as the default state of login password fields so the
// browser never sees a real password input during an internal login — not
// even on page load, before anything is typed. The field flips to a real
// type="password" only once the domain is clearly external (e.g. "gmail.com"),
// which re-enables normal save/autofill for clients.
export const shouldHidePasswordFromManager = (email: string): boolean => {
    const normalized = email.trim().toLowerCase();
    const atIndex = normalized.indexOf("@");
    if (atIndex === -1) return true;
    const domain = normalized.slice(atIndex + 1);
    return "flashfirehq".startsWith(domain) || domain.includes("flashfirehq");
};

const maskSupported =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("-webkit-text-security", "disc");

export function guardedPasswordInputProps(
    hideFromManager: boolean,
    showPlainText: boolean,
    autoCompleteWhenAllowed: string = "current-password",
): { type: "text" | "password"; autoComplete: string; style?: CSSProperties } {
    if (!hideFromManager) {
        return {
            type: showPlainText ? "text" : "password",
            autoComplete: autoCompleteWhenAllowed,
        };
    }
    if (showPlainText) {
        return { type: "text", autoComplete: "off" };
    }
    if (maskSupported) {
        return {
            type: "text",
            autoComplete: "off",
            style: { WebkitTextSecurity: "disc" } as CSSProperties,
        };
    }
    // No CSS masking available (old Firefox): keep the field truly masked with
    // type="password"; autocomplete="off" is only best-effort there.
    return { type: "password", autoComplete: "off" };
}
