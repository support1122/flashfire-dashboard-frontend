import React from "react";

/**
 * Turns resume-style **segments** into <strong>; removes leftover ** so they never show as literals.
 */
export function renderBoldMarkers(text: string): React.ReactNode {
    if (text == null || text === "") return text;
    if (!text.includes("**")) return text;

    const re = /\*\*([\s\S]*?)\*\*/g;
    const out: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;

    while ((m = re.exec(text)) !== null) {
        if (m.index > last) {
            const chunk = text.slice(last, m.index).replace(/\*\*/g, "");
            if (chunk) out.push(chunk);
        }
        const inner = (m[1] || "").replace(/\*\*/g, "");
        out.push(
            <strong key={`bm-${k++}`} className="font-semibold text-inherit">
                {inner}
            </strong>
        );
        last = re.lastIndex;
    }

    const tail = text.slice(last).replace(/\*\*/g, "");
    if (tail) out.push(tail);

    if (out.length === 0) return null;
    if (out.length === 1) return out[0];
    return <>{out}</>;
}
