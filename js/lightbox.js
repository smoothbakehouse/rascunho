// ==================================================
// LIGHTBOX (ZOOM) — REUSA O CARROSSEL (MESMO ESTILO)
// (inicia só depois do DOM carregar)
// ==================================================

function initSmoothLightbox(){
  const lightbox = document.getElementById("lightbox");
  const lbTrack  = document.getElementById("lbCarouselTrack");
  const lbDots   = document.getElementById("lbDots");

  // Se ainda não existe, não inicializa
  if(!lightbox || !lbTrack || !lbDots){
    console.warn("⚠️ Lightbox: elementos não encontrados (#lightbox / #lbCarouselTrack / #lbDots)");
    return false;
  }

  const closeBtn = lightbox.querySelector(".lightbox-close");
  const prevBtn  = lightbox.querySelector(".carousel-btn.prev");
  const nextBtn  = lightbox.querySelector(".carousel-btn.next");
  const lbMedia  = lightbox.querySelector("[data-lb-carousel]");

  let images = [];
  let index = 0;

  // swipe
  let isDown = false;
  let startX = 0;
  let lastDX = 0;
  let dragActive = false;

  // --------------------------------------------------
  // Helpers
  // --------------------------------------------------
  function setTranslate(i, animate = true){
    const w = lbTrack.clientWidth || 1;
    lbTrack.style.transition = animate ? "transform .28s ease" : "none";
    lbTrack.style.transform = `translateX(${-i * w}px)`;
  }

  function renderDots(){
    lbDots.innerHTML = "";
    images.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel-dot" + (i === index ? " is-active" : "");
      b.setAttribute("aria-label", `Ir para imagem ${i+1}`);
      b.addEventListener("click", () => {
        index = i;
        update(true);
      });
      lbDots.appendChild(b);
    });
  }

  function update(animate = true){
    setTranslate(index, animate);
    [...lbDots.children].forEach((dot, i) => {
      dot.classList.toggle("is-active", i === index);
    });
  }

  function buildFromCard(cardMediaEl, startIndex = 0){
    const track = cardMediaEl.querySelector(".carousel-track");
    let imgs = [];

    if(track){
      imgs = [...track.querySelectorAll("img")].map(img => ({
        src: img.currentSrc || img.src,
        alt: img.alt || "Imagem"
      }));
    } else {
      const single = cardMediaEl.querySelector("img");
      if(single){
        imgs = [{
          src: single.currentSrc || single.src,
          alt: single.alt || "Imagem"
        }];
      }
    }

    images = imgs;
    index = Math.max(0, Math.min(startIndex, images.length - 1));

    lbTrack.innerHTML = images.map(it =>
      `<img class="carousel-img" src="${it.src}" alt="${it.alt}">`
    ).join("");

    renderDots();
    requestAnimationFrame(() => update(false));
  }

  // --------------------------------------------------
  // Abrir/Fechar
  // --------------------------------------------------
  function openZoom(cardMediaEl, startIndex = 0){
    buildFromCard(cardMediaEl, startIndex);

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function closeZoom(){
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  // ✅ expõe pro console
  window.openZoom  = openZoom;
  window.closeZoom = closeZoom;

  // --------------------------------------------------
  // Abrir ao clicar no card-media
  // --------------------------------------------------
  document.addEventListener("click", (e) => {
    const cardMedia = e.target.closest(".card-media");
    if(!cardMedia) return;

    // não abre se clicou em botões
    if(e.target.closest(".carousel-btn, .carousel-dot, .lightbox-close")) return;

    // não abre se clicou dentro do próprio lightbox
    if(cardMedia.closest("#lightbox")) return;

    // índice correto se clicou em uma img específica
    let start = 0;
    const track = cardMedia.querySelector(".carousel-track");
    if(track){
      const imgs = [...track.querySelectorAll("img")];
      const clickedImg = e.target.closest("img");
      if(clickedImg){
        const i = imgs.indexOf(clickedImg);
        if(i >= 0) start = i;
      }
    }

    openZoom(cardMedia, start);
  }, true);

  // --------------------------------------------------
  // Fechar
  // --------------------------------------------------
  closeBtn?.addEventListener("click", closeZoom);

  lightbox.addEventListener("click", (e) => {
    if(e.target === lightbox) closeZoom();
  });

  document.addEventListener("keydown", (e) => {
    if(!lightbox.classList.contains("active")) return;
    if(e.key === "Escape") closeZoom();
    if(e.key === "ArrowLeft") goPrev();
    if(e.key === "ArrowRight") goNext();
  });

  // --------------------------------------------------
  // Navegação
  // --------------------------------------------------
  function pressFX(btn){
    if(!btn) return;
    btn.classList.add("is-press");
    setTimeout(() => btn.classList.remove("is-press"), 120);
  }

  function goPrev(){
    if(images.length <= 1) return;
    index = (index - 1 + images.length) % images.length;
    update(true);
    pressFX(prevBtn);
  }

  function goNext(){
    if(images.length <= 1) return;
    index = (index + 1) % images.length;
    update(true);
    pressFX(nextBtn);
  }

  prevBtn?.addEventListener("click", goPrev);
  nextBtn?.addEventListener("click", goNext);

  // --------------------------------------------------
  // Swipe (mobile)
  // --------------------------------------------------
  if(lbMedia){
    lbMedia.addEventListener("pointerdown", (e) => {
      if(e.target.closest("button")) return;
      isDown = true;
      dragActive = false;
      startX = e.clientX;
      lastDX = 0;

      try { lbMedia.setPointerCapture(e.pointerId); } catch(_) {}
      lbTrack.style.transition = "none";
    });

    lbMedia.addEventListener("pointermove", (e) => {
      if(!isDown) return;

      const dx = e.clientX - startX;
      lastDX = dx;
      if(Math.abs(dx) > 6) dragActive = true;

      const w = lbTrack.clientWidth || 1;
      const base = -index * w;
      lbTrack.style.transform = `translateX(${base + dx}px)`;
    });

    function endDrag(){
      if(!isDown) return;
      isDown = false;

      const w = lbTrack.clientWidth || 1;
      const threshold = Math.min(80, w * 0.18);

      if(dragActive && lastDX > threshold) goPrev();
      else if(dragActive && lastDX < -threshold) goNext();
      else update(true);

      dragActive = false;
      lastDX = 0;
    }

    lbMedia.addEventListener("pointerup", endDrag);
    lbMedia.addEventListener("pointercancel", endDrag);
  }

  console.log("✅ Lightbox inicializado | window.openZoom =", typeof window.openZoom);
  return true;
}

// ==================================================
// Inicialização: espera o DOM
// ==================================================
if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", () => {
    initSmoothLightbox();

    // (opcional) tentativa extra caso algo injete HTML depois
    setTimeout(() => {
      if(typeof window.openZoom !== "function") initSmoothLightbox();
    }, 300);
  });
} else {
  initSmoothLightbox();
  setTimeout(() => {
    if(typeof window.openZoom !== "function") initSmoothLightbox();
  }, 300);
}