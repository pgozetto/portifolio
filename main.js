document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ano no rodapé
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Manifesto: quebra o texto em palavras para o destaque guiado pela rolagem (CSS)
document.querySelectorAll('[data-words]').forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
});


// Revelações ao entrar na tela
(() => {
  const targets = document.querySelectorAll('.case, [data-reveal], [data-split]');
  if (!('IntersectionObserver' in window)) { targets.forEach((t) => t.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  targets.forEach((t) => io.observe(t));
})();

// Índice de trabalhos: prévia que segue o cursor (apenas mouse)
(() => {
  const list = document.querySelector('[data-index]');
  const preview = document.querySelector('.index-preview');
  if (!list || !preview) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const img = preview.querySelector('img');
  let x = 0, y = 0, tx = 0, ty = 0, raf = null, active = false;

  const loop = () => {
    const k = reduceMotion ? 1 : 0.16;
    x += (tx - x) * k;
    y += (ty - y) * k;
    const w = preview.offsetWidth, h = preview.offsetHeight;
    preview.style.transform = `translate3d(${x - w / 2}px, ${y - h / 2}px, 0) scale(${active ? 1 : 0.92})`;
    if (active || Math.abs(tx - x) > 0.5 || Math.abs(ty - y) > 0.5) raf = requestAnimationFrame(loop);
    else raf = null;
  };

  list.addEventListener('pointermove', (e) => {
    tx = e.clientX + 40; ty = e.clientY;
    if (!raf) raf = requestAnimationFrame(loop);
  });

  list.querySelectorAll('.index-row').forEach((row) => {
    row.addEventListener('pointerenter', (e) => {
      if (!active) { x = tx = e.clientX + 40; y = ty = e.clientY; }
      const src = row.dataset.img;
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      active = true;
      preview.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });

  list.addEventListener('pointerleave', () => {
    active = false;
    preview.classList.remove('is-on');
  });
})();


// Processo: títulos digitados quando entram na tela
(() => {
  const heads = [...document.querySelectorAll('[data-type]')];
  if (reduceMotion || !('IntersectionObserver' in window)) return;
  heads.forEach((h) => { h.setAttribute('aria-label', h.dataset.type); h.textContent = ''; });
  const type = (h, delay) => setTimeout(() => {
    const txt = h.dataset.type; let i = 0;
    h.classList.add('typing');
    const t = setInterval(() => {
      h.textContent = txt.slice(0, ++i);
      if (i >= txt.length) { clearInterval(t); setTimeout(() => h.classList.remove('typing'), 900); }
    }, 70);
  }, delay);
  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    heads.forEach((h, i) => type(h, i * 450));
    io.disconnect();
  }, { threshold: 0.4 });
  io.observe(document.querySelector('.steps'));
})();

// Quebra texto em palavras (só espaços), preservando elementos filhos
const splitWords = (root, onWord, skip) => {
  const walk = (node) => [...node.childNodes].forEach((n) => {
    if (n.nodeType === 3) {
      if (!n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/( +)/).forEach((part) => {
        if (!part) return;
        if (part.trim() === '') { frag.append(' '); return; }
        frag.append(onWord(part));
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && !(skip && skip(n))) walk(n);
  });
  walk(root);
};

// Título do topo: efeito typewriter (mesmo comportamento do componente Typewriter, em JS puro)
(() => {
  const title = document.querySelector('[data-typewriter]');
  if (!title) return;
  title.setAttribute('aria-label', title.textContent.replace(/ +/g, ' ').replace(/\n/g, ' ').trim());
  const chars = [];
  title.querySelectorAll('.line').forEach((l) => {
    l.setAttribute('aria-hidden', 'true');
    splitWords(l, (word) => {
      const w = document.createElement('span');
      w.style.whiteSpace = 'nowrap';
      [...word].forEach((ch) => {
        const s = document.createElement('span');
        s.className = 'tw-c'; s.textContent = ch;
        w.append(s); chars.push(s);
      });
      return w;
    });
  });
  const cursor = document.createElement('span');
  cursor.className = 'tw-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  if (reduceMotion) { chars.forEach((c) => c.classList.add('on')); chars[chars.length - 1].after(cursor); return; }
  let i = 0;
  chars[0].before(cursor);
  const tick = () => {
    const c = chars[i];
    c.classList.add('on'); c.after(cursor); i++;
    if (i < chars.length) setTimeout(tick, /[!.]/.test(c.textContent) ? 420 : 55);
  };
  setTimeout(tick, 450);
})();

// Contato: palavras do título entram uma a uma
document.querySelectorAll('[data-split]').forEach((el) => {
  let k = 0;
  splitWords(el, (word) => {
    const s = document.createElement('span');
    s.className = 'sw'; s.style.setProperty('--k', k++); s.textContent = word;
    return s;
  }, (n) => n.tagName.toLowerCase() === 'svg');
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); } }, { threshold: 0.4 });
  io.observe(el);
});

// Processo: holofote segue o cursor
document.querySelectorAll('.step').forEach((s) => s.addEventListener('pointermove', (e) => {
  const r = s.getBoundingClientRect();
  s.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
  s.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
}));

// Fundo do topo: brasas vermelhas subindo
(() => {
  const cv = document.querySelector('.embers');
  if (!cv || reduceMotion) return;
  const ctx = cv.getContext('2d');
  let w = 0, h = 0, parts = [], run = false, raf = null;
  const make = (initial) => ({
    x: Math.random() * w, y: initial ? Math.random() * h : h + 10,
    r: Math.random() * 1.8 + 0.4, vy: Math.random() * 0.5 + 0.2, vx: (Math.random() - 0.5) * 0.25,
    a: Math.random() * 0.6 + 0.25, t: Math.random() * 6.28,
  });
  const init = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = cv.clientWidth; h = cv.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parts = Array.from({ length: Math.round(Math.min(90, w / 14)) }, () => make(true));
  };
  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.shadowColor = 'rgba(236,45,33,0.9)';
    ctx.shadowBlur = 8;
    for (const p of parts) {
      p.t += 0.02; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * 0.2;
      if (p.y < -10) Object.assign(p, make(false));
      const fade = Math.min(1, (p.y / h) * 1.6);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283);
      ctx.fillStyle = 'rgba(236,45,33,' + (p.a * fade).toFixed(3) + ')';
      ctx.fill();
    }
    raf = run ? requestAnimationFrame(frame) : null;
  };
  init();
  window.addEventListener('resize', init);
  new IntersectionObserver(([e]) => { run = e.isIntersecting; if (run && !raf) raf = requestAnimationFrame(frame); }).observe(cv);
})();

// Processo: destaque que percorre as etapas em sequência, em loop
(() => {
  const steps = [...document.querySelectorAll('.step')];
  if (!steps.length || reduceMotion) return;
  steps.forEach((s) => { const sw = document.createElement('span'); sw.className = 'sweep'; sw.setAttribute('aria-hidden', 'true'); s.prepend(sw); });
  let i = 0, timer = null;
  const next = () => {
    steps.forEach((s) => s.classList.remove('active'));
    const s = steps[i % steps.length];
    void s.offsetWidth;
    s.classList.add('active');
    i++;
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !timer) { setTimeout(next, 1800); timer = setInterval(next, 2200); }
    else if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
  }, { threshold: 0.3 }).observe(document.querySelector('.steps'));
})();
