// Additional Info entries are stored newline-separated in `additionalInfo`.
// The PDF server drops "\n" (all entries end up in one paragraph) but honours
// <br>, so PDF requests get the entries joined with <br>. They are also sent
// as an `additionalInfoItems` array (like `responsibilities`).
export const withAdditionalInfoItems = <T extends { additionalInfo?: string }>(
    education: T[] | undefined | null
) =>
    (education || []).map((edu) => {
        const items = (edu.additionalInfo || "")
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean);
        return {
            ...edu,
            additionalInfo: items.join("<br>"),
            additionalInfoItems: items,
        };
    });
