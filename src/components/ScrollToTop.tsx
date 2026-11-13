import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Resets the scroll position to the top of the page whenever the visitor
 * moves to a different page. In-page anchor jumps (e.g. "#featured-moods")
 * only change the hash, so they are left alone.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
