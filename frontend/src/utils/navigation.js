/**
 * Safely navigates back within the app.
 * If user opened the page directly or refreshed (no in-app history),
 * it redirects to the fallback route (defaults to '/').
 */
export const safeNavigateBack = (navigate, fallback = '/') => {
  const hasHistory = window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0;
  if (hasHistory) {
    navigate(-1);
  } else {
    navigate(fallback);
  }
};
