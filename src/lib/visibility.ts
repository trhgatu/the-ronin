// Shared pause switch for the site's always-on rAF/WebGL loops. Most of them
// used to render every frame for the whole page lifetime — five of them live
// inside Artifacts alone — so scrolling Contact still paid for the lake, mist
// portal, reflection and tear shader. Calls onChange(visible) whenever `el`
// enters/leaves the viewport (padded by rootMargin so loops are already warm
// by the time they scroll in) or the tab is hidden/shown.
export function watchVisibility(
  el: Element,
  onChange: (visible: boolean) => void,
  rootMargin = '200px',
) {
  let inView = true;
  let tabVisible = !document.hidden;
  let last = true;

  const emit = () => {
    const visible = inView && tabVisible;
    if (visible === last) return;
    last = visible;
    onChange(visible);
  };

  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    emit();
  }, { rootMargin });
  io.observe(el);

  const onVisibility = () => {
    tabVisible = !document.hidden;
    emit();
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
