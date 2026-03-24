/* ========================================
   Rotem — Videographer Portfolio
   Canvas frame-based scroll-driven playback
   ======================================== */

(function () {
  "use strict";

  /* ----------------------------------------
     Config
     ---------------------------------------- */
  const TOTAL_FRAMES = 301;
  const FRAME_PATH = "frames/frame_";
  const FRAME_EXT = ".jpg";

  /* ----------------------------------------
     DOM References
     ---------------------------------------- */
  const canvas = document.getElementById("video-canvas");
  const ctx = canvas.getContext("2d");
  const videoWrap = document.getElementById("video-wrap");
  const hero = document.getElementById("hero");
  const scrollContainer = document.getElementById("scroll-container");
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const darkOverlay = document.getElementById("dark-overlay");
  const marqueeWrap = document.getElementById("marquee-wrap");
  const marqueeText = document.getElementById("marquee-text");

  /* ----------------------------------------
     1. Frame Preloader
     ---------------------------------------- */
  const frames = [];
  let loadedCount = 0;
  let currentFrame = 0;

  function frameSrc(index) {
    const num = String(index + 1).padStart(4, "0");
    return FRAME_PATH + num + FRAME_EXT;
  }

  function preloadFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = frameSrc(i);
      img.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        updateLoader(percent);

        // Set canvas size from first loaded frame
        if (loadedCount === 1) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          drawFrame(0);
        }

        if (loadedCount === TOTAL_FRAMES) {
          onAllFramesLoaded();
        }
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          onAllFramesLoaded();
        }
      };
      frames[i] = img;
    }
  }

  function updateLoader(percent) {
    const p = Math.min(percent, 100);
    loaderBar.style.width = p + "%";
    loaderPercent.textContent = p + "%";
  }

  function onAllFramesLoaded() {
    updateLoader(100);
    setTimeout(() => {
      loader.classList.add("hidden");
      lenis.start();
      initScrollSystems();
    }, 400);
  }

  /* ----------------------------------------
     2. Canvas Rendering
     ---------------------------------------- */
  function drawFrame(index) {
    const img = frames[index];
    if (!img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover mode: fill canvas while preserving aspect ratio
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
    currentFrame = index;
  }

  /* ----------------------------------------
     3. Lenis Smooth Scroll
     ---------------------------------------- */
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Stop scroll until loaded
  lenis.stop();

  /* ----------------------------------------
     4. Hero Animation
     ---------------------------------------- */
  function animateHero() {
    const tl = gsap.timeline();

    // Logo — gentle fade + slight scale
    tl.fromTo(".hero-logo", {
      opacity: 0,
      scale: 0.95,
    }, {
      opacity: 1,
      scale: 1,
      duration: 1.8,
      ease: "power2.out",
    });

    // Name — fade in
    tl.to(".hero-name", {
      opacity: 1,
      duration: 1.0,
      ease: "power2.out",
    }, "-=1.0");

    // Subtitle — fade in
    tl.to(".hero-subtitle", {
      opacity: 1,
      duration: 1.0,
      ease: "power2.out",
    }, "-=0.6");

    // Tagline — fade in
    tl.to(".hero-tagline", {
      opacity: 1,
      duration: 1.0,
      ease: "power2.out",
    }, "-=0.6");

    // Scroll indicator — fade in last
    tl.to(".scroll-indicator", {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out",
    }, "-=0.4");
  }

  /* ----------------------------------------
     5. All Scroll-Driven Systems
     ---------------------------------------- */
  function initScrollSystems() {
    gsap.registerPlugin(ScrollTrigger);

    initHeroTransition();
    initScrollDrivenFrames();
    initSections();
    initCounters();
    initMarquee();
    initDarkOverlay();
    initLensLogo();
  }

  /* ----------------------------------------
     5a. Hero → Video Crossfade
     ---------------------------------------- */
  function initHeroTransition() {
    // Video starts invisible
    videoWrap.style.opacity = 0;
    videoWrap.style.clipPath = "none";
    const sideGradient = document.getElementById("side-gradient");

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Crossfade zone: 0% → 5% scroll
        const fadeProgress = Math.min(1, p / 0.05);

        // Hero fades out
        hero.style.opacity = 1 - fadeProgress;

        // Video fades in
        videoWrap.style.opacity = fadeProgress;

        // Side gradient disabled
        sideGradient.style.opacity = 0;
      },
    });
  }

  /* ----------------------------------------
     5b. Scroll-Driven Frame Playback
     Maps scroll progress → frame index → canvas draw
     ---------------------------------------- */
  function initScrollDrivenFrames() {
    const VIDEO_END = 0.80; // video finishes at 80% scroll (before CTA)

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3,
      onUpdate: (self) => {
        const videoProgress = Math.min(1, self.progress / VIDEO_END);
        const frameIndex = Math.min(
          TOTAL_FRAMES - 1,
          Math.floor(videoProgress * TOTAL_FRAMES)
        );
        if (frameIndex !== currentFrame) {
          drawFrame(frameIndex);
        }
      },
    });
  }

  /* ----------------------------------------
     5c. Section Animation System
     ---------------------------------------- */
  function initSections() {
    const sections = document.querySelectorAll(".scroll-section");

    sections.forEach((section) => {
      const enter = parseFloat(section.dataset.enter) / 100;
      const leave = parseFloat(section.dataset.leave) / 100;
      const type = section.dataset.animation;
      const persist = section.dataset.persist === "true";

      const children = section.querySelectorAll(
        ".section-label, .section-heading, .section-body, .service-item, .cta-button, .social-row, .stat"
      );
      const tl = gsap.timeline({ paused: true });

      switch (type) {
        case "clip-reveal":
          tl.from(children, {
            clipPath: "inset(100% 0 0 0)",
            opacity: 0,
            stagger: 0.15,
            duration: 1.2,
            ease: "power4.inOut",
          });
          break;
        case "slide-left":
          tl.from(children, {
            x: -80,
            opacity: 0,
            stagger: 0.14,
            duration: 0.9,
            ease: "power3.out",
          });
          break;
        case "slide-right":
          tl.from(children, {
            x: 80,
            opacity: 0,
            stagger: 0.14,
            duration: 0.9,
            ease: "power3.out",
          });
          break;
        case "stagger-up":
          tl.from(children, {
            y: 60,
            opacity: 0,
            stagger: 0.15,
            duration: 0.8,
            ease: "power3.out",
          });
          break;
        case "scale-up":
          tl.from(children, {
            scale: 0.85,
            opacity: 0,
            stagger: 0.12,
            duration: 1.0,
            ease: "power2.out",
          });
          break;
        case "fade-up":
          tl.from(children, {
            y: 50,
            opacity: 0,
            stagger: 0.12,
            duration: 0.9,
            ease: "power3.out",
          });
          break;
        case "rotate-in":
          tl.from(children, {
            y: 40,
            rotation: 3,
            opacity: 0,
            stagger: 0.1,
            duration: 0.9,
            ease: "power3.out",
          });
          break;
      }

      let isVisible = false;
      let hasPlayed = false;

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          const p = self.progress;
          const fadeIn = 0.02;
          const fadeOut = 0.02;

          let opacity = 0;

          if (p >= enter && p <= leave) {
            if (p < enter + fadeIn) {
              opacity = (p - enter) / fadeIn;
            } else if (p > leave - fadeOut) {
              opacity = persist ? 1 : (leave - p) / fadeOut;
            } else {
              opacity = 1;
            }

            if (!isVisible) {
              isVisible = true;
              tl.play();
              hasPlayed = true;
            }
          } else if (persist && hasPlayed && p > leave) {
            opacity = 1;
          } else {
            if (isVisible && !persist) {
              isVisible = false;
              tl.reverse();
            }
            opacity = 0;
          }

          section.style.opacity = opacity;
          section.style.pointerEvents = opacity > 0.3 ? "auto" : "none";
        },
      });
    });
  }

  /* ----------------------------------------
     5d. Counter Animations
     ---------------------------------------- */
  function initCounters() {
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || "0");
      let triggered = false;

      ScrollTrigger.create({
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const statsSection = el.closest(".scroll-section");
          const enter = parseFloat(statsSection.dataset.enter) / 100;
          const leave = parseFloat(statsSection.dataset.leave) / 100;

          if (self.progress >= enter && self.progress <= leave && !triggered) {
            triggered = true;
            gsap.to(el, {
              textContent: target,
              duration: 2,
              ease: "power1.out",
              snap: { textContent: decimals === 0 ? 1 : 0.01 },
              onUpdate: function () {
                const val = parseFloat(el.textContent);
                el.textContent = decimals === 0 ? Math.round(val) : val.toFixed(decimals);
              },
            });
          }
        },
      });
    });
  }

  /* ----------------------------------------
     5e. Marquee
     ---------------------------------------- */
  function initMarquee() {
    gsap.to(marqueeText, {
      xPercent: -25,
      ease: "none",
      scrollTrigger: {
        trigger: scrollContainer,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        let opacity = 0;

        if (p >= 0.06 && p < 0.10) {
          opacity = (p - 0.06) / 0.04;
        } else if (p >= 0.10 && p <= 0.22) {
          opacity = 1;
        } else if (p > 0.22 && p <= 0.26) {
          opacity = 1 - (p - 0.22) / 0.04;
        }

        marqueeWrap.style.opacity = opacity;
      },
    });
  }

  /* ----------------------------------------
     5f. Dark Overlay
     ---------------------------------------- */
  function initDarkOverlay() {
    darkOverlay.style.opacity = 0;
  }

  /* ----------------------------------------
     5g. Lens Logo — appears on the camera lens after stats
     ---------------------------------------- */
  function initLensLogo() {
    const lensLogo = document.getElementById("lens-logo");
    if (!lensLogo) return;

    ScrollTrigger.create({
      trigger: scrollContainer,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        // Fade in to 60% at 78%, stay 60%, then ramp to 100% at the very end
        if (p >= 0.78 && p < 0.83) {
          lensLogo.style.opacity = (p - 0.78) / 0.05 * 0.6;
        } else if (p >= 0.83 && p < 0.93) {
          lensLogo.style.opacity = 0.6;
        } else if (p >= 0.93) {
          lensLogo.style.opacity = 0.6 + (p - 0.93) / 0.07 * 0.4;
        } else {
          lensLogo.style.opacity = 0;
        }
      },
    });
  }

  /* ----------------------------------------
     6. Handle Resize
     ---------------------------------------- */
  window.addEventListener("resize", () => {
    if (frames[currentFrame] && frames[currentFrame].complete) {
      canvas.width = frames[currentFrame].naturalWidth;
      canvas.height = frames[currentFrame].naturalHeight;
      drawFrame(currentFrame);
    }
  });

  /* ----------------------------------------
     7. Portfolio Tabs & Carousel
     ---------------------------------------- */
  function initPortfolio() {
    const tabs = document.querySelectorAll(".tab");
    const carousels = document.querySelectorAll(".carousel");

    // Tab switching — show/hide carousels
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const category = tab.dataset.category;

        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        carousels.forEach((c) => {
          if (c.dataset.category === category) {
            c.style.display = "block";
          } else {
            c.style.display = "none";
          }
        });
      });
    });

    // Carousel arrow navigation
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      const leftBtn = carousel.querySelector(".arrow-left");
      const rightBtn = carousel.querySelector(".arrow-right");

      const getCardWidth = () => {
        const card = track.querySelector(".project-card");
        if (!card) return 0;
        return card.offsetWidth + 24; // card width + gap
      };

      leftBtn.addEventListener("click", () => {
        track.scrollBy({ left: -getCardWidth(), behavior: "smooth" });
      });

      rightBtn.addEventListener("click", () => {
        track.scrollBy({ left: getCardWidth(), behavior: "smooth" });
      });
    });

    // Enable scroll on track (for touch/drag)
    carousels.forEach((carousel) => {
      const track = carousel.querySelector(".carousel-track");
      track.style.overflowX = "auto";
      track.style.scrollbarWidth = "none";
      track.style.msOverflowStyle = "none";
    });
  }

  initPortfolio();

  /* ----------------------------------------
     8. Skip Navigation
     ---------------------------------------- */
  const skipNav = document.getElementById("skip-nav");

  const scrollHint = document.getElementById("scroll-hint-fixed");

  // Show/hide based on intro section visibility
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      // Skip nav: only during 001 intro
      const enter = 0.05;
      const leave = 0.25;
      const fadeIn = 0.02;
      const fadeOut = 0.02;

      let navOpacity = 0;
      if (p >= enter && p <= leave) {
        if (p < enter + fadeIn) {
          navOpacity = (p - enter) / fadeIn;
        } else if (p > leave - fadeOut) {
          navOpacity = (leave - p) / fadeOut;
        } else {
          navOpacity = 1;
        }
      }

      skipNav.style.opacity = navOpacity;
      skipNav.style.pointerEvents = navOpacity > 0.3 ? "auto" : "none";

      // Scroll hint: visible throughout all scroll sections
      if (p >= 0.02 && p <= 0.95) {
        scrollHint.classList.add("visible");
      } else {
        scrollHint.classList.remove("visible");
      }

    },
  });

  // Click handlers — scroll to target section
  document.querySelectorAll(".skip-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const href = link.getAttribute("href");

      // About is inside scroll-container, scroll to 30% of page
      if (href === "#about-section") {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: scrollHeight * 0.30, behavior: "smooth" });
      } else {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });

  /* ----------------------------------------
     INIT — Start loading frames
     ---------------------------------------- */
  preloadFrames();

})();
