/**
 * UI behaviour: motion toggle, onboarding video control, pinned scroll scene
 * and reveal-on-scroll. All motion respects `prefers-reduced-motion` and the
 * visible "Pause motion" button (WCAG 2.2.2 / 2.3.3).
 */
function initUi(): void {
  const root = document.documentElement;
  const video = document.getElementById("ob") as HTMLVideoElement | null;
  const pauseBtn = document.getElementById("pp") as HTMLButtonElement | null;
  const motionBtn = document.getElementById("mt") as HTMLButtonElement | null;
  const scene = document.getElementById("scene");
  if (!video || !pauseBtn || !motionBtn || !scene) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrow = window.matchMedia("(max-width: 899px)");

  /* ---- Onboarding video ---- */
  const syncVideoButton = (): void => {
    const paused = video.paused;
    pauseBtn.classList.toggle("paused", paused);
    pauseBtn.setAttribute("aria-label", paused ? "Play onboarding video" : "Pause onboarding video");
  };
  const playVideo = (): void => {
    const result = video.play();
    if (result && typeof result.catch === "function") result.catch(() => undefined);
  };
  pauseBtn.addEventListener("click", () => (video.paused ? playVideo() : video.pause()));
  video.addEventListener("play", syncVideoButton);
  video.addEventListener("pause", syncVideoButton);

  /* ---- Global "Pause motion" toggle ---- */
  const setStill = (on: boolean): void => {
    root.classList.toggle("still", on);
    motionBtn.setAttribute("aria-pressed", String(on));
    if (on) video.pause();
    else playVideo();
  };
  motionBtn.addEventListener("click", () => setStill(motionBtn.getAttribute("aria-pressed") !== "true"));
  if (reducedMotion.matches) setStill(true);
  syncVideoButton();

  /* ---- Pinned scene: scroll progress drives the statements ---- */
  const points = scene.querySelectorAll<HTMLLIElement>(".pts li");
  let ticking = false;
  const updateScene = (): void => {
    ticking = false;
    const flat = narrow.matches || reducedMotion.matches || root.classList.contains("still");
    let progress = 0.6;
    if (!flat) {
      const rect = scene.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      progress = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 1;
    }
    scene.style.setProperty("--p", progress.toFixed(3));
    points.forEach((li, i) => li.classList.toggle("on", flat || progress >= 0.06 + i * 0.14));
  };
  const requestUpdate = (): void => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScene);
    }
  };
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  motionBtn.addEventListener("click", updateScene);
  updateScene();

  /* ---- Reveal on scroll (only when JS is on and motion is allowed) ---- */
  if ("IntersectionObserver" in window && root.classList.contains("js")) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document
      .querySelectorAll("main section:not(.scene) h2, .card, .shot, .steps li, .vphone, .sec, details, footer h2")
      .forEach((el) => {
        el.classList.add("rv");
        observer.observe(el);
      });
  }
}
