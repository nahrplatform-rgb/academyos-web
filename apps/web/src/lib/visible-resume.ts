/** Pair browser visibility/focus signals without a time-based freshness lease. */
export function listenForVisibleResume(resume: () => void) {
  let hidden = document.visibilityState === 'hidden';
  let visibilityCoveredFocus = false;
  const focus = () => {
    if (document.visibilityState !== 'visible') return;
    if (visibilityCoveredFocus) {
      visibilityCoveredFocus = false;
      return;
    }
    resume();
  };
  const visibility = () => {
    if (document.visibilityState !== 'visible') {
      hidden = true;
      visibilityCoveredFocus = false;
      return;
    }
    if (!hidden) return;
    hidden = false;
    // The following focus belongs to this same visible return, even if a fast
    // read finishes before it arrives. A later blur starts a distinct return.
    visibilityCoveredFocus = true;
    resume();
  };
  const blur = () => { visibilityCoveredFocus = false; };
  window.addEventListener('focus', focus);
  window.addEventListener('blur', blur);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    window.removeEventListener('focus', focus);
    window.removeEventListener('blur', blur);
    document.removeEventListener('visibilitychange', visibility);
  };
}
