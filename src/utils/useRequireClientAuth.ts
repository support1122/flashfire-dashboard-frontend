import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../state_management/UserContext";
import { useOperationsStore } from "../state_management/Operations";

/**
 * Sends a logged-out visitor to /login, and tells the caller whether to render.
 *
 * WHY THIS IS A HOOK AND NOT THREE COPIES
 * ---------------------------------------
 * The gate used to live inline in MainContent only, so /profile and /inbox never
 * had one at all: opening either of them logged out rendered the whole client
 * chrome. Keeping the rule in one place is what stops the next route from
 * shipping with the same hole.
 *
 * THE CALLER MUST RESPECT THE RETURN VALUE
 * ----------------------------------------
 * Redirecting in an effect is not enough on its own. Effects run after the first
 * paint, so a component that ignores this and renders anyway still shows a full
 * frame of the dashboard before the redirect lands. That frame is exactly the
 * bug this fixes, so every caller does:
 *
 *     const isAuthed = useRequireClientAuth();
 *     if (!isAuthed) return null;
 *
 * A LOGGED-IN USER NEVER FLICKERS
 * -------------------------------
 * UserContext seeds its state from localStorage inside the useState initialiser,
 * so `token` is already populated on the very first render after a hard refresh.
 * localStorage is read here as well, for the case where the context has not been
 * provided at all.
 *
 * OPERATORS ARE EXEMPT. Their session lives in the operations store, not in
 * userAuth, so judging them by a client token would throw them out of their own
 * dashboard.
 */
export function useRequireClientAuth(): boolean {
     const navigate = useNavigate();
     const context = useContext(UserContext);
     const { role } = useOperationsStore();
     const token = context?.token;

     let storedToken = "";
     try {
          const raw = localStorage.getItem("userAuth");
          if (raw) storedToken = JSON.parse(raw)?.token || "";
     } catch {
          /* malformed storage reads as logged out */
     }

     const isAuthed = Boolean(token && token.length > 0) || storedToken.length > 0;
     const isOperator = role === "operations";

     useEffect(() => {
          if (isAuthed || isOperator) return;

          // Never build a redirect that points back at the login page. This can
          // fire a second time after navigate() while the component is still
          // mounted, and without the guard that run wraps the first run's URL:
          //   /login?redirect=%2Flogin%3Fredirect%3D%252F
          // which sends the user to the login page AGAIN after they sign in.
          // Measured in a browser, not theorised.
          if (window.location.pathname.startsWith("/login")) return;

          // Keep the query string so ?tab=jobs and friends survive the round trip.
          const next = window.location.pathname + window.location.search;
          navigate(`/login?redirect=${encodeURIComponent(next)}`, { replace: true });
     }, [isAuthed, isOperator, navigate]);

     return isAuthed || isOperator;
}
