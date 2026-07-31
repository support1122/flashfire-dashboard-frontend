import type React from "react";
import { useOperationsStore, isOpsRole } from "../state_management/Operations.ts";
import NavigationOps from "./NavigationOps.tsx";
import NavigationClient from "./NavigationClient.tsx";
import type { NavigationProps } from "../types/navigation.ts";

/**
 * Picks the navigation by role.
 *
 * Operators keep the horizontal top bar they already work in every day, so the
 * new sidebar does not retrain muscle memory for the internal team. Clients get
 * the new sidebar. Both take the same props, so callers never branch.
 *
 * Everything role-gated inside each nav (the Mail and Operations tabs, the
 * long-press shortcuts, Switch Client) still applies on top of this choice.
 */
const Navigation: React.FC<NavigationProps> = (props) => {
    const { role } = useOperationsStore();
    return isOpsRole(role) ? <NavigationOps {...props} /> : <NavigationClient {...props} />;
};

export default Navigation;
