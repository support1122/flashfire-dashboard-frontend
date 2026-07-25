/** Categories in the Documents section. Operators navigate these from
 *  ResumeOptimizer1's own internal tabs; clients get them as sidebar
 *  sub-items, which is why the value is lifted into MainContent. */
export type DocumentCategoryId =
    | "base"
    | "optimized"
    | "cover"
    | "transcript"
    | "portfolio";

/** One call signature shared by both navigations so `Navigation` can dispatch
 *  between them by role without the caller knowing which one it gets.
 *  NavigationOps ignores the document fields; it has no Documents sub-menu. */
export interface NavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    setUserProfileFormVisibility?: (visible: boolean) => void;
    documentCategory?: DocumentCategoryId | null;
    onDocumentCategoryChange?: (category: DocumentCategoryId | null) => void;
}
