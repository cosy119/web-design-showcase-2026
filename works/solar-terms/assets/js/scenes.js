/* Canvas 场景：星空、四季粒子 */
window.Scenes = (function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR_MAX = 2;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(1, rect.width);
    var h = Math.max(1, rect.height);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---------- 四季粒子 ---------- */

  function spawn(kind, w, h) {
    var count = Math.round(Math.min(70, Math.max(26, (w * h) / 26000)));
    var list = [];
    for (var i = 0; i < count; i++) {
      if (kind === 'spring') {
        list.push({
          x: rand(0, w), y: rand(-h, h), s: rand(3, 7),
          vy: rand(16, 44), vx: rand(-10, 18), rot: rand(0, 6.28), vr: rand(-.7, .7),
          sway: rand(.5, 1.4), phase: rand(0, 6.28),
          color: pick(['rgba(208,158,150,.5)', 'rgba(196,176,132,.45)', 'rgba(146,170,132,.4)'])
        });
      } else if (kind === 'summer') {
        list.push({
          x: rand(0, w), y: rand(0, h), s: rand(1.1, 2.6),
          vy: rand(7, 20), vx: rand(-6, 6), phase: rand(0, 6.28), speed: rand(.6, 1.6),
          color: pick(['rgba(214,178,102,.85)', 'rgba(190,150,72,.7)', 'rgba(120,160,140,.6)'])
        });
      } else if (kind === 'autumn') {
        list.push({
          x: rand(0, w), y: rand(-h, h), s: rand(4.5, 10),
          vy: rand(20, 52), vx: rand(-16, 10), rot: rand(0, 6.28), vr: rand(-1.4, 1.4),
          sway: rand(.8, 1.8), phase: rand(0, 6.28),
          color: pick(['rgba(165,107,50,.5)', 'rgba(168,56,44,.4)', 'rgba(178,138,62,.5)', 'rgba(122,138,84,.4)'])
        });
      } else {
        list.push({
          x: rand(0, w), y: rand(-h, h), s: rand(.8, 2.4),
          vy: rand(18, 52), vx: rand(-12, 12), phase: rand(0, 6.28),
          color: pick(['rgba(92,113,128,.5)', 'rgba(92,113,128,.34)', 'rgba(255,255,255,.55)'])
        });
      }
    }
    return list;
  }

  function drawOne(ctx, kind, p, t) {
    if (kind === 'spring') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s * .5, p.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (kind === 'summer') {
      var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 7);
      glow.addColorStop(0, p.color);
      glow.addColorStop(1, 'rgba(214,178,102,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s * 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (kind === 'autumn') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.quadraticCurveTo(p.s * .85, 0, 0, p.s);
      ctx.quadraticCurveTo(-p.s * .85, 0, 0, -p.s);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function updateOne(kind, p, dt, time, w, h) {
    if (kind === 'summer') {
      p.y -= p.vy * dt;
      p.x += Math.sin(time * p.speed + p.phase) * 12 * dt;
      if (p.y < -20) { p.y = h + 20; p.x = rand(0, w); }
      return;
    }
    p.x += (p.vx + Math.sin(time * p.sway + p.phase) * 14) * dt;
    p.y += p.vy * dt;
    if (kind !== 'winter') p.rot += p.vr * dt;
    if (p.y > h + 26) {
      p.y = -26;
      p.x = rand(0, w);
    }
    if (p.x < -30) p.x = w + 30;
    if (p.x > w + 30) p.x = -30;
  }

  function mountSeason(canvas) {
    var kind = canvas.parentElement.getAttribute('data-season');
    var env = fit(canvas);
    var particles = spawn(kind, env.w, env.h);
    var raf = null;
    var last = 0;
    var time = 0;
    var visible = false;

    function render(dt) {
      env.ctx.clearRect(0, 0, env.w, env.h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (dt > 0) updateOne(kind, p, dt, time, env.w, env.h);
        drawOne(env.ctx, kind, p, time);
      }
    }

    function frame(ts) {
      if (!last) last = ts;
      var dt = Math.min(.05, (ts - last) / 1000);
      last = ts;
      time += dt;
      render(dt);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduceMotion || raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    render(0);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { threshold: .01 }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (visible) start();
    });

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        var size = fit(canvas);
        env.ctx = size.ctx; env.w = size.w; env.h = size.h;
        particles = spawn(kind, env.w, env.h);
        render(0);
      }).observe(canvas);
    }
  }

  /* ---------- 星空 ---------- */

  function mountStars(canvas) {
    var env = fit(canvas);
    var stars = [];
    var raf = null;
    var visible = false;
    var t = 0;

    function build() {
      stars = [];
      var count = Math.round(Math.min(120, Math.max(40, (env.w * env.h) / 14000)));
      for (var i = 0; i < count; i++) {
        stars.push({
          x: rand(0, env.w), y: rand(0, env.h),
          r: rand(.4, 1.5), a: rand(.15, .7), phase: rand(0, 6.28), speed: rand(.3, 1.2)
        });
      }
    }

    function render() {
      env.ctx.clearRect(0, 0, env.w, env.h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var a = s.a * (.6 + .4 * Math.sin(t * s.speed + s.phase));
        env.ctx.fillStyle = 'rgba(237,231,217,' + a.toFixed(3) + ')';
        env.ctx.beginPath();
        env.ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        env.ctx.fill();
      }
    }

    function frame(ts) {
      t = ts / 1000;
      render();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduceMotion || raf) return;
      raf = requestAnimationFrame(frame);
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    build();
    render();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { threshold: .01 }).observe(canvas);
    } else {
      start();
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () {
        var size = fit(canvas);
        env.ctx = size.ctx; env.w = size.w; env.h = size.h;
        build();
        render();
      }).observe(canvas);
    }
  }

  function init() {
    var chapters = document.querySelectorAll('.chapter-canvas');
    for (var i = 0; i < chapters.length; i++) mountSeason(chapters[i]);
    var stars = document.getElementById('starCanvas');
    if (stars) mountStars(stars);
  }

  return { init: init };
})();
