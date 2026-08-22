/* ═══ T.O.R.C.H 2026 Symposium ═══════════════════════════ */
(function () {
  'use strict';

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── Countdown ──────────────────────────────────── */
  const TARGET = new Date('2026-12-13T10:00:00+09:00');
  const pad = (n, w = 2) => String(n).padStart(w, '0');

  function tick() {
    const diff = TARGET - new Date();
    const els = {
      d: $('#cd-days'), h: $('#cd-hours'), m: $('#cd-mins'), s: $('#cd-secs')
    };
    if (!els.d) return;

    if (diff <= 0) {
      els.d.textContent = '000'; els.h.textContent = els.m.textContent = els.s.textContent = '00';
      return;
    }
    const days  = Math.floor(diff / 864e5);
    const hours = Math.floor((diff % 864e5) / 36e5);
    const mins  = Math.floor((diff % 36e5) / 6e4);
    const secs  = Math.floor((diff % 6e4) / 1e3);

    const newSec = pad(secs);
    if (els.s.textContent !== newSec) {
      els.s.classList.remove('flash');
      void els.s.offsetWidth;
      els.s.classList.add('flash');
    }
    els.d.textContent = pad(days, 3);
    els.h.textContent = pad(hours);
    els.m.textContent = pad(mins);
    els.s.textContent = newSec;
  }
  tick();
  setInterval(tick, 1000);

  /* ── Nav: scrolled state, mobile menu, active link ── */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  $('#navToggle').addEventListener('click', () => nav.classList.toggle('open'));
  $$('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  const sections = $$('main section[id]');
  const links = new Map($$('.nav-links a').map(a => [a.getAttribute('href').slice(1), a]));
  const navObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const link = links.get(e.target.id);
      if (!link) return;
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => navObs.observe(s));

  /* ── Reveal on scroll ───────────────────────────── */
  const revObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((e, i) => {
      if (!e.isIntersecting) return;
      const delay = e.target.parentElement && e.target.parentElement.children.length > 1
        ? Array.prototype.indexOf.call(e.target.parentElement.children, e.target) % 4 * 90
        : 0;
      setTimeout(() => e.target.classList.add('in'), delay);
      obs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => revObs.observe(el));

  /* ── Copy account number ────────────────────────── */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  $('#copyAcct').addEventListener('click', async () => {
    const text = $('#acctNum').textContent.replace(/[^0-9]/g, '');
    try {
      await navigator.clipboard.writeText(text);
      showToast('계좌번호가 복사되었습니다');
    } catch (err) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('계좌번호가 복사되었습니다'); }
      catch (e) { showToast('복사에 실패했습니다'); }
      ta.remove();
    }
  });

  /* ── Poster lightbox ────────────────────────────── */
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  const posterImg = $('#posterImg');
  const openLb  = () => { lbImg.src = posterImg.currentSrc || posterImg.src; lb.hidden = false; document.body.style.overflow = 'hidden'; };
  const closeLb = () => { lb.hidden = true;  document.body.style.overflow = ''; };
  posterImg.addEventListener('click', openLb);
  $('#lbClose').addEventListener('click', closeLb);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });

  /* ── 개인정보 안내 모달 ─────────────────────────── */
  const pv = $('#privacyBox');
  const closePv = () => { pv.hidden = true; document.body.style.overflow = ''; };
  $('#privacyLink').addEventListener('click', e => {
    e.preventDefault();
    pv.hidden = false; document.body.style.overflow = 'hidden';
  });
  $('#pvClose').addEventListener('click', closePv);
  pv.addEventListener('click', e => { if (e.target === pv) closePv(); });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!lb.hidden) closeLb();
    if (!pv.hidden) closePv();
  });

  /* ── 공개 설정 로드 (등록 오픈 여부 / 공지 / 참가비) ── */
  const won = (n) => Number(n).toLocaleString('ko-KR');
  const regForm   = $('#regForm');
  const statusLine = $('#regStatusLine');

  (async function loadConfig() {
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (!res.ok) return;
      const cfg = await res.json();

      if (cfg.notice) {
        const bar = $('#noticeBar');
        bar.querySelector('span').textContent = cfg.notice;
        bar.hidden = false;
        document.body.classList.add('has-notice');
      }
      if (cfg.early_fee)  $('#earlyFee').innerHTML  = won(cfg.early_fee) + '<em>원</em>';
      if (cfg.onsite_fee) $('#onsiteFee').innerHTML = won(cfg.onsite_fee) + '<em>원</em>';

      if (cfg.reg_open === false) {
        statusLine.textContent = '온라인 사전등록 마감';
        statusLine.classList.add('closed');
        $$('#regForm input, #regForm select, #regForm textarea, #submitBtn').forEach(el => { el.disabled = true; });
        $('#formMsg').textContent = '현재 온라인 신청이 마감되었습니다. 문의는 인스타그램 DM으로 부탁드립니다.';
      } else if (typeof cfg.remaining === 'number') {
        statusLine.textContent = `온라인 사전등록 접수 중 · 잔여 ${cfg.remaining}석`;
      }
    } catch { /* 오프라인/로컬 미리보기에서는 무시 */ }
  })();

  /* ── 참가 신청 제출 ─────────────────────────────── */
  regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#formMsg');
    const btn = $('#submitBtn');
    msg.textContent = ''; msg.classList.remove('ok');
    $$('#regForm .err').forEach(el => el.classList.remove('err'));

    const payload = {
      name:        $('#f-name').value.trim(),
      phone:       $('#f-phone').value.trim(),
      email:       $('#f-email').value.trim(),
      job:         $('#f-job').value,
      affiliation: $('#f-aff').value.trim(),
      depositor:   $('#f-dep').value.trim(),
      memo:        $('#f-memo').value.trim(),
      agree_privacy: $('#f-agree').checked
    };

    const fail = (el, text) => { el.classList.add('err'); el.focus(); msg.textContent = text; };
    if (!payload.name)  return fail($('#f-name'), '성함을 입력해 주세요.');
    if (!payload.phone) return fail($('#f-phone'), '연락처를 입력해 주세요.');
    if (!/^[0-9+\-\s()]{8,20}$/.test(payload.phone)) return fail($('#f-phone'), '연락처 형식을 확인해 주세요.');
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return fail($('#f-email'), '이메일 형식을 확인해 주세요.');
    if (!payload.agree_privacy) { msg.textContent = '개인정보 수집·이용에 동의해 주세요.'; return; }

    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = '제출 중…';

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || '신청 처리에 실패했습니다');

      regForm.hidden = true;
      $('.form-head').hidden = true;
      $('#formDone').hidden = false;
      $('#formCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('신청이 접수되었습니다');
    } catch (err) {
      msg.textContent = err.message || '잠시 후 다시 시도해 주세요.';
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });

  $('#againBtn').addEventListener('click', () => {
    regForm.reset();
    regForm.hidden = false;
    $('.form-head').hidden = false;
    $('#formDone').hidden = true;
    $('#formMsg').textContent = '';
    $('#f-name').focus();
  });

  /* ── Rising embers ──────────────────────────────── */
  (function embers() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = $('#embers');
    const ctx = canvas.getContext('2d');
    const COLORS = [[232,53,42], [245,201,24], [255,170,40], [31,111,208], [46,168,74]];
    let W, H, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    class Ember {
      constructor(scatter) {
        this.reset();
        if (scatter) { this.y = Math.random() * H; this.alpha *= Math.random(); }
      }
      reset() {
        this.x = Math.random() * W;
        this.y = H + Math.random() * H * 0.15;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = -(0.25 + Math.random() * 0.85);
        this.r = 0.5 + Math.random() * 1.6;
        this.alpha = 0.4 + Math.random() * 0.45;
        this.decay = 0.0022 + Math.random() * 0.004;
        this.c = COLORS[(Math.random() * COLORS.length) | 0];
        this.phase = Math.random() * Math.PI * 2;
      }
      step(t) {
        this.x += this.vx + Math.sin(t * 0.0006 + this.phase) * 0.28;
        this.y += this.vy;
        this.alpha -= this.decay;
        if (this.alpha <= 0 || this.y < -20) this.reset();
      }
      draw() {
        const [r, g, b] = this.c;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(this.alpha, 0)})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${r},${g},${b},0.55)`;
        ctx.fill();
      }
    }

    const count = window.innerWidth < 720 ? 34 : 70;
    const list = Array.from({ length: count }, () => new Ember(true));

    (function loop(t) {
      ctx.clearRect(0, 0, W, H);
      for (const e of list) { e.step(t); e.draw(); }
      requestAnimationFrame(loop);
    })(0);
  })();
})();
