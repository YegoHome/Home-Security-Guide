/* Home Security Guide — shared page-turning + interactive helpers */
(function () {
  'use strict';

  /* ---------- The Key Ring: one shared glossary for all five parts ---------- */
  var KEY_RING = [
    ['Your home', 'Your Windows 11 computer.'],
    ['Door (port)', 'A numbered entrance on your computer, such as door 445. Programs use doors to accept connections.'],
    ['Open door (LISTENING)', 'A door that is open and waiting. Anyone who can reach it can walk up and try to come in.'],
    ['Mail slot (UDP endpoint)', 'A different kind of opening that accepts messages without a conversation first. UDP slots never show the word LISTENING.'],
    ['Inside door (127.0.0.1 or ::1)', 'A door that only connects rooms inside your own home. Other devices cannot reach it.'],
    ['Door on every side (0.0.0.0 or ::)', 'The program accepts visitors from every network your computer is connected to. Only your locks decide who gets through.'],
    ['Lock (firewall block rule)', 'A rule you add in Windows Defender Firewall that stops visitors from other devices reaching a door. We name every lock starting with "Lock - ".'],
    ['Household key (Local subnet scope)', 'An exception that lets only devices on your own home network through a door, while strangers stay out.'],
    ['House type (network profile)', 'How Windows treats the network you are on: Public (hidden from other devices) or Private (discoverable, used for file and printer sharing).'],
    ['Security desk', 'The Windows Defender Firewall with Advanced Security window (wf.msc), where locks are installed and removed.'],
    ['Visitor pass (standard Terminal)', 'A normal PowerShell or Terminal window. Good for looking around. It cannot change security settings.'],
    ['Master keys (Terminal (Admin))', 'An administrator window. Needed only when you change locks or settings. Close it as soon as you are done.'],
    ['Closing the gate', 'Typing exit to close any PowerShell or Terminal window when you finish.'],
    ['Guest room (virtual machine)', 'A separate computer running inside your computer, such as a Hyper-V or VirtualBox virtual machine. It has its own doors and needs its own locks.'],
    ['Hallway (port forwarding rule)', 'A path that leads visitors from one of your outside doors straight to a guest room door. Every hallway is an open path until you remove it.'],
    ['Sealed wing (private network segment)', 'A virtual network that only your guest rooms share (Hyper-V Private switch or VirtualBox Internal Network). The safest place for testing.'],
    ['Firmware door', 'A door handled by your computer\u2019s built-in hardware management (Intel AMT) before Windows sees the visitor. Windows locks may not cover it.'],
    ['Sealed envelope (TLS encryption)', 'Protects what is said through an open door so nobody in between can read or change it.'],
    ['Postcard (unencrypted traffic)', 'A message anyone along the way could read.'],
    ['ID badge (certificate)', 'Proof that the computer answering really is the one you meant to reach.'],
    ['ID check at the gate (Network Level Authentication)', 'Remote Desktop visitors must prove who they are before the door even opens.'],
    ['Patrol (audit)', 'A regular, read-only walk through your home that writes what it finds into a logbook.'],
    ['Logbook (patrol log file)', 'A dated text file the patrol saves, so you can compare this month with last month.'],
    ['Temporary test door (TEMP rule)', 'A short-lived opening for testing. Named "TEMP - ", used only in the sealed wing or on your home network, and removed the same day.']
  ];

  var state = { page: 0, pages: [], path: null };
  var toastEl;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* The chosen path travels between parts in the page address (?path=A or ?path=B). */
  function readPath() { var m = /[?&]path=([AB])\b/.exec(location.search); return m ? m[1] : null; }
  function carryPath(p) {
    $all('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!/^(index|part[1-5])\.html/.test(h)) return;
      var parts = h.split('#'); var base = parts[0].replace(/[?&]path=[AB]/, '');
      a.setAttribute('href', base + (base.indexOf('?') < 0 ? '?' : '&') + 'path=' + p + (parts[1] ? '#' + parts[1] : ''));
    });
    try { history.replaceState(null, '', location.pathname + '?path=' + p + location.hash); } catch (e) { /* ignore */ }
  }

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
  }

  function copyText(text) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      toast(ok ? 'Copied' : 'Select the text and press Ctrl + C');
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, fallback);
      } else { fallback(); }
    } catch (e) { fallback(); }
  }

  /* ---------- Pages ---------- */
  function show(i, focus) {
    var pages = state.pages; if (!pages.length) return;
    i = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach(function (p) { p.classList.remove('active', 'shown'); p.setAttribute('aria-hidden', 'true'); });
    var el = pages[i]; state.page = i;
    el.classList.add('active'); el.removeAttribute('aria-hidden');
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('shown'); }); });
    var bar = $('.progress > span'); if (bar) bar.style.width = ((i + 1) / pages.length * 100) + '%';
    var pr = $('.progress'); if (pr) pr.setAttribute('aria-valuenow', String(i + 1));
    if (focus) {
      try { history.replaceState(null, '', location.pathname + location.search + '#page-' + (i + 1)); } catch (e) { /* ignore */ }
      var h = $('h1', el); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  function next() { show(state.page + 1, true); }
  function prev() { show(state.page - 1, true); }

  function buildPages() {
    var book = $('.book-container'); if (!book) return;
    state.pages = $all('.book-page', book);
    var total = state.pages.length;
    var nextHref = book.getAttribute('data-next-href');
    var nextLabel = book.getAttribute('data-next-label') || 'Continue';

    var bar = document.createElement('div');
    bar.className = 'progress'; bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-label', 'Pages read'); bar.setAttribute('aria-valuemin', '1'); bar.setAttribute('aria-valuemax', String(total));
    bar.appendChild(document.createElement('span'));
    book.insertBefore(bar, book.firstChild);

    state.pages.forEach(function (p, idx) {
      p.id = p.id || ('page-' + (idx + 1));
      if (!p.hasAttribute('data-nonav')) {
        var nav = document.createElement('div'); nav.className = 'nav-buttons';
        var back = document.createElement('button'); back.className = 'btn secondary'; back.type = 'button';
        back.textContent = '\u2190 Back'; back.addEventListener('click', prev);
        if (idx === 0) back.disabled = true;
        nav.appendChild(back);
        if (idx < total - 1) {
          var fwd = document.createElement('button'); fwd.className = 'btn'; fwd.type = 'button';
          fwd.textContent = 'Continue \u2192'; fwd.addEventListener('click', next);
          nav.appendChild(fwd);
        } else if (nextHref) {
          var a = document.createElement('a'); a.className = 'btn'; a.href = nextHref; a.textContent = nextLabel + ' \u2192';
          nav.appendChild(a);
        }
        p.appendChild(nav);
      }
      var num = document.createElement('p'); num.className = 'page-number';
      var cur = document.querySelector('.part-dots a[aria-current="page"]');
      num.textContent = (cur ? 'Part ' + cur.textContent.trim() : 'Welcome') + ' \u00b7 Page ' + (idx + 1) + ' of ' + total;
      p.appendChild(num);
    });

    $all('[data-action="next"]').forEach(function (b) { b.addEventListener('click', next); });
    $all('[data-action="first"]').forEach(function (b) { b.addEventListener('click', function () { show(0, true); }); });
    $all('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(b.getAttribute('data-goto'));
        var idx = state.pages.indexOf(target); if (idx >= 0) show(idx, true);
      });
    });

    var start = 0;
    var m = /^#page-(\d+)$/.exec(window.location.hash || '');
    if (m) start = Math.min(total - 1, Math.max(0, parseInt(m[1], 10) - 1));
    show(start, false);
    window.addEventListener('hashchange', function () {
      var h = /^#page-(\d+)$/.exec(window.location.hash || '');
      if (h) show(parseInt(h[1], 10) - 1, true);
    });

    document.addEventListener('keydown', function (e) {
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      var dlg = $('dialog.keyring'); if (dlg && dlg.open) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });
  }

  /* ---------- Code blocks ---------- */
  function buildCode() {
    $all('.code').forEach(function (box) {
      var pre = $('pre', box); if (!pre) return;
      var row = document.createElement('div'); row.className = 'label';
      var name = document.createElement('span'); name.textContent = box.getAttribute('data-label') || 'PowerShell';
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'copy-btn'; btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy ' + name.textContent + ' command');
      btn.addEventListener('click', function () { copyText(pre.textContent.replace(/\s+$/, '')); });
      row.appendChild(name); row.appendChild(btn);
      box.insertBefore(row, pre);
      pre.setAttribute('tabindex', '0');
    });
  }

  /* ---------- Key Ring dialog ---------- */
  function buildKeyRing() {
    var dlg = document.createElement('dialog'); dlg.className = 'keyring'; dlg.setAttribute('aria-labelledby', 'kr-title');
    var html = '<div class="inner"><h2 id="kr-title">The Key Ring</h2>' +
      '<p>Every term in this guide means the same thing in all five parts.</p><dl>';
    KEY_RING.forEach(function (k) { html += '<dt>' + k[0] + '</dt><dd>' + k[1] + '</dd>'; });
    html += '</dl><div class="close-row"><button type="button" class="btn" data-close>Close</button></div></div>';
    dlg.innerHTML = html; document.body.appendChild(dlg);
    $('[data-close]', dlg).addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    $all('.keyring-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
      });
    });
    var inline = $('#keyring-inline');
    if (inline) {
      var dl = document.createElement('dl'); dl.className = 'inline-keyring';
      KEY_RING.forEach(function (k) {
        var dt = document.createElement('dt'); dt.textContent = k[0];
        var dd = document.createElement('dd'); dd.textContent = k[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
      inline.appendChild(dl);
    }
  }

  /* ---------- Sharing path (Path A / Path B) ---------- */
  function setPath(p, announce) {
    state.path = p; document.body.setAttribute('data-path', p); carryPath(p);
    $all('.choice[data-path]').forEach(function (c) { c.setAttribute('aria-pressed', c.getAttribute('data-path') === p ? 'true' : 'false'); });
    $all('[data-path-label]').forEach(function (s) { s.textContent = p === 'A' ? 'Path A (I do not share files or printers from this PC)' : 'Path B (I share files or printers from this PC)'; });
    if (announce) toast(p === 'A' ? 'Path A selected' : 'Path B selected');
  }
  function buildChooser() {
    $all('.choice[data-path]').forEach(function (c) {
      c.addEventListener('click', function () { setPath(c.getAttribute('data-path'), true); });
    });
    var saved = readPath(); if (saved === 'A' || saved === 'B') setPath(saved, false);
  }

  /* ---------- Checklists ---------- */
  function buildChecklists() {
    $all('.checklist').forEach(function (list) {
      var boxes = $all('input[type="checkbox"]', list);
      var out = list.previousElementSibling && list.previousElementSibling.classList.contains('check-progress') ? list.previousElementSibling : null;
      function update() {
        var n = 0;
        boxes.forEach(function (b) { b.closest('li').classList.toggle('done', b.checked); if (b.checked) n++; });
        if (out) out.textContent = n + ' of ' + boxes.length + ' checks done' + (n === boxes.length ? ' \u2014 patrol complete.' : '');
      }
      boxes.forEach(function (b) { b.addEventListener('change', update); });
      var reset = list.parentNode.querySelector('[data-reset="' + list.id + '"]');
      if (reset) reset.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); update(); });
      update();
    });
  }

  /* ---------- Hallway log (Part 3) ---------- */
  function buildLog() {
    var form = $('#hallway-form'); if (!form) return;
    var body = $('#hallway-rows'); var rows = [];
    function render() {
      body.innerHTML = '';
      if (!rows.length) { body.innerHTML = '<tr class="empty-row"><td colspan="6">No hallways recorded yet.</td></tr>'; return; }
      rows.forEach(function (r, i) {
        var tr = document.createElement('tr');
        [r.room, r.tool, r.outside, r.inside, r.decision].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
        var td = document.createElement('td'); var b = document.createElement('button'); b.type = 'button'; b.className = 'row-del'; b.textContent = 'Remove';
        b.setAttribute('aria-label', 'Remove row for ' + r.room);
        b.addEventListener('click', function () { rows.splice(i, 1); render(); }); td.appendChild(b); tr.appendChild(td);
        body.appendChild(tr);
      });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var r = { room: f.room.value.trim(), tool: f.tool.value, outside: f.outside.value.trim(), inside: f.inside.value.trim(), decision: f.decision.value };
      if (!r.room || !r.outside) { toast('Add the guest room name and outside door'); return; }
      rows.push(r); form.reset(); render(); f.room.focus();
    });
    var cp = $('#hallway-copy');
    if (cp) cp.addEventListener('click', function () {
      if (!rows.length) { toast('Nothing to copy yet'); return; }
      var lines = ['Hallway log - ' + new Date().toLocaleDateString(), 'Guest room | Tool | Outside door | Guest door | Decision'];
      rows.forEach(function (r) { lines.push([r.room, r.tool, r.outside, r.inside, r.decision].join(' | ')); });
      copyText(lines.join('\n'));
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildCode(); buildKeyRing(); buildChooser(); buildChecklists(); buildLog(); buildPages();
    if (state.path) carryPath(state.path);
  });

  window.Guide = { next: next, prev: prev, show: show };
})();
