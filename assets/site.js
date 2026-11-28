// WENA — shared site behaviour (navigation, forms, homepage videos, store filters, video modal).
(function () {
  // Mobile navigation
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Formspree forms — submit without reloading and show an inline message.
  function wireForm(formId, statusId, successMsg) {
    var form = document.getElementById(formId);
    var status = document.getElementById(statusId);
    if (!form || !status) return;
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = 'Sending…'; }
      status.className = 'form-status show';
      status.textContent = '';
      try {
        var res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) {
          status.textContent = successMsg;
          status.className = 'form-status show success';
          form.reset();
        } else {
          status.textContent = 'Something went wrong. Please try again or email reachout@wena.co.in.';
          status.className = 'form-status show error';
        }
      } catch (err) {
        status.textContent = 'Network error. Please check your connection and try again.';
        status.className = 'form-status show error';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
      }
    });
  }
  wireForm('contactForm', 'contactStatus', 'Thank you! We will get back to you within 2 working days.');
  wireForm('partnerForm', 'partnerStatus', 'Thank you! We will get back to you with a partner introduction within 2 working days.');

  // Homepage "Continue Learning" videos — read from content/continue-learning.json (managed in the admin panel).
  function youTubeId(url) {
    if (!url) return null;
    var m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }
  async function videoCard(url) {
    var id = youTubeId(url);
    if (!id) return null;
    var watch = 'https://www.youtube.com/watch?v=' + id;
    var data = { title: 'Watch video', author: '', img: 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg', link: watch };
    try {
      var r = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(watch) + '&format=json');
      if (r.ok) { var j = await r.json(); data.title = j.title || data.title; data.author = j.author_name || ''; }
    } catch (e) { /* keep fallback title */ }
    return data;
  }
  async function renderVideos() {
    var grid = document.getElementById('clGrid');
    if (!grid) return;
    var urls = [];
    try {
      var r = await fetch('content/continue-learning.json');
      if (r.ok) {
        var j = await r.json();
        urls = [j.left, j.center, j.right].map(function (x) { return x && x.youtube_url; });
      }
    } catch (e) { /* no videos configured */ }
    var cards = (await Promise.all(urls.map(videoCard))).filter(Boolean);
    grid.innerHTML = '';
    cards.forEach(function (c) {
      var el = document.createElement('article');
      el.className = 'cl-card';
      var img = document.createElement('img');
      img.src = c.img; img.alt = ''; img.loading = 'lazy';
      var body = document.createElement('div');
      body.className = 'cl-body';
      var meta = document.createElement('div');
      meta.className = 'cl-meta';
      meta.textContent = 'Video' + (c.author ? ' · ' + c.author : '');
      var h = document.createElement('h4');
      h.textContent = c.title;
      var a = document.createElement('a');
      a.className = 'btn btn-outline';
      a.href = c.link; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = 'Watch now →';
      body.append(meta, h, a);
      el.append(img, body);
      grid.appendChild(el);
    });
    var section = document.getElementById('continue-learning');
    if (section && !cards.length) section.hidden = true;
  }
  renderVideos();

  // Store filters and cart counter
  var filterWrap = document.getElementById('filters');
  if (filterWrap) {
    var products = Array.prototype.slice.call(document.querySelectorAll('.product'));
    var countEl = document.getElementById('productCount');
    var cartEl = document.getElementById('cartCount');
    var noteEl = document.getElementById('cartNote');
    var cart = {};
    function apply(cat) {
      var shown = 0;
      products.forEach(function (p) {
        var on = cat === 'all' || p.dataset.cat === cat;
        p.hidden = !on;
        if (on) shown++;
      });
      if (countEl) countEl.textContent = shown + (shown === 1 ? ' product' : ' products');
      filterWrap.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.cat === cat ? 'true' : 'false');
      });
    }
    filterWrap.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { apply(b.dataset.cat); });
    });
    document.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () {
        cart[b.dataset.add] = true;
        b.textContent = 'Added';
        b.classList.remove('btn-blue');
        b.classList.add('btn-outline');
        if (cartEl) cartEl.textContent = Object.keys(cart).length;
        if (noteEl) { noteEl.hidden = false; noteEl.querySelector('strong').textContent = b.dataset.name; }
      });
    });
    apply('all');
  }

  // "Our Story" video
  var storyBtn = document.getElementById('ourStoryBtn');
  var modal = document.getElementById('storyModal');
  if (storyBtn && modal) {
    var frame = document.getElementById('storyFrame');
    var url = storyBtn.dataset.video;
    function close() { modal.classList.remove('open'); frame.src = ''; document.body.style.overflow = ''; }
    storyBtn.addEventListener('click', function () {
      frame.src = url + (url.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    modal.querySelectorAll('[data-close]').forEach(function (el) { el.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
  }
// Testimonials carousel — auto-scrolls, pausing on hover/touch/focus or when off-screen.
(function () {
var wrap = document.querySelector('.testi-carousel');
if (!wrap) return;
var track = wrap.querySelector('.grid');
var prev = wrap.querySelector('.testi-prev');
var next = wrap.querySelector('.testi-next');
if (!track || !prev || !next) return;
function cardStep() {
var card = track.querySelector('.testi');
if (!card) return 0;
var gap = parseFloat(getComputedStyle(track).gap) || 20;
return card.getBoundingClientRect().width + gap;
}
function atEnd() {
return track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
}
function updateArrows() {
var max = track.scrollWidth - track.clientWidth - 2;
prev.disabled = track.scrollLeft <= 2;
next.disabled = track.scrollLeft >= max;
}
function advance() {
if (atEnd()) { track.scrollTo({ left: 0, behavior: 'smooth' }); }
else { track.scrollBy({ left: cardStep(), behavior: 'smooth' }); }
}
prev.addEventListener('click', function () { track.scrollBy({ left: -cardStep(), behavior: 'smooth' }); restartAutoplay(); });
next.addEventListener('click', function () { advance(); restartAutoplay(); });
track.addEventListener('scroll', updateArrows);
window.addEventListener('resize', updateArrows);
updateArrows();

var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var timer = null;
var inView = false;
function startAutoplay() {
  if (reduceMotion || timer) return;
  timer = setInterval(function () { if (inView && !document.hidden) advance(); }, 4500);
}
function stopAutoplay() {
  if (timer) { clearInterval(timer); timer = null; }
}
function restartAutoplay() { stopAutoplay(); startAutoplay(); }
if (!reduceMotion) {
  wrap.addEventListener('mouseenter', stopAutoplay);
  wrap.addEventListener('mouseleave', startAutoplay);
  wrap.addEventListener('touchstart', stopAutoplay, { passive: true });
  wrap.addEventListener('focusin', stopAutoplay);
  wrap.addEventListener('focusout', startAutoplay);
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAutoplay(); else startAutoplay(); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inView = e.isIntersecting; });
    }, { threshold: 0.3 });
    io.observe(wrap);
  } else {
    inView = true;
  }
  startAutoplay();
}
// Exposed so a direct link to a single testimonial (see below) can permanently halt autoplay.
window.WENA_stopTestiAutoplay = function () { reduceMotion = true; stopAutoplay(); };
})();

