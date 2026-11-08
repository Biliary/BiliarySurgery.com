/* Biliary Surgery Mastery — renders every page from the JSON files in /content.
   Edit content in /content (or through Pages CMS); no code changes are needed. */
(function () {
  'use strict';

  var PAGE = document.body.getAttribute('data-page') || 'home';
  var NAV = [
    ['programmes', 'Programmes', 'programmes.html'],
    ['courses', 'Courses', 'courses.html'],
    ['library', 'Video library', 'library.html'],
    ['cases', 'Cases', 'cases.html'],
    ['membership', 'Membership', 'membership.html'],
    ['about', 'About', 'about.html']
  ];

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function paras(s) {
    return String(s || '').split(/\n\s*\n/).filter(function (p) { return p.trim(); })
      .map(function (p) { return '<p>' + esc(p.trim()).replace(/\n/g, '<br>') + '</p>'; }).join('');
  }
  function src(path) {
    if (!path) return '';
    if (/^(https?:)?\/\//.test(path) || path.indexOf('data:') === 0) return path;
    return path.replace(/^\/+/, '');
  }
  function load(name) {
    return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name + '.json ' + r.status);
      return r.json();
    });
  }
  function $(id) { return document.getElementById(id); }
  function list(a) { return Array.isArray(a) ? a : []; }
  function param(k) { return new URLSearchParams(location.search).get(k); }

  var DISC = '<div class="disc" aria-hidden="true"></div>';
  var PLAY = '<div class="play" aria-hidden="true"><svg width="14" height="16" viewBox="0 0 14 16"><path d="M2 1l11 7-11 7z" fill="#101E26"/></svg></div>';
  var ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
  function gradeClass(g) { var n = ROMAN[g] || 0; return n <= 2 ? 'gA' : n === 3 ? 'gB' : 'gC'; }

  /* ---------- video URLs ---------- */
  function videoInfo(url) {
    url = String(url || '').trim();
    if (!url) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return { kind: 'youtube', id: m[1] };
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/);
    if (m) {
      var h = m[2] || (url.match(/[?&]h=([\da-f]+)/) || [])[1];
      return { kind: 'vimeo', id: m[1], hash: h };
    }
    if (/\.(mp4|webm|m4v)(\?|$)/i.test(url)) return { kind: 'file', url: url };
    return { kind: 'iframe', url: url };
  }
  function embedHTML(info, startSec) {
    var s = startSec || 0;
    if (info.kind === 'youtube') {
      return '<iframe src="https://www.youtube-nocookie.com/embed/' + info.id + '?rel=0&modestbranding=1' +
        (s ? '&start=' + s + '&autoplay=1' : '') + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Operative video"></iframe>';
    }
    if (info.kind === 'vimeo') {
      return '<iframe src="https://player.vimeo.com/video/' + info.id + '?dnt=1' + (info.hash ? '&h=' + info.hash : '') +
        (s ? '&autoplay=1#t=' + s + 's' : '') + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Operative video"></iframe>';
    }
    if (info.kind === 'file') {
      return '<video src="' + esc(info.url) + (s ? '#t=' + s : '') + '" controls controlsList="nodownload" style="position:absolute;inset:0;width:100%;height:100%"' + (s ? ' autoplay' : '') + '></video>';
    }
    return '<iframe src="' + esc(info.url) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Operative video"></iframe>';
  }
  function thumbURL(v) {
    if (v.thumbnail) return src(v.thumbnail);
    var info = videoInfo(v.video_url);
    if (info && info.kind === 'youtube') return 'https://i.ytimg.com/vi/' + info.id + '/hqdefault.jpg';
    return '';
  }
  function toSeconds(t) {
    var p = String(t || '').trim().split(':').map(Number);
    if (p.some(isNaN)) return 0;
    return p.reduce(function (a, b) { return a * 60 + b; }, 0);
  }

  function vcard(v) {
    var t = thumbURL(v);
    var has = !!String(v.video_url || '').trim();
    return '<a class="vcard" href="video.html?id=' + encodeURIComponent(v.id) + '">' +
      '<div class="thumb">' + (t ? '<img src="' + esc(t) + '" alt="" loading="lazy">' : DISC) +
      (has ? PLAY : '') +
      (has ? (v.duration ? '<span class="dur">' + esc(v.duration) + '</span>' : '') : '<span class="soon">Coming soon</span>') +
      '</div><div class="vbody"><h4>' + esc(v.title) + '</h4><div class="vmeta">' +
      (v.grade ? '<span class="grade ' + gradeClass(v.grade) + '">Grade ' + esc(v.grade) + '</span>' : '') +
      (v.procedure ? '<span>' + esc(v.procedure) + '</span>' : '') +
      '</div></div></a>';
  }

  /* ---------- shell ---------- */
  function shell(site) {
    document.title = (PAGE === 'home' ? site.title + ' — ' + site.tagline : (document.title.split(' — ')[0] + ' — ' + site.title));
    var md = document.querySelector('meta[name="description"]');
    if (md && site.description) md.setAttribute('content', site.description);

    var nav = NAV.map(function (n) {
      return '<a class="navlink" href="' + n[2] + '"' + (n[0] === PAGE || (PAGE === 'video' && n[0] === 'library') ? ' aria-current="page"' : '') + '>' + n[1] + '</a>';
    }).join('');
    $('site-header').innerHTML =
      '<header class="mast"><div class="mast-in">' +
      '<a class="brand" href="./"><svg class="mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="none" stroke="var(--accent)" stroke-width="1.6"/><path d="M16 5c0 7 -7 9 -7 14a7 7 0 0 0 14 0c0-5-7-7-7-14z" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
      '<span><b>' + esc(site.title) + '</b><small>' + esc(site.tagline) + '</small></span></a>' +
      '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true"><path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" stroke-width="1.7"/></svg></button>' +
      '<nav class="main" id="nav">' + nav + '</nav></div></header>';
    $('burger').addEventListener('click', function () {
      var n = $('nav'); n.classList.toggle('open');
      this.setAttribute('aria-expanded', String(n.classList.contains('open')));
    });

    var contact = site.contact_email ? '<li><a href="mailto:' + esc(site.contact_email) + '">Contact</a></li>' : '';
    $('site-footer').innerHTML =
      '<footer class="foot"><div class="wrap"><div class="foot-grid">' +
      '<div><h5>' + esc(site.title) + '</h5><p style="font-size:14px;color:var(--muted);max-width:36ch">' + esc(site.description) + '</p></div>' +
      '<div><h5>Learn</h5><ul><li><a href="programmes.html">Programmes</a></li><li><a href="courses.html">Courses</a></li><li><a href="library.html">Video library</a></li><li><a href="cases.html">Interactive cases</a></li></ul></div>' +
      '<div><h5>About</h5><ul><li><a href="about.html">About</a></li><li><a href="membership.html">Membership</a></li>' + contact + '</ul></div>' +
      '</div><p class="copy">© ' + new Date().getFullYear() + ' ' + esc(site.title) + '. Operative content is for surgeons and surgical trainees.</p></div></footer>';
  }

  /* ---------- pages ---------- */
  var R = {};

  R.home = function (site) {
    return Promise.all([load('courses'), load('videos'), load('programmes'), load('cases')]).then(function (d) {
      var h = site.hero || {};
      $('hero').innerHTML =
        (h.image ? '<img class="hero-img" src="' + esc(src(h.image)) + '" alt="">' : '<div class="scope" aria-hidden="true"></div>') +
        '<div class="wrap"><p class="eyebrow">' + esc(h.eyebrow) + '</p><h1>' + esc(h.heading) + '</h1>' +
        '<p class="lede">' + esc(h.text) + '</p>' +
        '<div class="hero-cta"><a class="btn btn-pri" href="library.html">Browse the video library</a><a class="btn btn-ghost" href="programmes.html">Course programmes</a></div>' +
        '<div class="creds">' + list(site.credentials).map(function (c) {
          return '<div class="cred"><b>' + esc(c.value) + '</b><span>' + esc(c.label) + '</span></div>';
        }).join('') + '</div></div>';

      var up = list(d[2].items).filter(isUpcoming).slice(0, 3);
      $('home-programmes').innerHTML = up.length ? up.map(function (p) {
        return '<a class="card" href="programmes.html"><span class="status st-up">Upcoming</span><h3>' + esc(p.title) + '</h3>' +
          '<p class="datebadge">' + esc(dateLabel(p)) + '</p><p>' + esc([p.venue, p.location].filter(Boolean).join(', ')) + '</p></a>';
      }).join('') : '<p class="empty">New programmes will be listed here.</p>';

      $('home-courses').innerHTML = list(d[0].items).map(function (c, i) {
        return '<a class="card" href="courses.html"><p class="eyebrow">Course ' + String(i + 1).padStart(2, '0') + '</p><h3>' + esc(c.title) + '</h3><p>' + esc(c.summary) + '</p></a>';
      }).join('');

      var vids = list(d[1].items);
      var feat = vids.filter(function (v) { return v.show_on_home; });
      $('home-videos').innerHTML = (feat.length ? feat : vids).slice(0, 4).map(vcard).join('');

      var c = list(d[3].items)[0];
      if (c) {
        $('home-case').innerHTML = '<p class="eyebrow">Case preview</p><h3 style="font-size:19px;margin:8px 0 12px">' + esc(c.title) + '</h3>' +
          list(c.details).slice(0, 5).map(function (k) { return '<div class="kv"><span>' + esc(k.label) + '</span><b>' + esc(k.value) + '</b></div>'; }).join('');
      } else { $('home-case-sec').hidden = true; }

      $('home-gov').innerHTML = list(site.governance).map(function (g) {
        return '<div class="card"><h3 style="font-size:16px">' + esc(g.title) + '</h3><p>' + esc(g.text) + '</p></div>';
      }).join('');
    });
  };

  function parseDate(s) { if (!s) return null; var d = new Date(String(s).slice(0, 10) + 'T12:00:00'); return isNaN(d) ? null : d; }
  function isUpcoming(p) {
    var st = String(p.status || '').toLowerCase();
    if (st.indexOf('upcoming') === 0) return true;
    if (st.indexOf('past') === 0) return false;
    var end = parseDate(p.end_date) || parseDate(p.start_date);
    if (!end) return true;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    return end >= today;
  }
  function fmt(d, withYear) {
    return d.toLocaleDateString('en-GB', withYear ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long' });
  }
  function dateLabel(p) {
    if (p.date_note) return p.date_note;
    var a = parseDate(p.start_date), b = parseDate(p.end_date);
    if (!a) return 'Dates to be announced';
    if (!b || +a === +b) return fmt(a, true);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return a.getDate() + '–' + fmt(b, true);
    return fmt(a, a.getFullYear() !== b.getFullYear()) + ' – ' + fmt(b, true);
  }

  R.programmes = function () {
    return load('programmes').then(function (d) {
      $('prog-intro').textContent = d.intro || '';
      var items = list(d.items);
      var up = items.filter(isUpcoming).sort(function (a, b) { return (parseDate(a.start_date) || 9e15) - (parseDate(b.start_date) || 9e15); });
      var past = items.filter(function (p) { return !isUpcoming(p); }).sort(function (a, b) { return (parseDate(b.start_date) || 0) - (parseDate(a.start_date) || 0); });
      function block(p, upc) {
        var photos = list(p.photos).map(function (x) { return typeof x === 'string' ? x : (x && (x.image || x.src)); }).filter(Boolean);
        return '<article class="prog">' +
          '<div class="prog-cover">' + (p.cover ? '<img src="' + esc(src(p.cover)) + '" alt="' + esc(p.title) + '">' : (photos[0] ? '<img src="' + esc(src(photos[0])) + '" alt="">' : DISC)) + '</div>' +
          '<div class="prog-body"><span class="status ' + (upc ? 'st-up">Upcoming' : 'st-past">Past course') + '</span>' +
          '<h3>' + esc(p.title) + '</h3><p class="datebadge">' + esc(dateLabel(p)) + '</p>' +
          ((p.venue || p.location) ? '<p style="font-weight:600;font-size:15px">' + esc([p.venue, p.location].filter(Boolean).join(', ')) + '</p>' : '') +
          (p.description ? '<div class="prose" style="color:var(--muted);font-size:15px">' + paras(p.description) + '</div>' : '') +
          '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
          (p.programme_file ? '<a class="btn btn-ghost btn-sm" href="' + esc(src(p.programme_file)) + '" target="_blank" rel="noopener">Download programme</a>' : '') +
          (p.register_link && upc ? '<a class="btn btn-pri btn-sm" href="' + esc(p.register_link) + '" target="_blank" rel="noopener">Register</a>' : '') +
          '</div>' +
          (photos.length ? '<div class="gallery">' + photos.map(function (ph) {
            return '<button type="button" data-full="' + esc(src(ph)) + '"><img src="' + esc(src(ph)) + '" alt="Course photograph" loading="lazy"></button>';
          }).join('') + '</div>' : '') +
          '</div></article>';
      }
      $('prog-up').innerHTML = up.length ? up.map(function (p) { return block(p, true); }).join('') : '<p class="empty">No upcoming courses are listed at the moment.</p>';
      $('prog-past').innerHTML = past.length ? past.map(function (p) { return block(p, false); }).join('') : '<p class="empty">Past courses will appear here.</p>';
      document.addEventListener('click', function (e) {
        var b = e.target.closest('.gallery button'); if (!b) return;
        var lb = document.createElement('div'); lb.className = 'lightbox';
        lb.innerHTML = '<img src="' + b.getAttribute('data-full') + '" alt="Course photograph"><button type="button">Close</button>';
        lb.addEventListener('click', function () { lb.remove(); });
        document.body.appendChild(lb);
      });
    });
  };

  R.courses = function () {
    return load('courses').then(function (d) {
      $('course-list').innerHTML = list(d.items).map(function (c, i) {
        return '<div class="card">' + (c.image ? '<img src="' + esc(src(c.image)) + '" alt="" style="border-radius:8px;aspect-ratio:16/9;object-fit:cover;margin-bottom:6px">' : '') +
          '<p class="eyebrow">Course ' + String(i + 1).padStart(2, '0') + (c.length ? ' · ' + esc(c.length) : '') + '</p><h3>' + esc(c.title) + '</h3><p>' + esc(c.summary) + '</p></div>';
      }).join('');
    });
  };

  R.library = function () {
    return load('videos').then(function (d) {
      var vids = list(d.items);
      $('lib-intro').textContent = d.intro || '';
      var groups = [];
      vids.forEach(function (v) { if (v.group && groups.indexOf(v.group) < 0) groups.push(v.group); });
      var grades = ['I', 'II', 'III', 'IV', 'V'].filter(function (g) { return vids.some(function (v) { return v.grade === g; }); });
      var cat = 'all', gr = 'all';
      function chips(el, vals, key) {
        el.innerHTML = '<span class="flabel">' + (key === 'cat' ? 'Group' : 'Grade') + '</span>' +
          '<button class="chip" data-' + key + '="all" aria-pressed="true">' + (key === 'cat' ? 'All' : 'Any') + '</button>' +
          vals.map(function (v) { return '<button class="chip" data-' + key + '="' + esc(v) + '" aria-pressed="false">' + esc(v) + '</button>'; }).join('');
        el.addEventListener('click', function (e) {
          var b = e.target.closest('.chip'); if (!b) return;
          if (key === 'cat') cat = b.getAttribute('data-cat'); else gr = b.getAttribute('data-gr');
          el.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c === b)); });
          render();
        });
      }
      chips($('f-cat'), groups, 'cat');
      chips($('f-gr'), grades, 'gr');
      function render() {
        var out = vids.filter(function (v) { return (cat === 'all' || v.group === cat) && (gr === 'all' || v.grade === gr); });
        $('lib-grid').innerHTML = out.length ? out.map(vcard).join('') : '<p class="empty">No operations match that combination yet.</p>';
        $('lib-count').textContent = out.length + ' of ' + vids.length + ' operations';
      }
      var pre = param('group');
      if (pre) { var b = $('f-cat').querySelector('[data-cat="' + pre + '"]'); if (b) b.click(); else render(); } else render();
    });
  };

  R.video = function () {
    return load('videos').then(function (d) {
      var vids = list(d.items);
      var v = vids.filter(function (x) { return x.id === param('id'); })[0];
      if (!v) { $('video-main').innerHTML = '<p class="empty">That video could not be found. <a href="library.html">Back to the library</a>.</p>'; return; }
      document.title = v.title + ' — ' + document.title.split(' — ').pop();
      var info = videoInfo(v.video_url);
      var player = $('player');
      player.innerHTML = info ? embedHTML(info) : DISC + '<span class="msg">Video coming soon</span>';
      $('v-grade').innerHTML = v.grade ? '<span class="grade ' + gradeClass(v.grade) + '">Nassar Grade ' + esc(v.grade) + '</span>' : '';
      $('v-proc').textContent = [v.procedure, v.duration].filter(Boolean).join(' · ');
      $('v-title').textContent = v.title;
      $('v-desc').innerHTML = paras(v.description);

      var ch = list(v.chapters);
      $('v-chapters-panel').hidden = !ch.length;
      $('v-chapters').innerHTML = ch.map(function (c) {
        return '<button class="chap" data-t="' + toSeconds(c.time) + '"><time>' + esc(c.time) + '</time><span>' + esc(c.title) + '</span></button>';
      }).join('');
      $('v-chapters').addEventListener('click', function (e) {
        var b = e.target.closest('.chap'); if (!b || !info) return;
        player.innerHTML = embedHTML(info, +b.getAttribute('data-t'));
        player.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      var rows = [['Difficulty grade', v.grade ? 'Nassar Grade ' + v.grade : ''], ['Group', v.group], ['Procedure', v.procedure], ['Duration', v.duration], ['Course', v.course]]
        .filter(function (r) { return r[1]; });
      $('v-detail').innerHTML = '<h3>Case detail</h3>' + rows.map(function (r) { return '<div class="kv"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');

      var tp = list(v.teaching_points);
      $('v-tp-panel').hidden = !tp.length;
      $('v-tp').innerHTML = tp.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('');

      var more = vids.filter(function (x) { return x !== v && x.group === v.group; }).slice(0, 3);
      $('v-more').innerHTML = more.map(function (x) {
        return '<a href="video.html?id=' + encodeURIComponent(x.id) + '" class="kv" style="text-decoration:none"><span style="color:var(--fg)">' + esc(x.title) + '</span><b>' + (x.grade ? 'Gr ' + esc(x.grade) : '') + '</b></a>';
      }).join('') || '<p class="empty">More operations coming soon.</p>';
    });
  };

  R.cases = function () {
    return load('cases').then(function (d) {
      var c = list(d.items)[0];
      if (!c) { $('case-main').innerHTML = '<p class="empty">Interactive cases are being prepared.</p>'; return; }
      $('c-title').textContent = c.title;
      $('c-details').innerHTML = '<h3>Clinical information</h3>' + list(c.details).map(function (k) { return '<div class="kv"><span>' + esc(k.label) + '</span><b>' + esc(k.value) + '</b></div>'; }).join('');
      $('c-q').textContent = c.question;
      var opts = list(c.options);
      $('c-opts').innerHTML = opts.map(function (o, i) {
        return '<button class="opt" data-i="' + i + '"><span class="key">' + 'ABCDEFG'[i] + '</span><span>' + esc(o.text) + '</span></button>';
      }).join('');
      $('c-opts').addEventListener('click', function (e) {
        var b = e.target.closest('.opt'); if (!b) return;
        var o = opts[+b.getAttribute('data-i')];
        $('c-opts').querySelectorAll('.opt').forEach(function (x) { x.removeAttribute('data-state'); });
        b.setAttribute('data-state', o.correct ? 'right' : 'wrong');
        var v = $('c-verdict');
        v.className = 'verdict ' + (o.correct ? 'ok' : 'no');
        v.innerHTML = '<b>' + esc(o.verdict) + '</b>' + paras(o.explanation) +
          (c.video_id ? '<a class="btn btn-sm ' + (o.correct ? 'btn-pri' : 'btn-ghost') + '" style="align-self:flex-start;margin-top:4px" href="video.html?id=' + encodeURIComponent(c.video_id) + '">Watch this step in theatre</a>' : '');
        v.hidden = false;
      });
    });
  };

  R.membership = function () {
    return load('membership').then(function (d) {
      $('m-intro').textContent = d.intro || '';
      $('m-tiers').innerHTML = list(d.tiers).map(function (t) {
        return '<div class="tier' + (t.featured ? ' feature' : '') + '"><p class="eyebrow"' + (t.featured ? ' style="color:var(--accent)"' : '') + '>' + esc(t.name) + '</p>' +
          '<div class="price">' + (t.price ? esc(t.price) + (t.period ? ' <small>' + esc(t.period) + '</small>' : '') : '<small style="font-size:16px">Price to be announced</small>') + '</div>' +
          '<ul>' + list(t.features).map(function (f) { return '<li><span class="tick">✓</span>' + esc(f) + '</li>'; }).join('') + '</ul></div>';
      }).join('');
      $('m-note').textContent = d.note || '';
      $('m-note').hidden = !d.note;
    });
  };

  R.about = function () {
    return load('about').then(function (a) {
      $('a-name').textContent = a.name;
      $('a-role').textContent = a.role;
      $('a-photo').innerHTML = a.photo ? '<img class="portrait" src="' + esc(src(a.photo)) + '" alt="' + esc(a.name) + '">' : '';
      $('a-photo').hidden = !a.photo;
      $('a-int').innerHTML = list(a.interests).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      $('a-tr').innerHTML = list(a.training).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      $('a-app').innerHTML = '<h3>Appointments</h3>' + list(a.appointments).map(function (k) { return '<div class="kv"><span>' + esc(k.label) + '</span><b>' + esc(k.value) + '</b></div>'; }).join('');
      if (a.mycourse_url) $('a-mc').setAttribute('href', a.mycourse_url); else $('a-mc-panel').hidden = true;
    });
  };

  load('site').then(function (site) {
    shell(site);
    return (R[PAGE] || function () {})(site);
  }).catch(function (err) {
    console.error(err);
    var m = document.querySelector('main');
    if (m) m.insertAdjacentHTML('afterbegin', '<div class="wrap note" style="margin-top:24px">Some content could not be loaded. Please refresh the page.</div>');
  });
})();
