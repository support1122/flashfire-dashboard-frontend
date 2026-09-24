/**
 * How long a medical resume PDF may be, and who is allowed to download one that
 * misses the mark.
 *
 * WHY THIS EXISTS
 * ---------------
 * A medical resume is a two-page deliverable. Three-page PDFs were reaching
 * clients and interns anyway, from two different directions:
 *
 *   - the dashboard's Select PDF Scale modal warned "Resume currently spans 3
 *     pages" and left the green Download PDF button fully enabled, because the
 *     page-count gate read `isOperator && ...` and a client is not an operator.
 *     The warning was advice nobody had to take.
 *
 *   - the resume maker never counted pages at all. Its modal painted every
 *     count above 1 as "Ready to download!", and its blue toolbar Download PDF
 *     button generated and saved a PDF without opening the modal at all.
 *
 * ASYMMETRIC ON PURPOSE
 * ---------------------
 * Too MANY pages blocks everyone. Anyone looking at the modal can drag the
 * scale slider down until the preview fits, so the rule is always satisfiable
 * and nobody needs an escape hatch.
 *
 * Too FEW pages is a quality gate, enforced only where `enforceMinimum` is set
 * (operators on the dashboard). An operator can edit the content until it fills
 * two pages; a client cannot. Applying the minimum to a client would leave the
 * Download button permanently dead on a resume they are not allowed to rewrite.
 *
 * AN UNKNOWN PAGE COUNT FAILS OPEN
 * --------------------------------
 * pageCount is null when pdf.js could not parse the PDF - its worker is fetched
 * from a CDN, so that is a real failure mode and not a hypothetical one. A parse
 * failure must not take the Download button away from everybody, so the count is
 * treated as advisory when it is missing. Every path that can produce a count
 * therefore counts the real bytes rather than trusting a cached number.
 */

/** A medical resume is exactly this many pages. */
export const REQUIRED_MEDICAL_PDF_PAGES = 2;

export type MedicalGateReason = "too-many" | "too-few";

export interface MedicalDownloadGate {
     /** True when this PDF must not be saved. */
     blocked: boolean;
     reason: MedicalGateReason | null;
     /** Replacement for the "Download PDF" button label, or null to keep it. */
     label: string | null;
     /** One sentence saying what to do about it, for a toast or warning panel. */
     message: string | null;
}

const OPEN: MedicalDownloadGate = { blocked: false, reason: null, label: null, message: null };

/**
 * Decide whether a medical resume PDF of `pageCount` pages may be downloaded.
 *
 * Pure: no DOM, no storage, no network. Every caller - button state, button
 * label, warning panel, and the guard inside the download handler - derives from
 * this one function so they cannot disagree with each other.
 *
 * @param pageCount           pages in the PDF, or null/undefined if unknown
 * @param opts.enforceMinimum also block PDFs SHORTER than the required length
 */
export function medicalDownloadGate(
     pageCount: number | null | undefined,
     opts: { enforceMinimum?: boolean } = {}
): MedicalDownloadGate {
     if (typeof pageCount !== "number" || !Number.isFinite(pageCount)) return OPEN;

     if (pageCount > REQUIRED_MEDICAL_PDF_PAGES) {
          return {
               blocked: true,
               reason: "too-many",
               label: `Please scale down to ${REQUIRED_MEDICAL_PDF_PAGES} pages`,
               message:
                    `A medical resume must fit in ${REQUIRED_MEDICAL_PDF_PAGES} pages. ` +
                    `This one spans ${pageCount}. Reduce the scale until the preview shows ` +
                    `${REQUIRED_MEDICAL_PDF_PAGES} pages, then download.`,
          };
     }

     if (opts.enforceMinimum && pageCount < REQUIRED_MEDICAL_PDF_PAGES) {
          return {
               blocked: true,
               reason: "too-few",
               label: `Showing ${pageCount} page${pageCount === 1 ? "" : "s"} - increase scale`,
               message:
                    `A medical resume should fill ${REQUIRED_MEDICAL_PDF_PAGES} pages. ` +
                    `Increase the scale until the preview reaches ${REQUIRED_MEDICAL_PDF_PAGES} pages.`,
          };
     }

     return OPEN;
}

/** Minimal shape of pdfjs-dist that countPdfPages needs, so this file imports nothing. */
type PdfJsLike = {
     getDocument: (src: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number }> };
};

/**
 * Page count of a PDF blob, or null when it cannot be read.
 *
 * Counting the bytes that are about to be saved is the only check that cannot be
 * fooled by stale component state: a preview blob can outlive the page count
 * that was measured from it, and a freshly generated PDF has never been measured
 * at all.
 */
export async function countPdfPages(blob: Blob, pdfjs: PdfJsLike): Promise<number | null> {
     try {
          const arrayBuffer = await blob.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          return pdf.numPages;
     } catch (err) {
          console.error("[medicalPdfPageRule] could not read page count:", err);
          return null;
     }
}