// Direct-link testimonials — a share button on each card copies its own #testi-<name> URL;
// visiting that URL scrolls to, highlights, and stops the carousel on that one card.
(function () {
var wrap = document.querySelector('.testi-carousel');
if (!wrap) return;
var cards = Array.prototype.slice.call(wrap.querySelectorAll('.testi[id]'));
if (!cards.length) return;

function shareUrl(card) {
  return location.origin + location.pathname + '#' + card.id;
}
function showToast(btn) {
  var toast = btn.querySelector('.testi-share-toast');
  if (!toast) return;
  toast.textContent = 'Link copied';
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function () { toast.classList.remove('show'); }, 1800);
}
cards.forEach(function (card) {
  var btn = card.querySelector('.testi-share');
  if (!btn) return;
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var url = shareUrl(card);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { showToast(btn); }, function () { window.prompt('Copy this link to share:', url); });
    } else {
      window.prompt('Copy this link to share:', url);
    }
  });
});

function highlightCard(card) {
  if (window.WENA_stopTestiAutoplay) window.WENA_stopTestiAutoplay();
  card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'center' });
  card.classList.add('testi-highlight');
  setTimeout(function () { card.classList.remove('testi-highlight'); }, 2400);
}
function checkHash() {
  var id = decodeURIComponent(location.hash.replace('#', ''));
  if (!id) return;
  var card = document.getElementById(id);
  if (card && card.classList.contains('testi')) {
    setTimeout(function () { highlightCard(card); }, 350);
  }
}
checkHash();
window.addEventListener('hashchange', checkHash);
})();

// Animated stat counters — count up once when scrolled into view.
(function () {
var nums = document.querySelectorAll('.stats .num[data-count]');
if (!nums.length) return;
var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function animate(el) {
  var target = parseFloat(el.dataset.count) || 0;
  var suffix = el.dataset.suffix || '';
  var decimals = (el.dataset.count.split('.')[1] || '').length;
  if (reduceMotion) { el.textContent = target + suffix; return; }
  var start = null;
  var duration = 1400;
  function step(ts) {
    if (!start) start = ts;
    var p = Math.min((ts - start) / duration, 1);
    var eased = 1 - Math.pow(1 - p, 3);
    var val = target * eased;
    el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(step);
}
if ('IntersectionObserver' in window) {
  var seen = new WeakSet();
  var io2 = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && !seen.has(e.target)) {
        seen.add(e.target);
        animate(e.target);
      }
    });
  }, { threshold: 0.4 });
  nums.forEach(function (n) { io2.observe(n); });
} else {
  nums.forEach(animate);
}
})();

})();
