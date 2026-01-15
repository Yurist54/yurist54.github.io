
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

// Mobile menu
const burger = $("#burger");
const mobileMenu = $("#mobileMenu");
if (burger && mobileMenu) {
  burger.addEventListener("click", () => {
    const isOpen = burger.getAttribute("aria-expanded") === "true";
    burger.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.hidden = isOpen;
  });
  $$("#mobileMenu a").forEach(a => a.addEventListener("click", () => {
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.hidden = true;
  }));
}

// Reveal
const revealEls = $$(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
} else {
  revealEls.forEach(el => el.classList.add("is-in"));
}

// Slider
class Slider {
  constructor(root, { interval = 6000 } = {}) {
    this.root = root;
    this.track = $(".slider__track", root);
    this.slides = $$(".slider__track > *", root);
    this.dots = $(".slider__dots", root);
    this.prevBtn = $("[data-prev]", root);
    this.nextBtn = $("[data-next]", root);
    this.tabs = $$("[data-slide-to]", root);
    this.index = 0;

    this.interval = interval;
    this.timer = null;
    this.isHover = false;

    this.init();
  }

  init() {
    if (!this.track || this.slides.length === 0) return;

    if (this.dots) {
      this.dots.innerHTML = "";
      this.dotBtns = this.slides.map((_, i) => {
        const b = document.createElement("button");
        b.className = "dotbtn" + (i === 0 ? " is-active" : "");
        b.type = "button";
        b.setAttribute("aria-label", `Слайд ${i + 1}`);
        b.addEventListener("click", () => this.go(i, true));
        this.dots.appendChild(b);
        return b;
      });
    } else {
      this.dotBtns = [];
    }

    this.prevBtn?.addEventListener("click", () => this.prev(true));
    this.nextBtn?.addEventListener("click", () => this.next(true));

    this.tabs.forEach(btn => {
      btn.addEventListener("click", () => {
        const to = Number(btn.dataset.slideTo || 0);
        this.go(to, true);
      });
    });

    this.root.addEventListener("mouseenter", () => { this.isHover = true; this.stop(); });
    this.root.addEventListener("mouseleave", () => { this.isHover = false; this.start(); });

    let startX = 0, dx = 0;
    this.root.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
      dx = 0;
    }, { passive: true });
    this.root.addEventListener("touchmove", (e) => {
      dx = e.touches[0].clientX - startX;
    }, { passive: true });
    this.root.addEventListener("touchend", () => {
      if (Math.abs(dx) > 40) dx < 0 ? this.next(true) : this.prev(true);
      startX = 0; dx = 0;
    });

    this.update();
    this.start();
  }

  start() {
    this.stop();
    this.timer = window.setInterval(() => {
      if (!this.isHover) this.next(false);
    }, this.interval);
  }

  stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  go(i, userAction = false) {
    this.index = clamp(i, 0, this.slides.length - 1);
    this.update();
    if (userAction) this.start();
  }

  next(userAction = false) {
    const i = (this.index + 1) % this.slides.length;
    this.go(i, userAction);
  }

  prev(userAction = false) {
    const i = (this.index - 1 + this.slides.length) % this.slides.length;
    this.go(i, userAction);
  }

  update() {
    const x = -this.index * 100;
    this.track.style.transform = `translateX(${x}%)`;
    this.dotBtns.forEach((b, i) => b.classList.toggle("is-active", i === this.index));
    this.tabs.forEach((t) => {
      const to = Number(t.dataset.slideTo || 0);
      t.classList.toggle("is-active", to === this.index);
      t.setAttribute("aria-selected", String(to === this.index));
    });
  }
}

$$("[data-slider]").forEach(el => {
  const name = el.dataset.slider;
  const interval = name === "services" ? 7200 : 6200;
  new Slider(el, { interval });
});

// Lead form: mailto (no backend)
const leadForm = $("#leadForm");
const formHint = $("#formHint");
if (leadForm) {
  leadForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(leadForm);
    const name = (fd.get("name") || "").toString().trim();
    const phone = (fd.get("phone") || "").toString().trim();
    const topic = (fd.get("topic") || "").toString().trim();
    const message = (fd.get("message") || "").toString().trim();

    const to = "sergeev.aleksandr84@yandex.ru";
    const subject = `Заявка: ${topic}`;
    const body =
`Имя: ${name}
Телефон: ${phone}
Тема: ${topic}

Описание:
${message}

(Отправлено с сайта)`;

    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    if (formHint) formHint.textContent = "Открываю почту для отправки…";
    window.location.href = mailto;

    leadForm.reset();
    setTimeout(() => {
      if (formHint) formHint.textContent = "После отправки откроется письмо для связи.";
    }, 1400);
  });
}

// Footer year
const y = $("#year");
if (y) y.textContent = String(new Date().getFullYear());

// Pause ticker on hover
$$("[data-ticker]").forEach(t => {
  t.addEventListener("mouseenter", () => {
    const track = $(".ticker__track", t);
    if (track) track.style.animationPlayState = "paused";
  });
  t.addEventListener("mouseleave", () => {
    const track = $(".ticker__track", t);
    if (track) track.style.animationPlayState = "running";
  });
});


// ==========================
// Phone fallback for desktop (tel: may do nothing)
// ==========================
function isMobileDevice(){
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

function copyToClipboard(text){
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  return Promise.resolve();
}

document.querySelectorAll('a[href^="tel:"], a[data-phone]').forEach((a) => {
  a.addEventListener("click", async (e) => {
    const num = a.getAttribute("data-phone") || "+79137601733";
    // On mobile: allow default behavior (open dialer)
    if (isMobileDevice()) return;

    // On desktop: show modal with copy button
    e.preventDefault();

    const html = `
      <p style="margin-top:0">Телефон для связи:</p>
      <p style="font-size:1.35rem;font-weight:950;letter-spacing:-0.02em;margin:10px 0 14px">+79137601733</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn--primary" id="copyPhoneBtn" type="button">Скопировать</button>
        <a class="btn btn--ghost" href="mailto:sergeev.aleksandr84@yandex.ru">Написать на email</a>
      </div>
      <p style="color:rgba(255,255,255,.60);font-weight:650;margin-top:12px">
        На компьютере звонок может не запускаться без настроенного приложения. Номер можно скопировать и набрать с телефона.
      </p>
    `;

    openModal("Связь по телефону", html);

    const btn = document.getElementById("copyPhoneBtn");
    if (btn) {
      btn.addEventListener("click", async () => {
        try {
          await copyToClipboard(num);
          btn.textContent = "Скопировано";
          setTimeout(() => btn.textContent = "Скопировать", 1200);
        } catch (err) {
          btn.textContent = "Не удалось";
          setTimeout(() => btn.textContent = "Скопировать", 1200);
        }
      });
    }
  });
});


// ==========================
// Scroll to top (reliable)
// ==========================
document.querySelectorAll('a[href="#top"], .toTop').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
