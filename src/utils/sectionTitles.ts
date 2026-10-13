/**
 * Renamed resume section headings, e.g. { leadership: "ADDITIONAL INFORMATION" }.
 *
 * A saved resume can carry them in two places: beside the resume content
 * (`optimizedResume.sectionTitles`, the job record) or inside it
 * (`resumeData.sectionTitles`, the copy the resume service embeds). Every
 * preview and PDF call has to forward them, or the renderer falls back to its
 * default heading. That fallback is what made a client's job card say
 * "LEADERSHIP & VOLUNTEERING" while the admin editor said "ADDITIONAL
 * INFORMATION".
 *
 * Pass candidates in priority order; the first non-empty map wins.
 */

export type SectionTitles = Record<string, string>;

interface TitleBearing {
     sectionTitles?: unknown;
     resumeData?: { sectionTitles?: unknown } | null;
}

const asTitles = (raw: unknown): SectionTitles | null => {
     if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
     const out: SectionTitles = {};
     for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
          if (typeof value === "string" && value.trim()) out[key] = value;
     }
     return Object.keys(out).length ? out : null;
};

export function sectionTitlesOf(...sources: Array<TitleBearing | null | undefined>): SectionTitles {
     for (const source of sources) {
          const found = asTitles(source?.sectionTitles) ?? asTitles(source?.resumeData?.sectionTitles);
          if (found) return found;
     }
     return {};
}
