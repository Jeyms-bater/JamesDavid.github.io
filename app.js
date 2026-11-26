/* ==========================================================
   Supercar World — app.js
   1. Dark / light mode toggle
   2. Hero showroom (rotating featured cars)
   3. Brand filter
   4. Car detail pop-up
   5. Brand logo fallback
   ========================================================== */

(function () {
  "use strict";

  var root = document.documentElement;

  /* ---------- 1. Dark / light mode ---------- */
  var themeButton = document.getElementById("theme-toggle");
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  // Read a saved choice; storage can be blocked, so always guard it.
  function savedTheme() {
    try { return localStorage.getItem("sw-theme"); } catch (e) { return null; }
  }
  function saveTheme(value) {
    try { localStorage.setItem("sw-theme", value); } catch (e) { /* ignore */ }
  }

  // Apply a theme and keep the button label in sync.
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var isDark = theme === "dark";
    themeButton.setAttribute("aria-pressed", String(isDark));
    themeButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }

  // Start with the saved choice, otherwise follow the device setting.
  applyTheme(savedTheme() || (darkQuery.matches ? "dark" : "light"));

  themeButton.addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    saveTheme(next);
  });

  /* ---------- 2. Hero showroom ---------- */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".dot"));
  var stageName = document.getElementById("stage-name");
  var stageYear = document.getElementById("stage-year");
  var stage = document.querySelector(".stage");
  var current = 0;
  var timer = null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Show slide number i and update the caption and dots.
  function showSlide(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle("is-active", n === current); });
    dots.forEach(function (d, n) {
      if (n === current) { d.setAttribute("aria-current", "true"); }
      else { d.removeAttribute("aria-current"); }
    });
    stageName.textContent = slides[current].dataset.name;
    stageYear.textContent = slides[current].dataset.year;
  }

  function startRotation() {
    if (reduceMotion || timer) return;
    timer = setInterval(function () { showSlide(current + 1); }, 5500);
  }
  function stopRotation() { clearInterval(timer); timer = null; }

  dots.forEach(function (d, n) {
    d.addEventListener("click", function () { showSlide(n); });
  });

  // Pause while the visitor is pointing at or focusing the stage.
  stage.addEventListener("mouseenter", stopRotation);
  stage.addEventListener("mouseleave", startRotation);
  stage.addEventListener("focusin", stopRotation);
  stage.addEventListener("focusout", startRotation);

  showSlide(0);
  startRotation();

  /* ---------- 3. Brand filter ---------- */
  var chips = Array.prototype.slice.call(document.querySelectorAll(".brand-tab"));
  var brands = Array.prototype.slice.call(document.querySelectorAll(".brand"));
  var status = document.getElementById("filter-status");

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var wanted = chip.dataset.filter;
      var carCount = 0;

      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });

      brands.forEach(function (b) {
        var show = wanted === "all" || b.dataset.brand === wanted;
        b.hidden = !show;
        if (show) carCount += b.querySelectorAll(".car").length;
      });

      // Announce the result for screen readers
      status.textContent = wanted === "all"
        ? "Showing all " + carCount + " cars."
        : "Showing " + carCount + " cars from " + chip.querySelector(".tab-name").textContent.trim() + ".";
    });
  });

  /* ---------- 4. Car detail pop-up ---------- */
  var dialog = document.getElementById("car-dialog");
  var dialogImg = document.getElementById("dialog-img");
  var dialogName = document.getElementById("dialog-name");
  var dialogMeta = document.getElementById("dialog-meta");
  var dialogText = document.getElementById("dialog-text");
  var dialogSpecs = document.getElementById("dialog-specs");
  var dialogPrices = document.getElementById("dialog-prices");
  var dialogBody = dialog.querySelector(".dialog-body");

  // Fill the dialog from the clicked car card and open it.
  function openCar(card) {
    var img = card.querySelector("img");
    var brand = card.closest(".brand");
    dialogImg.src = img.currentSrc || img.src;
    dialogImg.alt = img.alt;
    dialogName.textContent = card.querySelector("h4").dataset.full;
    dialogMeta.textContent = brand.querySelector("h3").textContent + ", " +
      card.querySelector(".car-year").textContent;
    dialogText.textContent = card.querySelector(".car-body > p").textContent;
    // specs: engine first, then the three numbers shown on the card
    dialogSpecs.innerHTML = "<div><dt>Engine</dt><dd>" + card.querySelector("h4").dataset.engine + "</dd></div>" +
      card.querySelector(".specs").innerHTML;
    dialogPrices.innerHTML = card.querySelector(".prices").innerHTML;
    dialogBody.style.setProperty("--c", brand.style.getPropertyValue("--c"));
    if (typeof dialog.showModal === "function") { dialog.showModal(); }
    else { dialog.setAttribute("open", ""); }
  }

  document.querySelectorAll(".car-more").forEach(function (btn) {
    btn.addEventListener("click", function () { openCar(btn.closest(".car")); });
  });

  dialog.querySelector(".dialog-close").addEventListener("click", function () { dialog.close(); });

  // Clicking the dark area outside the box closes it
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });

  /* ---------- 5. Brand logo fallback ---------- */
  // If a logo file is missing, show a simple gold initial instead.
  document.querySelectorAll(".brand-tab .tab-logo img").forEach(function (img) {
    var tab = img.closest(".brand-tab");
    function missing() { img.remove(); tab.classList.add("no-logo"); }
    if (img.complete && img.naturalWidth === 0) { missing(); }
    else { img.addEventListener("error", missing, { once: true }); }
  });
})();
