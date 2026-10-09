// Additional Info entries are stored newline-separated in `additionalInfo`.
// PDF requests also get them as an `additionalInfoItems` array (one line each),
// the same way `responsibilities` is sent for work experience.
export const withAdditionalInfoItems = <T extends { additionalInfo?: string }>(
    education: T[] | undefined | null
) =>
    (education || []).map((edu) => ({
        ...edu,
        additionalInfoItems: (edu.additionalInfo || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
    }));
