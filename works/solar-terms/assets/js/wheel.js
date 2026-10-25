/* 二十四节气罗盘：拖拽旋转、点选、键盘与详情联动 */
window.Wheel = (function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var TERMS = window.SOLAR_TERMS;
  var SEASON_CN = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  var CX = 380, CY = 380;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var svg, rotateG, labels = [], items = [], dots = [];
  var rotation = 0;
  var selected = 0;
  var dragging = false;
  var moved = 0;
  var startAngle = 0;
  var startRotation = 0;
  var animRaf = null;
  var dom = {};

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function pos(lon, r) {
    var a = (lon - 90) * Math.PI / 180;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
  }

  function norm(lon) { return ((lon % 360) + 360) % 360; }

  function build() {
    var segG = document.getElementById('wheelSegments');
    var labG = document.getElementById('wheelLabels');

    for (var i = 0; i < TERMS.length; i++) {
      var term = TERMS[i];
      var lon = term.longitude;

      var p1 = pos(lon, 190);
      var p2 = pos(lon, 308);
      segG.appendChild(el('line', {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, 'class': 'wh-seg'
      }));

      var t1 = pos(lon, 308);
      var t2 = pos(lon, 322);
      segG.appendChild(el('line', {
        x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y, 'class': 'wh-tick'
      }));

      var d = pos(lon, 300);
      var dot = el('circle', {
        cx: d.x, cy: d.y, r: 2.4, 'class': 'wh-dot', 'data-dot': i
      });
      segG.appendChild(dot);
      dots.push(dot);

      var lp = pos(lon, 250);
      var g = el('g', {
        transform: 'translate(' + lp.x + ' ' + lp.y + ')',
        'class': 'wh-item', 'data-i': i
      });
      g.appendChild(el('circle', { r: 20, fill: 'transparent' }));
      var text = el('text', {
        x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        'class': 'wh-label'
      });
      text.textContent = term.name;
      g.appendChild(text);
      labG.appendChild(g);
      labels.push(text);
      items.push(g);
    }
  }

  function applyRotation() {
    rotateG.setAttribute('transform', 'rotate(' + rotation + ' ' + CX + ' ' + CY + ')');
    for (var i = 0; i < labels.length; i++) {
      labels[i].setAttribute('transform', 'rotate(' + (-rotation) + ')');
    }
  }

  function setActive(index) {
    selected = index;
    labels.forEach(function (t, i) { t.classList.toggle('is-active', i === index); });
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    var term = TERMS[index];
    dom.centerIndex.textContent = term.no + ' / 24';
    dom.centerName.textContent = term.name;
    dom.centerPy.textContent = term.py.toUpperCase();
    svg.setAttribute('aria-valuenow', String(term.no));
    svg.setAttribute('aria-valuetext', term.name + '，' + term.line);
  }

  function renderDetail(index) {
    var term = TERMS[index];
    var parts = term.date.split('-');
    dom.tdIndex.textContent = term.no + ' / 24';
    dom.tdSeason.textContent = SEASON_CN[term.season] + ' · ' + term.name;
    dom.tdName.textContent = term.name;
    dom.tdPy.textContent = term.py;
    dom.tdEn.textContent = term.en;
    dom.tdLine.textContent = term.line;
    dom.tdSwatch.style.background = term.color;
    dom.tdColorName.textContent = term.colorName;
    dom.tdPhenology.innerHTML = term.phenology.map(function (p, i) {
      return '<li><i>' + ['初候', '二候', '三候'][i] + '</i>' + p + '</li>';
    }).join('');
    dom.tdCustom.textContent = term.custom;
    dom.tdLon.textContent = term.longitude;
    dom.tdDate.textContent = Number(parts[0]) + '月' + Number(parts[1]) + '日';
    dom.detail.style.borderTopColor = term.color;
  }

  function targetRotationFor(lon) {
    var target = -lon;
    while (target - rotation > 180) target -= 360;
    while (rotation - target > 180) target += 360;
    return target;
  }

  function animateTo(target) {
    if (animRaf) cancelAnimationFrame(animRaf);
    if (reduceMotion) {
      rotation = target;
      applyRotation();
      return;
    }
    var from = rotation;
    var start = 0;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / 760);
      var e = 1 - Math.pow(1 - p, 3);
      rotation = from + (target - from) * e;
      applyRotation();
      if (p < 1) animRaf = requestAnimationFrame(frame);
      else animRaf = null;
    }
    animRaf = requestAnimationFrame(frame);
  }

  function select(index, animate) {
    setActive(index);
    renderDetail(index);
    var target = targetRotationFor(TERMS[index].longitude);
    if (animate === false) {
      rotation = target;
      applyRotation();
    } else {
      animateTo(target);
    }
  }

  function nearestByPointer(evt) {
    var rect = svg.getBoundingClientRect();
    var x = (evt.clientX - rect.left) / rect.width * 760;
    var y = (evt.clientY - rect.top) / rect.height * 760;
    var angle = Math.atan2(y - CY, x - CX) * 180 / Math.PI;
    var best = 0, bestDist = 1e9;
    for (var i = 0; i < TERMS.length; i++) {
      var termAngle = TERMS[i].longitude + rotation - 90;
      var diff = Math.abs(((termAngle - angle + 540) % 360) - 180);
      if (diff < bestDist) { bestDist = diff; best = i; }
    }
    return best;
  }

  function pointerAngle(evt) {
    var rect = svg.getBoundingClientRect();
    var x = (evt.clientX - rect.left) / rect.width * 760;
    var y = (evt.clientY - rect.top) / rect.height * 760;
    return Math.atan2(y - CY, x - CX) * 180 / Math.PI;
  }

  function step(delta) {
    var next = (selected + delta + 24) % 24;
    select(next, true);
  }

  function init(options) {
    options = options || {};
    svg = document.getElementById('wheelSvg');
    if (!svg) return null;
    rotateG = document.getElementById('wheelRotate');

    dom.centerIndex = document.getElementById('wheelCenterIndex');
    dom.centerName = document.getElementById('wheelCenterName');
    dom.centerPy = document.getElementById('wheelCenterPy');
    dom.tdIndex = document.getElementById('tdIndex');
    dom.tdSeason = document.getElementById('tdSeason');
    dom.tdName = document.getElementById('tdName');
    dom.tdPy = document.getElementById('tdPy');
    dom.tdEn = document.getElementById('tdEn');
    dom.tdLine = document.getElementById('tdLine');
    dom.tdSwatch = document.getElementById('tdSwatch');
    dom.tdColorName = document.getElementById('tdColorName');
    dom.tdPhenology = document.getElementById('tdPhenology');
    dom.tdCustom = document.getElementById('tdCustom');
    dom.tdLon = document.getElementById('tdLon');
    dom.tdDate = document.getElementById('tdDate');
    dom.detail = document.getElementById('termDetail');

    build();
    select(typeof options.initialIndex === 'number' ? options.initialIndex : 17, false);

    svg.addEventListener('pointerdown', function (evt) {
      if (evt.button !== undefined && evt.button !== 0) return;
      if (animRaf) { cancelAnimationFrame(animRaf); animRaf = null; }
      dragging = true;
      moved = 0;
      startAngle = pointerAngle(evt);
      startRotation = rotation;
      svg.classList.add('is-dragging');
      if (svg.setPointerCapture) {
        try { svg.setPointerCapture(evt.pointerId); } catch (e) {}
      }
      evt.preventDefault();
    });

    svg.addEventListener('pointermove', function (evt) {
      if (!dragging) return;
      var angle = pointerAngle(evt);
      var delta = angle - startAngle;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      moved = Math.max(moved, Math.abs(delta));
      rotation = startRotation + delta;
      applyRotation();
    });

    function endDrag(evt) {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove('is-dragging');
      if (svg.releasePointerCapture && evt.pointerId !== undefined) {
        try { svg.releasePointerCapture(evt.pointerId); } catch (e) {}
      }
      var index = (moved < 6 && evt.type !== 'pointercancel') ? nearestByPointer(evt) : nearestToTop();
      select(index, true);
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    function nearestToTop() {
      var best = 0, bestDist = 1e9;
      for (var i = 0; i < TERMS.length; i++) {
        var diff = Math.abs(((TERMS[i].longitude + rotation + 540) % 360) - 180);
        if (diff < bestDist) { bestDist = diff; best = i; }
      }
      return best;
    }

    svg.addEventListener('keydown', function (evt) {
      if (evt.key === 'ArrowRight' || evt.key === 'ArrowDown') { step(1); evt.preventDefault(); }
      else if (evt.key === 'ArrowLeft' || evt.key === 'ArrowUp') { step(-1); evt.preventDefault(); }
      else if (evt.key === 'Home') { select(0, true); evt.preventDefault(); }
      else if (evt.key === 'End') { select(23, true); evt.preventDefault(); }
    });

    document.getElementById('wheelPrev').addEventListener('click', function () { step(-1); });
    document.getElementById('wheelNext').addEventListener('click', function () { step(1); });

    return {
      selectIndex: function (i) { select(i, true); },
      selectByName: function (name) {
        for (var i = 0; i < TERMS.length; i++) {
          if (TERMS[i].name === name) { select(i, true); return true; }
        }
        return false;
      },
      current: function () { return selected; }
    };
  }

  return { init: init };
})();
