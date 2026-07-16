import type { CSSProperties } from "react";

// Browsers only offer to save/autofill a credential when the form contains an
// <input type="password">. For internal @flashfirehq accounts we render the
// field as type="text" masked with -webkit-text-security instead, so Google
// Password Manager never sees anything to store. Client accounts keep the
// normal save/autofill behavior.

export const isInternalEmail = (email: string): boolean =>
    email.trim().toLowerCase().includes("@flashfirehq");

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
