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
     3. Lenis Smooth Scroll + GSAP Setup
     ---------------------------------------- */
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

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
    let pendingFrame = null;
    let rafId = null;

    function scheduleFrame(index) {
      pendingFrame = index;
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          if (pendingFrame !== null && pendingFrame !== currentFrame) {
            drawFrame(pendingFrame);
          }
          rafId = null;
          pendingFrame = null;
        });
      }
    }

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
        scheduleFrame(frameIndex);
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
            opacity: 0,
            stagger: 0,
            duration: 0.6,
            ease: "power2.out",
          });
          break;
        case "slide-left":
          tl.from(children, {
            x: -40,
            opacity: 0,
            stagger: 0,
            duration: 0.5,
            ease: "power2.out",
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
  const _v = typeof DATA_VERSION !== "undefined" ? DATA_VERSION : Date.now();

  function getYouTubeId(url) {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function buildCard(item) {
    if (!item.video && !item.thumb) return "";
    const isVert = item.type === "vertical";
    const ytId = getYouTubeId(item.video);
    const thumbSrc = item.thumb
      ? item.thumb
      : ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "";
    const thumb = thumbSrc
      ? `<img src="${thumbSrc}" alt="${item.title}" loading="lazy">`
      : `<div class="project-placeholder">${item.title.charAt(0) || "?"}</div>`;
    const videoAttr = item.video ? ` data-video="${item.video}"` : "";
    const playSvg = item.video ? `<div class="play-overlay"><svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="23" stroke="#F5C518" stroke-width="2"/><polygon points="19,14 36,24 19,34" fill="#F5C518"/></svg></div>` : "";
    return `<div class="project-card${isVert ? " vertical" : ""}"${videoAttr}>
      <div class="project-thumb">${thumb}${playSvg}</div>
    </div>`;
  }

  function buildCarousel(category, items, isFirst, hasPhotos) {
    const arrowSvgL = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
    const arrowSvgR = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    const cameraIcon = '<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M15 12l2-4h14l2 4h7a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3h7z" stroke="#F5C518" stroke-width="2"/><circle cx="24" cy="25" r="8" stroke="#F5C518" stroke-width="2"/><circle cx="24" cy="25" r="4" stroke="#F5C518" stroke-width="1.5"/></svg>';
    const photosBtn = hasPhotos ? `<div class="project-card photos-btn" data-gallery="${category}">
      <div class="project-thumb photos-thumb">
        ${cameraIcon}
        <span class="photos-label">PHOTOS</span>
      </div>
    </div>` : "";
    return `<div class="carousel" data-category="${category}" style="${isFirst ? "" : "display:none;"}">
      <button class="carousel-arrow arrow-left" aria-label="Previous">${arrowSvgL}</button>
      <div class="carousel-track">${items.map(buildCard).join("")}${photosBtn}</div>
      <button class="carousel-arrow arrow-right" aria-label="Next">${arrowSvgR}</button>
    </div>`;
  }

  function buildClientCard(client) {
    if (!client.name) return "";
    const igSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>';
    const webSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    const logoEl = client.logo
      ? `<img src="${client.logo}" alt="${client.name}" class="client-logo-img"${client.logoStyle ? ` style="${client.logoStyle}"` : ""}>`
      : `<div class="client-logo-placeholder">${client.name.charAt(0)}</div>`;
    const links = [];
    if (client.instagram) links.push(`<a href="${client.instagram}" target="_blank" class="client-link-icon" title="Instagram">${igSvg}</a>`);
    if (client.website) links.push(`<a href="${client.website}" target="_blank" class="client-link-icon" title="Website">${webSvg}</a>`);
    return `<div class="client-card">
      ${logoEl}
      <span class="client-name">${client.name}</span>
      <span class="client-links">${links.join("")}</span>
    </div>`;
  }

  async function initPortfolio() {
    try {
      const [portfolioRes, clientsRes] = await Promise.all([
        fetch(`data/portfolio.json?v=${_v}`),
        fetch(`data/clients.json?v=${_v}`)
      ]);
      const portfolio = await portfolioRes.json();
      const clients = await clientsRes.json();

      // Render portfolio carousels
      const container = document.getElementById("portfolio-carousels");
      const photosData = portfolio.photos || {};
      if (container) {
        const categories = Object.keys(portfolio).filter(c => c !== "photos");
        container.innerHTML = categories.map((cat, i) => {
          const hasPhotosCat = cat === "music" || cat === "restaurants";
          return buildCarousel(cat, portfolio[cat], i === 0, hasPhotosCat);
        }).join("");
      }

      // Build photo gallery overlays per category
      ["music", "restaurants"].forEach((cat) => {
        const photos = (photosData[cat]) || [];

        const gallery = document.createElement("div");
        gallery.className = "photo-gallery";
        gallery.dataset.galleryFor = cat;
        gallery.innerHTML = `<div class="gallery-backdrop"></div>
          <div class="gallery-content">
            <button class="gallery-close">&times;</button>
            <h2 class="gallery-title">${cat.toUpperCase()} PHOTOS</h2>
            <div class="gallery-grid">${photos.length > 0 ? photos.map(p => `<div class="gallery-item${p.type === "vertical" ? " vertical" : ""}"><img src="${p.thumb}" alt="" loading="lazy"></div>`).join("") : '<p style="color: var(--gold); opacity: 0.5; grid-column: 1/-1; text-align: center;">Coming soon...</p>'}</div>
          </div>`;
        document.body.appendChild(gallery);

        const closeGallery = () => gallery.classList.remove("active");
        gallery.querySelector(".gallery-backdrop").addEventListener("click", closeGallery);
        gallery.querySelector(".gallery-close").addEventListener("click", closeGallery);
        document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeGallery(); });

        // Click gallery photo for fullscreen
        gallery.querySelectorAll(".gallery-item").forEach((item) => {
          item.style.cursor = "pointer";
          item.addEventListener("click", () => {
            const src = item.querySelector("img").src;
            modalImage.src = src;
            modalImage.style.display = "block";
            modalVideo.style.display = "none";
            modalIframe.style.display = "none";
            modal.classList.add("active");
          });
        });
      });

      // Wire up all photos buttons to their galleries
      setTimeout(() => {
        document.querySelectorAll(".photos-btn[data-gallery]").forEach((btn) => {
          btn.style.cursor = "pointer";
          btn.addEventListener("click", () => {
            const cat = btn.dataset.gallery;
            const gallery = document.querySelector(`.photo-gallery[data-gallery-for="${cat}"]`);
            if (gallery) gallery.classList.add("active");
          });
        });
      }, 100);

      // Render clients
      const clientsGrid = document.getElementById("clients-grid");
      if (clientsGrid) {
        clientsGrid.innerHTML = clients.filter(c => c.name).map(buildClientCard).join("");
      }

      // Wire up tabs
      const tabs = document.querySelectorAll(".tab");
      const carousels = document.querySelectorAll(".carousel");
      tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
          const category = tab.dataset.category;
          tabs.forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          carousels.forEach((c) => {
            c.style.display = c.dataset.category === category ? "block" : "none";
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
          return card ? card.offsetWidth + 24 : 0;
        };
        leftBtn.addEventListener("click", () => track.scrollBy({ left: -getCardWidth(), behavior: "smooth" }));
        rightBtn.addEventListener("click", () => track.scrollBy({ left: getCardWidth(), behavior: "smooth" }));
        track.style.overflowX = "auto";
        track.style.scrollbarWidth = "none";
        track.style.msOverflowStyle = "none";
      });
      // Fullscreen video modal (supports local video + YouTube)
      const modal = document.createElement("div");
      modal.id = "video-modal";
      modal.innerHTML = `<div class="modal-backdrop"></div><div class="modal-content"><button class="modal-close">&times;</button><video id="modal-video" controls playsinline></video><iframe id="modal-iframe" frameborder="0" allow="autoplay; fullscreen; encrypted-media" allowfullscreen></iframe><img id="modal-image" style="display:none; max-width:90vw; max-height:90vh; object-fit:contain;" alt=""></div>`;
      document.body.appendChild(modal);

      const modalVideo = document.getElementById("modal-video");
      const modalIframe = document.getElementById("modal-iframe");
      const modalImage = document.getElementById("modal-image");
      const closeModal = () => {
        modal.classList.remove("active");
        modalVideo.pause();
        modalVideo.src = "";
        modalIframe.src = "";
        modalImage.src = "";
        modalVideo.style.display = "none";
        modalIframe.style.display = "none";
        modalImage.style.display = "none";
      };
      modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
      modal.querySelector(".modal-close").addEventListener("click", closeModal);
      document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

      document.querySelectorAll(".project-card[data-video]").forEach((card) => {
        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
          e.preventDefault();
          const src = card.dataset.video;
          const ytId = getYouTubeId(src);
          if (ytId) {
            modalIframe.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
            modalIframe.style.display = "block";
            modalVideo.style.display = "none";
            modalImage.style.display = "none";
          } else {
            modalVideo.src = src;
            modalVideo.style.display = "block";
            modalIframe.style.display = "none";
            modalImage.style.display = "none";
            modalVideo.play();
          }
          modal.classList.add("active");
        });
      });

      // Photo cards (no video) — open image fullscreen in modal
      document.querySelectorAll(".project-card:not([data-video])").forEach((card) => {
        const thumbImg = card.querySelector(".project-thumb img");
        if (!thumbImg) return;
        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
          e.preventDefault();
          modalImage.src = thumbImg.getAttribute("src");
          modalImage.style.display = "block";
          modalVideo.style.display = "none";
          modalIframe.style.display = "none";
          modal.classList.add("active");
        });
      });

    } catch (err) {
      console.error("Failed to load portfolio/clients data:", err);
    }
  }

  initPortfolio();

  /* ----------------------------------------
     8. Skip Navigation
     ---------------------------------------- */
  const skipNav = document.getElementById("skip-nav");

  const scrollHint = document.getElementById("scroll-hint-fixed");

  // Show/hide based on intro section visibility — synced with 001 section (data-enter="5", data-leave="25")
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      // Match 001 section timing exactly
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
