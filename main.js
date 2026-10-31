/* ============================================================
   Синапс. Скролл-анимации и интерактив.
   Всё на transform/opacity, слушатели скролла пассивные,
   обработка сгруппирована в один rAF-тик.
   ============================================================ */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const prefersReduced = () => reduceMotion.matches;

  /* ---------- Общий rAF-цикл для скролл-задач ---------- */

  const scrollTasks = [];
  let ticking = false;

  const runTasks = () => {
    ticking = false;
    scrollTasks.forEach((fn) => fn());
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(runTasks);
    }
  };

  window.addEventListener('scroll', requestTick, { passive: true });
  window.addEventListener('resize', requestTick, { passive: true });

  const clamp01 = (v) => Math.min(1, Math.max(0, v));

  /* ---------- Появление блоков ---------- */

  document.querySelectorAll('[data-stagger]').forEach((group) => {
    group.querySelectorAll('.reveal').forEach((child, i) => {
      child.style.transitionDelay = `${i * 90}ms`;
    });
  });

  const revealEls = document.querySelectorAll('.reveal, .fade-in');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -48px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Счётчики ---------- */

  const formatNumber = (value, decimals) =>
    new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count.replace(',', '.'));
    const decimals = parseInt(el.dataset.decimals || '0', 10);

    if (prefersReduced()) {
      el.textContent = formatNumber(target, decimals);
      return;
    }

    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const counters = document.querySelectorAll('[data-count]');

  if ('IntersectionObserver' in window) {
    const counterIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterIO.observe(el));
  }

  /* ---------- Манифест: проявление по словам ---------- */

  const statement = document.querySelector('.statement-text');

  if (statement && !prefersReduced()) {
    const words = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    const spans = words.map((word) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.textContent = word;
      span.style.opacity = '0.14';
      statement.appendChild(span);
      statement.appendChild(document.createTextNode(' '));
      return span;
    });

    const total = spans.length;

    scrollTasks.push(() => {
      const rect = statement.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = clamp01((vh * 0.9 - rect.top) / (rect.height + vh * 0.4));

      spans.forEach((span, i) => {
        const local = (progress - (i / total) * 0.72) / 0.28;
        span.style.opacity = clamp01(local) * 0.86 + 0.14;
      });
    });
  }

  /* ---------- Линия прогресса шагов ---------- */

  const stepsList = document.querySelector('.steps-list');
  const stepsFill = document.querySelector('.steps-progress-fill');

  if (stepsList && stepsFill && !prefersReduced()) {
    stepsFill.style.transform = 'scaleY(0)';

    scrollTasks.push(() => {
      const rect = stepsList.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = clamp01((vh * 0.72 - rect.top) / rect.height);
      stepsFill.style.transform = `scaleY(${progress})`;
    });
  }

  /* ---------- Параллакс ---------- */

  if (!prefersReduced()) {
    document.querySelectorAll('[data-parallax]').forEach((el) => {
      const speed = parseFloat(el.dataset.parallax) || 0.1;

      scrollTasks.push(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    });
  }

  /* ---------- Тень шапки при скролле ---------- */

  const nav = document.getElementById('nav');

  if (nav) {
    scrollTasks.push(() => {
      nav.classList.toggle('is-scrolled', window.scrollY > 24);
    });
  }

  /* ---------- Мобильное меню ---------- */

  const burger = document.querySelector('.burger');

  if (burger) {
    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
    };

    burger.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });

    document.querySelectorAll('.mobile-menu a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- FAQ ---------- */

  document.querySelectorAll('.faq-item').forEach((item) => {
    const button = item.querySelector('.faq-q');
    button.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      button.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Форма ---------- */

  const form = document.querySelector('.cta-form');

  if (form) {
    const input = form.querySelector('input[type="email"]');
    const note = form.querySelector('.cta-note');
    const button = form.querySelector('button[type="submit"]');
    const buttonLabel = button.querySelector('.btn-label');
    const defaultNote = note.textContent;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!input.value.trim() || !input.checkValidity()) {
        input.setAttribute('aria-invalid', 'true');
        note.textContent = 'Похоже, в адресе опечатка. Проверьте и попробуйте ещё раз.';
        input.focus();
        return;
      }

      input.removeAttribute('aria-invalid');
      note.textContent = defaultNote;
      button.disabled = true;
      button.classList.add('is-loading');
      buttonLabel.textContent = 'Отправляем…';

      setTimeout(() => {
        form.classList.add('is-done');
        const success = document.querySelector('.cta-success');
        success.hidden = false;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            success.classList.add('is-visible');
          });
        });
      }, 900);
    });
  }

  /* ---------- Год в подвале ---------- */

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Первый прогон ---------- */

  requestAnimationFrame(runTasks);
})();
