// A real microscopy recording, progressively enhanced from a static poster.
window.initHeroVideo = function () {
  const video = document.querySelector('#hero-video');
  const toggle = document.querySelector('.hero-media-toggle');
  if (!video || !toggle) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let wanted = !motion.matches && !navigator.connection?.saveData;
  let visible = true;
  let failed = false;
  let revision = 0;
  video.muted = true;
  toggle.hidden = false;
  const label = () => { toggle.textContent = video.paused ? 'Play video' : 'Pause video'; };
  async function sync() {
    const current = ++revision;
    if (!wanted || !visible || document.hidden || failed) { video.pause(); label(); return; }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    try {
      await video.play();
      if (current !== revision && (!wanted || !visible || document.hidden || failed)) video.pause();
    } catch {
      // Autoplay is optional. A rejected request leaves an explicit play action.
      if (current === revision) wanted = false;
    }
    label();
  }
  toggle.addEventListener('click', () => { wanted = !wanted; sync(); });
  video.addEventListener('play', label);
  video.addEventListener('pause', label);
  video.addEventListener('error', () => {
    failed = true; wanted = false; revision++; video.pause();
    // Restore the poster instead of leaving a broken media element.
    video.removeAttribute('src'); video.load();
    toggle.textContent = 'Video unavailable'; toggle.disabled = true;
  });
  motion.addEventListener('change', () => { wanted = false; sync(); });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { revision++; video.pause(); });
  window.addEventListener('pageshow', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(video);
  }
  sync();
};
