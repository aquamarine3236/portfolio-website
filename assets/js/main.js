/**
 * MinimalFolio custom scripts
 * Simplified for the portfolio layout and sidebar navigation.
 */
(function () {
  "use strict";

  const sidebar = document.querySelector("#sidebar");
  const sidebarToggleBtn = document.querySelector(".sidebar-toggle");
  const sidebarLinks = document.querySelectorAll("#sidebar-menu a");

  /**
   * Preloader removal
   */
  const preloader = document.querySelector("#preloader");
  if (preloader) {
    window.addEventListener("load", () => {
      preloader.remove();
    });
  }

  /**
   * Scroll to top button
   */
  const scrollTop = document.querySelector(".scroll-top");
  const toggleScrollTop = () => {
    if (!scrollTop) return;
    scrollTop.classList.toggle("active", window.scrollY > 100);
  };

  if (scrollTop) {
    scrollTop.addEventListener("click", (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  window.addEventListener("load", toggleScrollTop);
  document.addEventListener("scroll", toggleScrollTop);

  /**
   * AOS animations
   */
  const aosInit = () => {
    if (window.AOS) {
      AOS.init({
        duration: 600,
        easing: "ease-in-out",
        once: true,
        mirror: false,
      });
    }
  };
  window.addEventListener("load", aosInit);

  /**
   * Lightbox for galleries
   */
  if (window.GLightbox) {
    GLightbox({ selector: ".glightbox" });
  }

  /**
   * Isotope filters
   */
  document.querySelectorAll(".isotope-layout").forEach((isotopeItem) => {
    const layout = isotopeItem.getAttribute("data-layout") ?? "masonry";
    const filter = isotopeItem.getAttribute("data-default-filter") ?? "*";
    const sort = isotopeItem.getAttribute("data-sort") ?? "original-order";

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector(".isotope-container"), () => {
      initIsotope = new Isotope(isotopeItem.querySelector(".isotope-container"), {
        itemSelector: ".isotope-item",
        layoutMode: layout,
        filter,
        sortBy: sort,
      });
    });

    isotopeItem.querySelectorAll(".isotope-filters li").forEach((button) => {
      button.addEventListener("click", () => {
        const active = isotopeItem.querySelector(".isotope-filters .filter-active");
        if (active) {
          active.classList.remove("filter-active");
        }
        button.classList.add("filter-active");
        if (initIsotope) {
          initIsotope.arrange({ filter: button.getAttribute("data-filter") });
        }
        aosInit();
      });
    });
  });

  /**
   * Hash link positioning fix on load
   */
  window.addEventListener("load", () => {
    if (window.location.hash) {
      const section = document.querySelector(window.location.hash);
      if (section) {
        setTimeout(() => {
          const scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop, 10),
            behavior: "smooth",
          });
        }, 100);
      }
    }
  });

  /**
   * Sidebar toggle and scrollspy
   */
  const toggleSidebar = () => {
    if (!sidebar || !sidebarToggleBtn) return;
    sidebar.classList.toggle("sidebar-show");
    sidebarToggleBtn.classList.toggle("bi-list");
    sidebarToggleBtn.classList.toggle("bi-x");
  };

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener("click", toggleSidebar);
  }

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (sidebar && sidebar.classList.contains("sidebar-show")) {
        toggleSidebar();
      }
    });
  });

  const sidebarScrollspy = () => {
    const position = window.scrollY + 200;
    sidebarLinks.forEach((link) => {
      if (!link.hash) return;
      const section = document.querySelector(link.hash);
      if (!section) return;
      if (position >= section.offsetTop && position <= section.offsetTop + section.offsetHeight) {
        document.querySelectorAll("#sidebar-menu a.active").forEach((active) => active.classList.remove("active"));
        link.classList.add("active");
      }
    });
  };

  window.addEventListener("load", sidebarScrollspy);
  document.addEventListener("scroll", sidebarScrollspy);
})();
