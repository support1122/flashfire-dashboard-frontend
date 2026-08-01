import { useOperationsStore, isOpsRole } from "./Operations";
import { useSidebarStore } from "./SidebarStore";

/**
 * Left margin for whatever sits next to the navigation.
 *
 * Operators get the horizontal top bar, which is in normal document flow and
 * needs no offset. Clients get the fixed sidebar, so their content shifts by
 * its width and animates when it collapses.
 *
 * Returning "" for operators matters: without it every operator page would sit
 * behind a 14rem gutter reserved for a sidebar that is not rendered.
 */
export function useContentOffsetClass(): string {
    const { role } = useOperationsStore();
    const { isOpen } = useSidebarStore();
    if (isOpsRole(role)) return "";
    return `transition-[margin] duration-200 ease-in-out ${isOpen ? "md:ml-56" : "md:ml-0"}`;
}
