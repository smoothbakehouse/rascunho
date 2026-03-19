// =========================
// MENU MOBILE — HAMBÚRGUER
// =========================

const hamburger = document.getElementById("hamburgerBtn");
const navList = document.querySelector(".nav-list");
const hasSubmenu = document.querySelector(".has-submenu");
const submenuToggle = document.querySelector(".submenu-toggle");

// abrir / fechar menu principal
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  navList.classList.toggle("active");
});

// toggle do submenu (Cookies)
submenuToggle.addEventListener("click", (e) => {
  if (window.innerWidth <= 768) {
    e.preventDefault(); // só impede o Cookies
    hasSubmenu.classList.toggle("open");
  }
});

// clique nos links do submenu → navegação normal
document.querySelectorAll(".submenu a").forEach(link => {
  link.addEventListener("click", () => {
    navList.classList.remove("active");
    hamburger.classList.remove("active");
    hasSubmenu.classList.remove("open");
  });
});

// links normais do menu
document.querySelectorAll(".nav-list > li > a:not(.submenu-toggle)")
  .forEach(link => {
    link.addEventListener("click", () => {
      navList.classList.remove("active");
      hamburger.classList.remove("active");
    });
  });


// ======================
// CARROSSEL — COOKIE CARD (setup completo)
// ======================
function setupCarousel(root){

  const track    = root.querySelector('.carousel-track');
  const imgs     = Array.from(root.querySelectorAll('.carousel-img'));
  const prev     = root.querySelector('.prev');
  const next     = root.querySelector('.next');
  const dotsWrap = root.querySelector('.carousel-dots');

  if(!track || imgs.length === 0) return;
  if(!dotsWrap) return;

  // só 1 imagem
  if(imgs.length <= 1){
    if(prev) prev.style.display = 'none';
    if(next) next.style.display = 'none';
    dotsWrap.style.display = 'none';
    return;
  }

  let index = 0;
  let startX = 0;

  // DOTS
  dotsWrap.style.display = 'flex';
  dotsWrap.innerHTML = '';

  const dots = imgs.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(i);
    });
    dotsWrap.appendChild(b);
    return b;
  });

  function update(){
    track.style.transform = `translateX(${-index * 100}%)`;
    dots.forEach((d,i)=>d.classList.toggle('is-active', i === index));
  }

  // SEM FADE: só troca slide
  function goTo(i){
    index = (i + imgs.length) % imgs.length;
    update();
  }

  function press(btn){
    if(!btn) return;
    btn.classList.add('is-press');
    setTimeout(() => btn.classList.remove('is-press'), 120);
  }

  // SETAS
  if(prev){
    prev.style.display = 'flex';
    prev.addEventListener('click', (e) => {
      e.stopPropagation();
      press(prev);
      goTo(index - 1);
    });
  }

  if(next){
    next.style.display = 'flex';
    next.addEventListener('click', (e) => {
      e.stopPropagation();
      press(next);
      goTo(index + 1);
    });
  }

  // SWIPE
  root.addEventListener('pointerdown', (e) => {
    if(e.target.closest('.carousel-btn') || e.target.closest('.carousel-dot')) return;
    startX = e.clientX || 0;
  });

  root.addEventListener('pointerup', (e) => {
    if(e.target.closest('.carousel-btn') || e.target.closest('.carousel-dot')) return;
    if(!startX) return;

    const endX = e.clientX || 0;
    const dx = endX - startX;

    if(dx > 40)  goTo(index - 1);
    if(dx < -40) goTo(index + 1);

    startX = 0;
  });

  root.addEventListener('pointercancel', () => {
    startX = 0;
  });

  // INIT
  update();
}

// ======================
// INICIALIZAÇÃO GLOBAL
// ======================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-carousel]').forEach(setupCarousel);
});


// TESTE ISOLADO — botão ver pedido
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("mobileBtn");

  if (!btn) return;

  btn.addEventListener("click", function(e) {
    e.preventDefault();

    const target = document.getElementById("checkout");
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});