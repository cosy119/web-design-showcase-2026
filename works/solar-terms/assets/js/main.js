/* 页面主逻辑：今日节气、导航、滚动揭示、刻度尺 */
(function () {
  'use strict';

  var TERMS = window.SOLAR_TERMS;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var instrument = null;
  var wheel = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function norm(lon) { return ((lon % 360) + 360) % 360; }

  /* 以本机日期推断所处节气（按近似交节日期，误差 ±1 天） */
  function getTodayInfo() {
    var now = new Date();
    var year = now.getFullYear();
    var list = [];
    [-1, 0, 1].forEach(function (offset) {
      TERMS.forEach(function (term) {
        var parts = term.date.split('-');
        list.push({
          term: term,
          date: new Date(year + offset, Number(parts[0]) - 1, Number(parts[1]))
        });
      });
    });
    list.sort(function (a, b) { return a.date - b.date; });

    var cur = list[0];
    var next = list[list.length - 1];
    for (var i = 0; i < list.length; i++) {
      if (list[i].date <= now) cur = list[i];
      else { next = list[i]; break; }
    }

    var dayIn = Math.max(1, Math.floor((now - cur.date) / 86400000) + 1);
    var lon = Math.round(norm(cur.term.longitude + (dayIn - 1) * 0.9856));
    var daysToNext = Math.max(1, Math.ceil((next.date - now) / 86400000));

    return {
      term: cur.term,
      next: next.term,
      lon: lon,
      dayIn: dayIn,
      daysToNext: daysToNext,
      now: now
    };
  }

  function fillToday(info) {
    var m = info.now.getMonth() + 1;
    var d = info.now.getDate();

    var heroTerm = $('#heroTerm');
    if (heroTerm) heroTerm.textContent = info.term.name;

    var heroDate = $('#heroDate');
    if (heroDate) heroDate.textContent = m + '月' + d + '日 · 太阳黄经 ' + info.lon + '°';

    var heroNext = $('#heroNext');
    if (heroNext) heroNext.textContent = '距 ' + info.next.name + ' 还有 ' + info.daysToNext + ' 天';

    var navName = $('#navTermName');
    if (navName) navName.textContent = info.term.name;
    var navLon = $('#navTermLon');
    if (navLon) navLon.textContent = info.lon;
  }

  /* 右侧刻度尺 */
  function buildRuler() {
    var marks = $('#rulerMarks');
    if (!marks) return;
    for (var i = 0; i < 24; i++) {
      var tick = document.createElement('i');
      marks.appendChild(tick);
    }
  }

  function updateRuler() {
    var marks = $$('#rulerMarks i');
    var marker = $('#rulerMarker');
    var label = $('#rulerLabel');
    if (!marks.length || !marker) return;

    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);
    var progress = Math.min(1, Math.max(0, window.scrollY / max));
    var active = Math.round(progress * 23);

    marks.forEach(function (m, i) { m.classList.toggle('is-on', i <= active); });
    marker.style.top = (progress * 100) + '%';
    if (label) label.textContent = pad(progress === 0 ? 0 : Math.round(progress * 24)) + '/24';
  }

  /* 滚动揭示 */
  function setupReveal() {
    var nodes = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      nodes.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* 数字递增 */
  function setupCounters() {
    var nodes = $$('.count');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var node = entry.target;
        io.unobserve(node);
        var target = Number(node.getAttribute('data-count'));
        var suffix = node.getAttribute('data-suffix') || '';
        var start = 0;
        var duration = 1200;
        function frame(ts) {
          if (!start) start = ts;
          var p = Math.min(1, (ts - start) / duration);
          var eased = 1 - Math.pow(1 - p, 3);
          node.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    }, { threshold: .5 });

    nodes.forEach(function (n) { io.observe(n); });
  }

  /* 章节高亮 */
  function setupNav() {
    var sections = ['intro', 'instrument', 'seasons', 'wheel'];
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        $$('.nav a').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('data-nav') === id);
        });
        $$('.mobile-nav a').forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 });

    sections.forEach(function (id) {
      var node = document.getElementById(id);
      if (node) io.observe(node);
    });
  }

  /* 四时节气 → 罗盘联动 */
  function bindTermLinks() {
    $$('[data-term-link]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (wheel) wheel.selectByName(link.getAttribute('data-term-link'));
      });
    });
  }

  function init() {
    var info = getTodayInfo();
    fillToday(info);
    buildRuler();
    updateRuler();
    setupReveal();
    setupCounters();
    setupNav();

    if (window.Scenes) window.Scenes.init();

    if (window.Instrument) {
      instrument = window.Instrument.init({ today: info });
    }
    if (window.Wheel) {
      wheel = window.Wheel.init({ initialIndex: info.term.no - 1 });
    }
    bindTermLinks();

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        updateRuler();
        ticking = false;
      });
    }, { passive: true });

    window.addEventListener('resize', function () {
      requestAnimationFrame(updateRuler);
    });

    window.__solar = {
      today: info,
      instrument: instrument,
      wheel: wheel
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
