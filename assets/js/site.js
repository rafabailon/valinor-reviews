(() => {
  "use strict";

  const language = document.documentElement.lang === "es" ? "es" : "en";
  const reviews = (Array.isArray(window.VALINOR_REVIEWS) ? window.VALINOR_REVIEWS : [])
    .filter(review => review && typeof review === "object" && typeof review.id === "string" && review.id);
  const SHELF_KEY = "valinor-reviews:shelf";
  const copy = language === "es" ? {
    home: "Inicio",
    reviews: "reseña",
    reviewsPlural: "reseñas",
    council: "consejo %",
    reviewLink: "Leer la reseña de",
    by: "por",
    bookBy: "Un libro de",
    readReview: "Leer la reseña",
    back: "← Volver a todas las reseñas",
    missingEyebrow: "El camino termina aquí",
    missingTitle: "No encontramos esa historia.",
    missingCopy: "Puede que se haya perdido fuera del mapa.",
    browse: "Explorar reseñas",
    approved: "Aprobado por el consejo lector",
    independent: "Reseña independiente",
    noSpoilers: "Sin spoilers",
    fantasy: "Fantasía",
    keepWandering: "Sigue explorando",
    anotherStory: "Otra historia para el camino",
    allReviews: "Todas las reseñas",
    thanks: "Gracias por tu interés. Esta demo está lista para conectarse a una lista de correo.",
    closeMenu: "Cerrar navegación",
    openMenu: "Abrir navegación",
    switchLanguage: "English",
    save: "Guardar en mi estantería",
    saved: "Guardada en mi estantería",
    remove: "Quitar de mi estantería",
    shelfTitle: "Mi estantería",
    readTime: "min de lectura",
    found: "encontradas",
    foundOne: "encontrada",
    shelfSaved: "guardadas",
    shelfSavedOne: "guardada",
    shelfEmpty: "Tu estantería está vacía",
    noStories: "Todavía no hay historias en el archivo."
  } : {
    home: "Home",
    reviews: "review",
    reviewsPlural: "reviews",
    council: "council %",
    reviewLink: "Read review of",
    by: "by",
    bookBy: "A book by",
    readReview: "Read the review",
    back: "← Back to all reviews",
    missingEyebrow: "The trail ends here",
    missingTitle: "We couldn't find that story.",
    missingCopy: "It may have wandered off the map.",
    browse: "Browse the reviews",
    approved: "Approved by the reading council",
    independent: "Independent review",
    noSpoilers: "No spoilers",
    fantasy: "Fantasy",
    keepWandering: "Keep wandering",
    anotherStory: "Another story for the road",
    allReviews: "All reviews",
    thanks: "Thanks for your interest. This demo is ready to connect to a mailing list.",
    closeMenu: "Close navigation",
    openMenu: "Open navigation",
    switchLanguage: "Español",
    save: "Save to my shelf",
    saved: "Saved to my shelf",
    remove: "Remove from my shelf",
    shelfTitle: "My shelf",
    readTime: "min read",
    found: "found",
    foundOne: "found",
    shelfSaved: "saved",
    shelfSavedOne: "saved",
    shelfEmpty: "Your shelf is empty",
    noStories: "There are no stories in the archive yet."
  };

  const leafIcon = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
      <path d="M19.5 4.5C12 4.5 6 6.6 6 12.1c0 3.2 2.1 5.4 5 5.4 5.2 0 8.2-6 8.5-13Z"/>
      <path d="M4 20c3.2-4.2 6.8-6.8 11.5-9.5"/>
    </svg>`;
  const bookmarkIcon = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 3.75h11a1 1 0 0 1 1 1v15.5l-6.5-4.2-6.5 4.2V4.75a1 1 0 0 1 1-1Z"/>
    </svg>`;

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

  const scoreOf = review => Math.max(0, Math.min(100, Number(review.score) || 0));

  function readShelf() {
    try {
      const stored = window.localStorage.getItem(SHELF_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return [...new Set(parsed.filter(id => typeof id === "string" && id))];
    } catch {
      return [];
    }
  }

  function writeShelf(ids) {
    try {
      window.localStorage.setItem(SHELF_KEY, JSON.stringify([...new Set(ids)]));
    } catch {
      // Private browsing or a full storage quota should never break the page.
    }
  }

  function toggleShelf(id) {
    const ids = readShelf();
    const next = ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];
    writeShelf(next);
    return next.includes(id);
  }

  function cardTemplate(review) {
    const id = escapeHTML(review.id);
    const title = escapeHTML(review.title);
    const score = scoreOf(review);
    return `
      <article class="book-card">
        <a class="book-card-link" href="review.html?id=${encodeURIComponent(review.id)}" aria-label="${copy.reviewLink} ${title}">
          <div class="book-cover">
            <img src="${escapeHTML(review.image)}" alt="${escapeHTML(review.alt)}" loading="lazy" decoding="async">
            <span class="book-category">${escapeHTML(review.category)}</span>
            <span class="score-ring" style="--score:${score}%">
              <span class="score-inside">
                <span class="score-number">${leafIcon}<span>${score}</span></span>
                <span class="score-label">${copy.council}</span>
              </span>
            </span>
          </div>
          <div class="book-info">
            <h3>${title}</h3>
            <p class="book-author">${copy.by} ${escapeHTML(review.author)}</p>
            <p class="book-excerpt">${escapeHTML(review.excerpt)}</p>
            <span class="card-action">${copy.readReview} <span aria-hidden="true">→</span></span>
          </div>
        </a>
        <button class="shelf-toggle" type="button" data-shelf-id="${id}" data-shelf-title="${title}" aria-pressed="false" aria-label="${copy.save}: ${title}" title="${copy.save}">${bookmarkIcon}</button>
      </article>`;
  }

  function searchableText(review) {
    return [
      review.title,
      review.author,
      review.category,
      review.date,
      review.excerpt,
      review.body,
      review.verdict,
      review.details,
      ...(Array.isArray(review.tags) ? review.tags : [])
    ].join(" ").toLocaleLowerCase();
  }

  function syncShelfButtons() {
    const ids = new Set(readShelf());
    document.querySelectorAll("[data-shelf-id]").forEach(button => {
      const id = button.dataset.shelfId;
      if (!id) return;
      const saved = ids.has(id);
      const title = button.dataset.shelfTitle || "";
      const label = saved ? copy.remove : copy.save;
      button.classList.toggle("is-saved", saved);
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", title ? `${label}: ${title}` : label);
      button.title = label;
      const text = button.querySelector("[data-shelf-label]");
      if (text) text.textContent = saved ? copy.saved : copy.save;
    });
    document.querySelectorAll("[data-shelf-count]").forEach(element => {
      element.textContent = String(ids.size);
    });
    const navShelf = document.querySelector('[data-nav="shelf"]');
    if (navShelf) navShelf.setAttribute("aria-label", `${copy.shelfTitle}: ${ids.size}`);
  }

  function setupNavigation() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    const currentPage = document.body.dataset.page;
    nav.querySelector(`[data-nav="${currentPage}"]`)?.setAttribute("aria-current", "page");

    const destinationLanguage = language === "es" ? "en" : "es";
    const destination = new URL(window.location.href);
    const hasLanguagePath = /\/(en|es)\//.test(destination.pathname);
    destination.pathname = destination.pathname.replace(/\/(en|es)\//, `/${destinationLanguage}/`);
    if (!hasLanguagePath) destination.pathname = `/${destinationLanguage}/index.html`;

    const genreNames = {
      "Wilderness fantasy": "Fantasía de naturaleza",
      "Courtly fantasy": "Fantasía cortesana",
      "Coastal fantasy": "Fantasía costera",
      "Mythic fantasy": "Fantasía mítica",
      "Fantasía de naturaleza": "Wilderness fantasy",
      "Fantasía cortesana": "Courtly fantasy",
      "Fantasía costera": "Coastal fantasy",
      "Fantasía mítica": "Mythic fantasy"
    };
    const currentGenre = destination.searchParams.get("genre");
    if (currentGenre && genreNames[currentGenre]) destination.searchParams.set("genre", genreNames[currentGenre]);

    const languageLink = document.createElement("a");
    languageLink.className = "language-switch";
    languageLink.href = `${destination.pathname}${destination.search}${destination.hash}`;
    languageLink.textContent = copy.switchLanguage;
    languageLink.setAttribute("aria-label", language === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish");
    nav.append(languageLink);

    function setMenu(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? copy.closeMenu : copy.openMenu);
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
      setMenu(false);
      toggle.focus();
    });
    document.addEventListener("click", event => {
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setMenu(false);
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 700) setMenu(false);
    });
  }

  function setupHome() {
    const container = document.querySelector("#featured-reviews");
    if (!container) return;
    container.innerHTML = reviews.length
      ? reviews.slice(0, 4).map(cardTemplate).join("")
      : `<p class="empty-state">${copy.noStories}</p>`;
  }

  function setupReviewLibrary() {
    const grid = document.querySelector("#all-reviews");
    if (!grid) return;
    const search = document.querySelector("#review-search");
    const genre = document.querySelector("#genre-filter");
    const sort = document.querySelector("#review-sort");
    const empty = document.querySelector("#library-empty");
    const count = document.querySelector("#library-count");
    const random = document.querySelector("#random-review");
    const params = new URLSearchParams(window.location.search);
    if (!search || !genre || !sort || !empty || !count) return;

    [...new Set(reviews.map(review => review.category))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, language))
      .forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        genre.append(option);
      });

    const requestedGenre = params.get("genre");
    if (requestedGenre && [...genre.options].some(option => option.value === requestedGenre)) {
      genre.value = requestedGenre;
    }
    const requestedSort = params.get("sort");
    if (["featured", "score", "title"].includes(requestedSort)) sort.value = requestedSort;
    if (search && params.get("q")) search.value = params.get("q").slice(0, 100);

    function results() {
      const query = search.value.trim().toLocaleLowerCase();
      const matches = reviews.filter(review => {
        const matchesQuery = !query || searchableText(review).includes(query);
        return matchesQuery && (!genre.value || review.category === genre.value);
      });
      if (sort.value === "score") matches.sort((a, b) => scoreOf(b) - scoreOf(a));
      if (sort.value === "title") matches.sort((a, b) => a.title.localeCompare(b.title, language));
      return matches;
    }

    function syncUrl() {
      try {
        const url = new URL(window.location.href);
        if (search.value.trim()) url.searchParams.set("q", search.value.trim());
        else url.searchParams.delete("q");
        if (genre.value) url.searchParams.set("genre", genre.value);
        else url.searchParams.delete("genre");
        if (sort.value !== "featured") url.searchParams.set("sort", sort.value);
        else url.searchParams.delete("sort");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        // History can be restricted when the page is opened directly from disk.
      }
    }

    function render() {
      const visible = results();
      grid.innerHTML = visible.map(cardTemplate).join("");
      const noun = visible.length === 1 ? copy.reviews : copy.reviewsPlural;
      const status = visible.length === 1 ? copy.foundOne : copy.found;
      count.textContent = `${visible.length} ${noun} ${status}`;
      empty.hidden = visible.length !== 0;
      syncShelfButtons();
    }

    search?.addEventListener("input", () => {
      render();
      syncUrl();
    });
    genre.addEventListener("change", () => {
      render();
      syncUrl();
    });
    sort.addEventListener("change", () => {
      render();
      syncUrl();
    });
    random?.addEventListener("click", () => {
      const visible = results();
      if (!visible.length) {
        search?.focus();
        return;
      }
      const pick = visible[Math.floor(Math.random() * visible.length)];
      window.location.assign(`review.html?id=${encodeURIComponent(pick.id)}`);
    });

    render();
  }

  function setupReviewDetail() {
    const container = document.querySelector("#review-detail");
    if (!container) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const review = reviews.find(item => item.id === id);
    if (!review) {
      container.innerHTML = `
        <a class="detail-back" href="reviews.html">${copy.back}</a>
        <div class="not-found"><p class="eyebrow eyebrow-moss">${copy.missingEyebrow}</p><h1>${copy.missingTitle}</h1><p>${copy.missingCopy}</p><a class="button button-gold" href="reviews.html">${copy.browse}</a></div>`;
      return;
    }

    const title = escapeHTML(review.title);
    const idAttribute = escapeHTML(review.id);
    const score = scoreOf(review);
    const wordCount = `${review.body ?? ""} ${review.details ?? ""}`.trim().split(/\s+/).filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.round(wordCount / 200));
    const tags = Array.isArray(review.tags) ? review.tags : [];
    const related = reviews
      .filter(item => item.id !== review.id)
      .sort((a, b) => Number(b.category === review.category) - Number(a.category === review.category) || scoreOf(b) - scoreOf(a))
      .slice(0, 2);

    document.title = `${review.title} — Valinor Reviews`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", `${review.excerpt} ${review.verdict}`);

    container.innerHTML = `
      <a class="detail-back" href="reviews.html">${copy.back}</a>
      <div class="detail-layout">
        <figure class="detail-cover">
          <img src="${escapeHTML(review.image)}" alt="${escapeHTML(review.alt)}" decoding="async">
          <figcaption>${escapeHTML(review.category)}</figcaption>
        </figure>
        <article class="detail-content">
          <p class="eyebrow eyebrow-moss">${escapeHTML(review.category)} <span class="detail-dot">•</span> ${escapeHTML(review.date)}</p>
          <h1>${title}</h1>
          <p class="detail-author">${copy.bookBy} ${escapeHTML(review.author)}</p>
          <div class="detail-score">
            <span class="score-ring" style="--score:${score}%"><span class="score-inside"><span class="score-number">${leafIcon}<span>${score}</span></span><span class="score-label">${copy.council}</span></span></span>
            <span class="detail-score-caption">${copy.approved}</span>
          </div>
          <p class="detail-verdict">“${escapeHTML(review.verdict)}”</p>
          <div class="detail-copy"><p>${escapeHTML(review.body)}</p><p>${escapeHTML(review.details)}</p></div>
          <div class="detail-actions">
            <button class="button button-outline shelf-action" type="button" data-shelf-id="${idAttribute}" data-shelf-title="${title}" aria-pressed="false" aria-label="${copy.save}: ${title}">${bookmarkIcon}<span data-shelf-label>${copy.save}</span></button>
          </div>
          <div class="detail-meta"><span>${copy.independent}</span><span>${copy.noSpoilers}</span><span>${readingMinutes} ${copy.readTime}</span>${tags.map(tag => `<span>${escapeHTML(tag)}</span>`).join("")}</div>
        </article>
      </div>
      ${related.length ? `
      <section class="related-section">
        <div class="section-heading"><div><p class="eyebrow eyebrow-moss">${copy.keepWandering}</p><h2>${copy.anotherStory}</h2></div><a class="text-link" href="reviews.html">${copy.allReviews} <span aria-hidden="true">→</span></a></div>
        <div class="book-grid related-grid"></div>
      </section>` : ""}`;
    const relatedGrid = container.querySelector(".related-grid");
    if (relatedGrid) relatedGrid.innerHTML = related.map(cardTemplate).join("");
  }

  function setupShelfPage() {
    const grid = document.querySelector("#shelf-reviews");
    if (!grid) return null;
    const empty = document.querySelector("#shelf-empty");
    const count = document.querySelector("#shelf-count");

    function render() {
      const saved = readShelf().map(id => reviews.find(review => review.id === id)).filter(Boolean);
      grid.innerHTML = saved.map(cardTemplate).join("");
      if (empty) empty.hidden = saved.length !== 0;
      if (count) {
        if (!saved.length) {
          count.textContent = copy.shelfEmpty;
        } else {
          const noun = saved.length === 1 ? copy.reviews : copy.reviewsPlural;
          const status = saved.length === 1 ? copy.shelfSavedOne : copy.shelfSaved;
          count.textContent = `${saved.length} ${noun} ${status}`;
        }
      }
      syncShelfButtons();
    }

    render();
    window.addEventListener("storage", event => {
      if (event.key === SHELF_KEY) render();
    });
    return { render };
  }

  function setupNewsletter() {
    document.querySelectorAll("[data-newsletter]").forEach(form => {
      form.addEventListener("submit", event => {
        event.preventDefault();
        const email = form.querySelector('input[type="email"]');
        if (!email.checkValidity()) {
          email.reportValidity();
          return;
        }
        const message = form.parentElement?.querySelector(".form-message");
        if (message) message.textContent = copy.thanks;
        form.reset();
      });
    });
  }

  setupNavigation();
  setupHome();
  setupReviewLibrary();
  setupReviewDetail();
  const shelfPage = setupShelfPage();
  setupNewsletter();
  syncShelfButtons();

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-shelf-id]");
    if (!button) return;
    event.preventDefault();
    toggleShelf(button.dataset.shelfId);
    if (shelfPage) shelfPage.render();
    else syncShelfButtons();
  });
})();
