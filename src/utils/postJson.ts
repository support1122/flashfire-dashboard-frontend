export interface PostJsonResult<T> {
    ok: boolean
    status: number
    data: T | null
}

// Auth calls go through Cloudflare + Render; a deploy or a brief origin hiccup
// returns a 502/524 HTML page, and flaky client networks make fetch itself
// throw. Both used to surface instantly as "Network error" toasts. Retry a
// couple of times with backoff so one-second blips never fail a login, and
// parse JSON defensively so an HTML error page can't crash the flow.
export async function postJsonWithRetry<T = unknown>(
    url: string,
    body: unknown,
    retries = 2,
): Promise<PostJsonResult<T>> {
    let lastError: unknown = null
    for (let attempt = 0; attempt <= retries; attempt++) {
        if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
        }
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            if (res.status >= 500 && attempt < retries) {
                continue
            }
            let data: T | null = null
            try {
                data = (await res.json()) as T
            } catch {
                if (attempt < retries) {
                    continue
                }
            }
            return { ok: res.ok, status: res.status, data }
        } catch (err) {
            lastError = err
        }
    }
    throw lastError instanceof Error ? lastError : new Error("Network request failed")
}
