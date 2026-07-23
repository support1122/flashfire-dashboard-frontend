const WEBHOOK_URL = import.meta.env.VITE_DISCORD_NETWORK_ERROR_WEBHOOK_URL

let lastReportAt = 0

// Fire-and-forget Discord alert when a client hits a network-level failure.
// Discord is a different host than the API, so this usually still delivers
// when the backend is unreachable — and "Browser online: yes" tells us the
// problem was on our side, not the client's connection. Throttled so a retry
// loop can't flood the channel; never throws back into the calling flow.
export function reportNetworkError(
    context: string,
    clientEmail: string,
    error: unknown,
    endpoint?: string,
): void {
    if (!WEBHOOK_URL) return
    const now = Date.now()
    if (now - lastReportAt < 20000) return
    lastReportAt = now

    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    const payload = {
        embeds: [
            {
                title: "Client Network Error",
                color: 0xdc2626,
                fields: [
                    { name: "Where", value: context, inline: true },
                    { name: "Client", value: clientEmail || "unknown", inline: true },
                    {
                        name: "Browser online",
                        value: typeof navigator !== "undefined" && navigator.onLine ? "yes" : "no",
                        inline: true,
                    },
                    { name: "Error", value: message.slice(0, 1000) || "unknown", inline: false },
                    ...(endpoint ? [{ name: "Endpoint", value: endpoint, inline: false }] : []),
                    {
                        name: "User agent",
                        value: (typeof navigator !== "undefined" ? navigator.userAgent : "unknown").slice(0, 300),
                        inline: false,
                    },
                ],
                timestamp: new Date().toISOString(),
            },
        ],
    }

    fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    }).catch(() => {
        // Reporting must never surface its own failures.
    })
}
