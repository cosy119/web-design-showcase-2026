/* 黄经仪：24 刻点、拖拽太阳、读数联动 */
window.Instrument = (function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var TERMS = window.SOLAR_TERMS;
  var SEASON_CN = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

  var CX = 360, CY = 360;
  var HANDLE_R = 298;
  var ARC_R = 320;

  var state = {
    index: 0,
    lon: 0,
    auto: false,
    visible: true,
    raf: null,
    last: 0,
    today: null
  };

  var dom = {};
  var labels = [];
  var ticks = [];
  var dragging = false;

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function point(lon, r) {
    var a = (lon - 90) * Math.PI / 180;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
  }

  function norm(lon) {
    return ((lon % 360) + 360) % 360;
  }

  function termAt(lon) {
    var l = norm(lon);
    for (var i = 0; i < TERMS.length; i++) {
      if (norm(l - TERMS[i].longitude) < 15) return i;
    }
    return 0;
  }

  function buildDial() {
    var tickG = document.getElementById('scopeTicks');
    var labelG = document.getElementById('scopeLabels');

    for (var i = 0; i < TERMS.length; i++) {
      var term = TERMS[i];
      var lon = term.longitude;
      var major = lon % 90 === 0;
      var inner = major ? 288 : 298;
      var outer = major ? 322 : 314;
      var p1 = point(lon, inner);
      var p2 = point(lon, outer);
      var line = el('line', {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        'class': 'sc-tick' + (major ? ' is-major' : '')
      });
      tickG.appendChild(line);
      ticks.push(line);

      var g = el('g', { transform: 'rotate(' + lon + ' ' + CX + ' ' + CY + ')' });
      var text = el('text', {
        x: CX, y: CY - 272, 'text-anchor': 'middle',
        'dominant-baseline': 'middle', 'class': 'sc-term-label'
      });
      text.textContent = term.name;
      g.appendChild(text);
      labelG.appendChild(g);
      labels.push(text);
    }
  }

  function shadowOf(lon) {
    var decl = 23.44 * Math.sin(lon * Math.PI / 180);
    var altitude = 90 - Math.abs(34.5 - decl);
    var shadow = 8 / Math.tan(altitude * Math.PI / 180);
    return { shadow: shadow, altitude: altitude };
  }

  function arcPath(lon) {
    if (lon <= .5) return '';
    var start = point(0, ARC_R);
    var end = point(lon, ARC_R);
    var large = lon > 180 ? 1 : 0;
    return 'M' + start.x + ' ' + start.y + ' A ' + ARC_R + ' ' + ARC_R +
      ' 0 ' + large + ' 1 ' + end.x + ' ' + end.y;
  }

  function moveFrame(lon) {
    var p = point(lon, HANDLE_R);
    dom.needle.setAttribute('x2', p.x);
    dom.needle.setAttribute('y2', p.y);
    dom.sunHalo.setAttribute('cx', p.x);
    dom.sunHalo.setAttribute('cy', p.y);
    dom.sunDot.setAttribute('cx', p.x);
    dom.sunDot.setAttribute('cy', p.y);
    dom.arc.setAttribute('d', arcPath(lon));
    state.lon = norm(lon);
  }

  function renderTerm(index) {
    var term = TERMS[index];
    state.index = index;

    labels.forEach(function (t, i) { t.classList.toggle('is-active', i === index); });
    ticks.forEach(function (t, i) { t.classList.toggle('is-active', i === index); });

    dom.centerName.textContent = term.name;
    dom.centerDegree.textContent = term.longitude + '°';
    dom.roIndex.textContent = term.no + ' / 24';
    dom.roSeason.textContent = SEASON_CN[term.season] + ' · ' + term.name;
    dom.roName.textContent = term.name;
    dom.roPy.textContent = term.py;
    dom.roEn.textContent = term.en;

    var parts = term.date.split('-');
    dom.roDate.textContent = Number(parts[0]) + '月' + Number(parts[1]) + '日 · 太阳到达黄经 ' + term.longitude + '°';

    dom.roPhenology.innerHTML = term.phenology.map(function (p, i) {
      return '<li><i>' + ['初候', '二候', '三候'][i] + '</i><span>' + p + '</span></li>';
    }).join('');
    dom.roCustom.textContent = term.custom;

    var s = shadowOf(term.longitude);
    var ratio = Math.max(3, Math.min(100, (s.shadow - 1.2) / 11.8 * 100));
    dom.roShadowBar.style.width = ratio.toFixed(1) + '%';
    dom.roShadow.textContent = '影长约 ' + s.shadow.toFixed(1) + ' 尺 · 正午太阳高度 ' + s.altitude.toFixed(1) + '°';

    dom.svg.setAttribute('aria-valuenow', String(term.longitude));
    dom.svg.setAttribute('aria-valuetext', term.name + '，太阳黄经 ' + term.longitude + ' 度');
  }

  function setTerm(index, lon) {
    if (index !== state.index) renderTerm(index);
    moveFrame(typeof lon === 'number' ? lon : TERMS[index].longitude);
  }

  function stopAuto() {
    state.auto = false;
    dom.btnAuto.setAttribute('aria-pressed', 'false');
    dom.btnAuto.textContent = '自动巡天';
    if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }
  }

  function tick(ts) {
    if (!state.auto) return;
    if (!state.last) state.last = ts;
    var dt = Math.min(.05, (ts - state.last) / 1000);
    state.last = ts;
    var lon = norm(state.lon + dt * 9);
    var index = termAt(lon);
    if (index !== state.index) renderTerm(index);
    moveFrame(lon);
    state.raf = requestAnimationFrame(tick);
  }

  function startAuto() {
    state.auto = true;
    dom.btnAuto.setAttribute('aria-pressed', 'true');
    dom.btnAuto.textContent = '暂停巡天';
    state.last = 0;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = requestAnimationFrame(tick);
  }

  function pointerLon(evt) {
    var rect = dom.svg.getBoundingClientRect();
    var x = (evt.clientX - rect.left) / rect.width * 720;
    var y = (evt.clientY - rect.top) / rect.height * 720;
    return norm(Math.atan2(y - CY, x - CX) * 180 / Math.PI + 90);
  }

  function selectLon(lon) {
    var snapped = norm(Math.round(lon / 15) * 15);
    setTerm(termAt(snapped), snapped);
  }

  function step(delta) {
    if (state.auto) stopAuto();
    var index = (state.index + delta + 24) % 24;
    setTerm(index);
  }

  function init(options) {
    options = options || {};
    state.today = options.today || null;

    dom.svg = document.getElementById('scopeSvg');
    if (!dom.svg) return null;

    dom.needle = dom.svg.querySelector('.sc-needle');
    dom.sunHalo = dom.svg.querySelector('.sc-sun-halo');
    dom.sunDot = dom.svg.querySelectorAll('.sc-handle circle')[1];
    dom.arc = document.getElementById('scopeArc');
    dom.centerName = document.getElementById('scopeCenterName');
    dom.centerDegree = document.getElementById('scopeCenterDegree');
    dom.roIndex = document.getElementById('roIndex');
    dom.roSeason = document.getElementById('roSeason');
    dom.roName = document.getElementById('roName');
    dom.roPy = document.getElementById('roPy');
    dom.roEn = document.getElementById('roEn');
    dom.roDate = document.getElementById('roDate');
    dom.roPhenology = document.getElementById('roPhenology');
    dom.roCustom = document.getElementById('roCustom');
    dom.roShadowBar = document.getElementById('roShadowBar');
    dom.roShadow = document.getElementById('roShadow');
    dom.btnToday = document.getElementById('btnToday');
    dom.btnAuto = document.getElementById('btnAuto');

    buildDial();

    var initial = options.today && options.today.term ? options.today.term : TERMS[17];
    setTerm(initial.no - 1);

    dom.svg.addEventListener('pointerdown', function (evt) {
      if (evt.button !== undefined && evt.button !== 0) return;
      stopAuto();
      dragging = true;
      dom.svg.classList.add('is-dragging');
      if (dom.svg.setPointerCapture) {
        try { dom.svg.setPointerCapture(evt.pointerId); } catch (e) {}
      }
      selectLon(pointerLon(evt));
      evt.preventDefault();
    });

    dom.svg.addEventListener('pointermove', function (evt) {
      if (!dragging) return;
      selectLon(pointerLon(evt));
    });

    function endDrag(evt) {
      if (!dragging) return;
      dragging = false;
      dom.svg.classList.remove('is-dragging');
      if (dom.svg.releasePointerCapture && evt.pointerId !== undefined) {
        try { dom.svg.releasePointerCapture(evt.pointerId); } catch (e) {}
      }
    }
    dom.svg.addEventListener('pointerup', endDrag);
    dom.svg.addEventListener('pointercancel', endDrag);

    dom.svg.addEventListener('keydown', function (evt) {
      if (evt.key === 'ArrowRight' || evt.key === 'ArrowDown') { step(1); evt.preventDefault(); }
      else if (evt.key === 'ArrowLeft' || evt.key === 'ArrowUp') { step(-1); evt.preventDefault(); }
      else if (evt.key === 'Home') { stopAuto(); setTerm(0); evt.preventDefault(); }
      else if (evt.key === 'End') { stopAuto(); setTerm(23); evt.preventDefault(); }
    });

    dom.btnToday.addEventListener('click', function () {
      stopAuto();
      if (state.today && state.today.term) setTerm(state.today.term.no - 1);
      else setTerm(17);
    });

    dom.btnAuto.addEventListener('click', function () {
      if (state.auto) {
        var index = state.index;
        stopAuto();
        setTerm(index);
      } else {
        startAuto();
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        state.visible = entries[0].isIntersecting;
        if (!state.visible && state.auto) {
          if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }
        } else if (state.visible && state.auto && !state.raf) {
          state.last = 0;
          state.raf = requestAnimationFrame(tick);
        }
      }, { threshold: .05 }).observe(dom.svg);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (state.raf) { cancelAnimationFrame(state.raf); state.raf = null; }
      } else if (state.auto && !state.raf) {
        state.last = 0;
        state.raf = requestAnimationFrame(tick);
      }
    });

    return {
      selectIndex: function (i) { stopAuto(); setTerm(i); },
      stopAuto: stopAuto
    };
  }

  return { init: init };
})();
