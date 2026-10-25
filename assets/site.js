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
})();
