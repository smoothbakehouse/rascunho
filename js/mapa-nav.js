document.addEventListener("DOMContentLoaded", () => {

  const menuLinks = document.querySelectorAll(".nav-list > li > a");
  const sections = document.querySelectorAll("section[id]");

  function setActiveLink() {

    const scrollTop = document.body.scrollTop;
    const windowHeight = window.innerHeight;
    const scrollPos = scrollTop + windowHeight * 0.4; // ponto de leitura visual

    let currentSectionId = null;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;

      if (scrollPos >= top && scrollPos < top + height) {
        currentSectionId = section.id;
      }
    });

    // =========================
    // 🔴 REGRA ESPECIAL — FIM DA PÁGINA
    // =========================
    const atBottom =
      scrollTop + windowHeight >= document.body.scrollHeight - 5;

    if (atBottom) {
      currentSectionId = "contato";
    }

    // =========================
    // ATIVA LINK DO MENU
    // =========================
    menuLinks.forEach(link => {
      link.classList.remove("active");

      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });

  }

  document.body.addEventListener("scroll", setActiveLink);
  setActiveLink();



  // =========================
  // UNDERLINE DOS TÍTULOS (Observer)
  // =========================

  const sectionTitles = document.querySelectorAll('.section-title');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-active');
      }
    });
  }, { threshold: 0.6 });

  sectionTitles.forEach(title => observer.observe(title));

});
