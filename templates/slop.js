// slop.js: the slopify gag engine. No dependencies. Load with <script src="slop.js" defer></script>.
// Every gag is opt-in: call slop.<gag>(...) from your own script. Styling lives in slop-base.css
// and is themed per era via CSS variables (--slop-*), so the same gags fit any style.
(() => {
  const $ = (s, root = document) => (typeof s === 'string' ? root.querySelector(s) : s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Resolves on the first user click, so chaotic gags never fire before the visitor interacts.
  const firstClick = new Promise((r) => addEventListener('pointerdown', r, { once: true, capture: true }));
  const afterClick = (fn) => firstClick.then(fn);
  const every = (ms, fn) => setInterval(fn, ms);

  function toast(msg, ms = 2600) {
    let t = $('.slop-toast');
    if (!t) t = document.body.appendChild(el('<div class="slop-toast" role="status"></div>'));
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove('show'), ms);
  }

  // Modals are queued: only one at a time, so the page stays usable.
  let queue = Promise.resolve();
  function modal({ title = 'Message', html = '', buttons = ['OK'], className = '' }) {
    const run = () =>
      new Promise((resolve) => {
        const m = el(`<div class="slop-overlay ${className}"><div class="slop-win" role="dialog" aria-label="${esc(title)}">
          <div class="slop-title"><span>${esc(title)}</span><button class="slop-x" data-v="x" aria-label="close">✕</button></div>
          <div class="slop-body">${html}</div>
          <div class="slop-btns">${buttons.map((b, i) => `<button class="slop-btn" data-v="${i}">${esc(b)}</button>`).join('')}</div>
        </div></div>`);
        m.addEventListener('click', (e) => {
          const v = e.target.closest('[data-v]')?.dataset.v;
          if (v === undefined) return;
          m.remove();
          resolve(v === 'x' ? -1 : Number(v));
        });
        document.body.appendChild(m);
      });
    const p = queue.then(run);
    queue = p.catch(() => {});
    return p;
  }

  function drag(win, handle = win.querySelector('.slop-title') || win) {
    handle.style.cursor = 'move';
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const r = win.getBoundingClientRect();
      const dx = e.clientX - r.left, dy = e.clientY - r.top;
      win.style.position = 'fixed';
      const move = (ev) => {
        win.style.left = `${ev.clientX - dx}px`;
        win.style.top = `${Math.max(0, ev.clientY - dy)}px`;
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', () => removeEventListener('pointermove', move), { once: true });
    });
  }

  // Hit counter: an odometer that never stops counting.
  function counter(target, { start = rnd(4000, 90000), digits = 12, tick = 1500 } = {}) {
    const node = $(target);
    let n = start;
    const draw = () => (node.textContent = String(n).padStart(digits, '0'));
    draw();
    every(tick, () => ((n += rnd(1, 7)), draw()));
  }

  // Price creep: any [data-creep] element slowly costs more while you read it.
  function creep(selector = '[data-creep]', { step = 0.05, ms = 1000, prefix = '$', decimals = 2 } = {}) {
    document.querySelectorAll(selector).forEach((node) => {
      let v = parseFloat(node.dataset.creep || node.textContent.replace(/[^\d.]/g, '')) || 1;
      every(ms, () => {
        v += Math.random() * step;
        node.textContent = prefix + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      });
    });
  }

  function cookie({
    text = '🍪 We use cookies, crumbs, and ur webcam. By looking at this site u agree to everything.',
    accept = ['Accept', 'ACCEPT HARDER'],
    reject = 'reject',
    onReject = 'Reject is a premium feature 💎',
  } = {}) {
    const c = el(`<div class="slop-cookie"><p>${text}</p><div>${accept.map((a) => `<button class="slop-btn" data-a>${esc(a)}</button>`).join('')}<button class="slop-btn slop-reject">${esc(reject)}</button></div></div>`);
    c.addEventListener('click', (e) => {
      if (e.target.matches('[data-a]')) return c.remove(), toast('thank u 🙏 ur data is now ours');
      if (e.target.matches('.slop-reject')) {
        toast(onReject);
        e.target.style.transform = `translate(${rnd(-160, 160)}px, ${rnd(-60, 0)}px) scale(.8)`;
      }
    });
    document.body.appendChild(c);
  }

  // "Someone in Ohio just cried 12 seconds ago"
  function proof({ places = ['Ohio', 'a Walmart parking lot', 'the Moon', "Steve's basement"], actions = ['bought Pro', 'cried', 'became famous (lie)'], template, ms = 9000 } = {}) {
    const p = document.body.appendChild(el('<div class="slop-proof" aria-live="polite"></div>'));
    const show = () => {
      p.textContent = template ? template() : `🔔 Someone in ${pick(places)} just ${pick(actions)} ${rnd(1, 59)} seconds ago`;
      p.classList.remove('show');
      void p.offsetWidth;
      p.classList.add('show');
    };
    setTimeout(show, 3000);
    every(ms, show);
  }

  function rain(emojis = ['💸', '🪙', '💰'], ms = 400) {
    if (calm) return;
    every(ms, () => {
      const d = document.body.appendChild(el(`<span class="slop-drop" aria-hidden="true">${pick(emojis)}</span>`));
      d.style.left = `${Math.random() * 100}vw`;
      d.style.animationDuration = `${3 + Math.random() * 4}s`;
      setTimeout(() => d.remove(), 7000);
    });
  }

  function exit({ title = '⚠ WAIT!!! ⚠', html = '<p>ur leaving?? 😭😭😭</p><p>here is 0.5% off. final offer. (not final)</p>', buttons = ['OK FINE'] } = {}) {
    let shown = false;
    afterClick(() =>
      document.addEventListener('mouseleave', (e) => {
        if (shown || e.clientY > 10) return;
        shown = true;
        modal({ title, html, buttons });
      }),
    );
  }

  function clippy(lines = ['It looks like ur trying to read. Would u like to stop?'], { face = '📎', first = 20000, ms = 25000 } = {}) {
    const c = el(`<div class="slop-clippy"><div class="slop-bubble"><p></p><button class="slop-btn" data-c>no thx</button></div><div class="slop-clippy-face">${face}</div></div>`);
    document.body.appendChild(c);
    const say = () => ((c.querySelector('p').textContent = pick(lines)), c.classList.add('show'));
    c.addEventListener('click', (e) => e.target.matches('[data-c]') && (c.classList.remove('show'), toast(`${face} I'll be back.`)));
    setTimeout(() => (say(), every(ms, say)), first);
  }

  // Error storm: draggable dialogs; closing one can spawn two more.
  let errorCount = 0;
  function errors(lines = ['Error: Success.', 'Task failed successfully.', 'Keyboard not found. Press F1 to continue.'], n = 1) {
    for (let i = 0; i < n && errorCount < 6; i++) {
      errorCount++;
      const w = el(`<div class="slop-win slop-error" role="alertdialog"><div class="slop-title"><span>Error</span><button class="slop-x" data-e>✕</button></div>
        <div class="slop-body"><span class="slop-error-icon">⛔</span> ${esc(pick(lines))}</div><div class="slop-btns"><button class="slop-btn" data-e>OK</button></div></div>`);
      w.style.left = `${rnd(10, Math.max(10, innerWidth - 320))}px`;
      w.style.top = `${rnd(60, Math.max(60, innerHeight - 220))}px`;
      document.body.appendChild(w);
      drag(w);
      w.addEventListener('click', (e) => {
        if (!e.target.matches('[data-e]')) return;
        w.remove();
        errorCount--;
        if (Math.random() > 0.6) setTimeout(() => errors(lines, 2), 300);
      });
    }
  }

  async function virus(names = ['Trojan.Slop.exe', 'free_robux.bat', 'steve.exe', 'hotdog.dll']) {
    const box = el(`<div><p>Scanning ur computer… <b class="slop-vcount">0</b> threats found</p><div class="slop-bar"><i></i></div><ul class="slop-vlist"></ul></div>`);
    const p = modal({ title: 'SlopGuard Antivirus 2003', html: box.outerHTML, buttons: ['Remove all (requires Pro)'], className: 'slop-virus' });
    await sleep(50);
    const root = $('.slop-virus');
    if (!root) return p;
    for (let i = 1; i <= names.length; i++) {
      await sleep(500);
      root.querySelector('.slop-bar i').style.width = `${(i / names.length) * 100}%`;
      root.querySelector('.slop-vcount').textContent = i * rnd(3, 9);
      root.querySelector('.slop-vlist').insertAdjacentHTML('beforeend', `<li>⚠ ${esc(names[i - 1])}</li>`);
    }
    return p;
  }

  // Captcha that intercepts a form submit. 50% chance it insists you're wrong.
  function captcha(form, { prompt = 'Select all squares with a hotdog', tiles = ['🌭', '🌭', '🐕', '🌭', '🥖', '🌭', '🧱', '🌭', '🌭'], fail = '❌ wrong. one of the hotdogs was a dog. try again' } = {}) {
    let passed = false;
    $(form).addEventListener('submit', async (e) => {
      if (passed) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const html = `<p>${esc(prompt)}</p><div class="slop-captcha">${tiles.map((t) => `<button type="button" class="slop-tile">${t}</button>`).join('')}</div><p class="slop-cmsg"></p>`;
      const pending = modal({ title: 'Are u human?', html, buttons: ['VERIFY'] });
      await sleep(50);
      document.querySelectorAll('.slop-tile').forEach((t) => t.addEventListener('click', () => t.classList.toggle('picked')));
      const v = await pending;
      if (v !== 0) return;
      if (Math.random() > 0.5) return toast(fail);
      toast('✅ ok fine ur human');
      passed = true;
      $(form).requestSubmit();
      passed = false;
    }, true);
  }

  function wheel(prizes = ['1 FREE THING', '47s WITH STEVE'], { title = 'Prize Wheel (not rigged)' } = {}) {
    const slices = Array.from({ length: 8 }, (_, i) => prizes[i % prizes.length]);
    const html = `<div class="slop-wheel-wrap"><div class="slop-pointer">▼</div><div class="slop-wheel">${slices.map((s, i) => `<span style="--i:${i}">${esc(s)}</span>`).join('')}</div></div><p class="slop-wmsg"></p>`;
    const p = modal({ title, html, buttons: ['SPIN'] });
    return p.then(() => toast(`🎉 u won: ${pick(prizes)} (expires in 3 seconds)`));
  }

  const roll = () => !calm && (document.body.classList.add('slop-roll'), setTimeout(() => document.body.classList.remove('slop-roll'), 1000));
  const quake = () => !calm && (document.body.classList.add('slop-quake'), setTimeout(() => document.body.classList.remove('slop-quake'), 800));
  const randomRolls = (chance = 0.1) => afterClick(() => addEventListener('click', () => Math.random() < chance && roll()));

  // Chatbot that ignores what you type.
  function chat({ name = 'SlopBot (online-ish)', avatar = '🤖', greeting = 'hi!!! need help?? i am AI 🤖', replies = ['ok', 'i didnt read that', 'have u tried buying Pro?', 'Steve will get back to u (he wont)'], placeholder = 'type here (i wont read it)' } = {}) {
    const c = el(`<div class="slop-chat"><button class="slop-chat-head">${avatar} ${esc(name)} <b>1</b></button>
      <div class="slop-chat-body"><div class="slop-msg bot">${esc(greeting)}</div></div>
      <form class="slop-chat-form"><input placeholder="${esc(placeholder)}" aria-label="message"><button class="slop-btn">SEND</button></form></div>`);
    document.body.appendChild(c);
    const body = c.querySelector('.slop-chat-body');
    c.querySelector('.slop-chat-head').addEventListener('click', () => c.classList.toggle('open'));
    c.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = c.querySelector('input');
      if (!input.value.trim()) return;
      body.insertAdjacentHTML('beforeend', `<div class="slop-msg me">${esc(input.value)}</div>`);
      input.value = '';
      await sleep(rnd(600, 1800));
      body.insertAdjacentHTML('beforeend', `<div class="slop-msg bot">${esc(pick(replies))}</div>`);
      body.scrollTop = body.scrollHeight;
    });
  }

  function konami(fn = () => (document.body.classList.add('slop-flip'), setTimeout(() => document.body.classList.remove('slop-flip'), 5000))) {
    const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let i = 0;
    addEventListener('keydown', (e) => {
      i = e.key === code[i] ? i + 1 : 0;
      if (i === code.length) (i = 0), fn();
    });
  }

  // The "demo that works badly": loading lines → cursed result → credits run out.
  function demo({ form, output, loading = ['Warming up the AI...', 'Downloading more RAM...', 'Removing quality...', 'Almost done (not really)...'], captions = ['AI confidence: 12%'], render, credits = 3, creditsEl, onResult }) {
    const f = $(form), out = $(output);
    let left = credits;
    const showCredits = () => creditsEl && ($(creditsEl).textContent = left > 0 ? left : '0 (come back in 47h)');
    showCredits();
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (left <= 0) return toast('out of credits. buy Pro. or wait 47h. or both.');
      out.hidden = false;
      out.innerHTML = '<div class="slop-loading"><p></p><div class="slop-bar"><i></i></div></div>';
      for (let i = 0; i < loading.length; i++) {
        out.querySelector('p').textContent = loading[i];
        out.querySelector('.slop-bar i').style.width = `${Math.min(99, ((i + 1) / loading.length) * 100 - rnd(0, 10))}%`;
        await sleep(rnd(500, 1100));
      }
      left--;
      showCredits();
      out.innerHTML = `${render(new FormData(f))}<p class="slop-caption">${esc(pick(captions))}</p>`;
      quake();
      onResult?.(out);
    });
  }

  window.slop = { $, el, pick, rnd, sleep, afterClick, every, toast, modal, drag, counter, creep, cookie, proof, rain, exit, clippy, errors, virus, captcha, wheel, roll, quake, randomRolls, chat, konami, demo };
})();
