/**
 * Shared page gutters.
 *
 * Every page used to set its own padding (`px-5`, `px-4 sm:px-6 lg:px-8`, or
 * nothing) with no width cap, so content ran edge to edge on wide monitors and
 * shifted horizontally when you switched tabs. These constants keep the gutter
 * identical everywhere.
 *
 * The bar backgrounds stay full-bleed on purpose: only their *contents* are
 * constrained, so the white band still spans the viewport while its text lines
 * up with the cards below it.
 */

/** Centred column with responsive side padding. Use for header-bar contents. */
export const PAGE_CONTAINER = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8";

/** Full-bleed page header band. Put PAGE_CONTAINER on a div inside it. */
export const PAGE_HEADER_BAR =
    "bg-white border-b border-gray-200 border-t-4 border-t-orange-500";

/** Vertical padding for the header band's inner container. */
export const PAGE_HEADER_INNER = `${PAGE_CONTAINER} py-5`;

/** Main content column, with the breathing room above and below the fold. */
export const PAGE_MAIN = `${PAGE_CONTAINER} py-8`;
