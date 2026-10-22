// PrinterTok: era-specific gags for the brainrot-feed school project. Needs slop.js loaded first.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal } = slop;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const feed = $('#feed');
  const phone = $('.phone');
  const slides = [...document.querySelectorAll('.slide')];

  /* ---------- apology census (taken before any popup adds more) ---------- */
  const sorries = (document.body.textContent.match(/\b(sorry|apolog\w*)\b/gi) || []).length;
  $('#sorryCount').textContent = `${sorries} (sorry)`;

  /* ---------- aura meter ---------- */
  let aura = 0;
  function addAura(n, why) {
    aura += n;
    const sign = n >= 0 ? '+' : '';
    $('#auraNum').textContent = aura.toLocaleString();
    const pill = $('#auraPill');
    pill.classList.toggle('neg', aura < 0);
    pill.classList.toggle('pos', aura > 0);
    $('#meterNum').textContent = `${aura.toLocaleString()} aura`;
    $('#meterFill').style.width = `${Math.max(3, Math.min(100, 50 + aura / 80))}%`;
    const pop = el(`<div class="aura-pop ${n < 0 ? 'neg' : ''}">${sign}${n} aura<br><small>${esc(why)}</small></div>`);
    phone.appendChild(pop);
    setTimeout(() => pop.remove(), 1400);
    const log = $('#auraLog');
    log.insertAdjacentHTML('afterbegin', `<li class="${n < 0 ? 'neg' : 'pos'}">${sign}${n} aura: ${esc(why)}</li>`);
    while (log.children.length > 8) log.lastElementChild.remove();
  }
  $('#auraPill').addEventListener('click', () => addAura(-67, 'checked ur own aura'));

  /* ---------- gameplay + captions ---------- */
  const games = {
    subway: () => `<div class="city"></div><div class="ground"></div>
      <svg class="rails" viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#e8e8e8" stroke-width=".8" vector-effect="non-scaling-stroke">
      <line x1="44.6" y1="0" x2="4" y2="100"/><line x1="46.6" y1="0" x2="28" y2="100"/><line x1="49" y1="0" x2="40" y2="100"/>
      <line x1="51" y1="0" x2="60" y2="100"/><line x1="53.4" y1="0" x2="72" y2="100"/><line x1="55.4" y1="0" x2="96" y2="100"/></g>
      <g stroke="#3a2a1a" stroke-width="2" vector-effect="non-scaling-stroke"><line x1="47.8" y1="0" x2="34" y2="100"/><line x1="52.2" y1="0" x2="66" y2="100"/></g></svg>
      <div class="obs l">🚃</div><div class="obs m d1">🪙</div><div class="obs r d2">🚧</div><div class="obs m d3">🖨️</div>
      <div class="runner"><span>🏃</span></div><div class="cop">👮🐕</div>
      <div class="hud">${String(rnd(1000, 99999)).padStart(6, '0')} · 🪙 ${rnd(6, 67)} · x6-7</div>`,
    minecraft: () => `<div class="mc-sun"></div><div class="mc-cloud"></div><div class="void"></div><div class="ground"></div>
      <div class="blk l"></div><div class="blk m d1 gold"></div><div class="blk r d2"></div>
      <div class="cross">+</div><div class="arm"></div><div class="xp"><i></i></div>
      <div class="hud">PARKOUR LVL 67 · 📄 ${rnd(0, 3)}/500</div>`,
  };
  slides.forEach((s) => {
    const g = s.querySelector('.game');
    g.classList.add(s.dataset.game);
    g.setAttribute('aria-hidden', 'true');
    g.innerHTML = games[s.dataset.game]();
    const words = s.dataset.cap.split(/\s+/);
    const cap = el(`<div class="cap" aria-hidden="true"></div>`);
    g.appendChild(cap);
    s._cap = { cap, words, i: 0 };
  });

  // Word-by-word captions: 3-word chunks, active word yellow, loops while the slide is on screen.
  let active = slides[0];
  function tickCaption() {
    const c = active._cap;
    if (c.i >= c.words.length + 3) c.i = 0;
    if (c.i < c.words.length) {
      const start = c.i - (c.i % 3);
      const chunk = c.words.slice(start, start + 3);
      c.cap.innerHTML = chunk.map((w, k) => `<span class="${start + k === c.i ? 'on' : ''}">${esc(w)}</span>`).join(' ');
    } else c.cap.innerHTML = '';
    c.i++;
  }
  setInterval(tickCaption, calm ? 900 : 360);

  /* ---------- which video is on screen ---------- */
  const liked = new Set();
  const seen = new Set([0]);
  function setActive(s) {
    if (active === s && s.classList.contains('on')) return;
    slides.forEach((x) => x.classList.toggle('on', x === s));
    active = s;
    active._cap.i = 0;
    const idx = slides.indexOf(s);
    $('#partNum').textContent = `${idx + 1}/${slides.length}`;
    $('#likeNum').textContent = liked.has(idx) ? `${s.dataset.likes}+1` : s.dataset.likes;
    $('#rLike').classList.toggle('liked', liked.has(idx));
    $('#rLike .ri').textContent = liked.has(idx) ? '❤️' : '🤍';
    if (!seen.has(idx)) {
      seen.add(idx);
      if (idx === slides.length - 1) addAura(1000, 'watched the whole project (Brayden didnt)');
      else addAura(rnd(10, 99), 'did not scroll past');
    }
  }
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target)), { root: feed, threshold: 0.6 });
  slides.forEach((s) => io.observe(s));
  setActive(slides[0]);
  feed.focus({ preventScroll: true });
  const goTo = (i) => slides[i].scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });

  /* ---------- right rail ---------- */
  $('#rLike').addEventListener('click', () => {
    const idx = slides.indexOf(active);
    if (liked.has(idx)) { liked.delete(idx); addAura(-67, 'unliked a school project'); }
    else { liked.add(idx); addAura(67, 'liked homework'); }
    active.classList.remove('on'); setActive(active);
  });
  $('#rCom').addEventListener('click', () => { goTo(8); toast('💬 comments are the FAQ. every answer is no. sorry'); });
  $('#rShare').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); } catch (e) { /* the joke works either way */ }
    toast('🔗 link copied. send to Mrs. Kowalski. (sorry)');
    addAura(10, 'shared homework');
  });
  $('#rDisc').addEventListener('click', () => toast('🎵 now playing: tung tung tung (printer warming up) · 9:47'));
  $('#rFollow').addEventListener('click', (e) => {
    const b = e.currentTarget;
    if (b.classList.contains('done')) return toast('u already follow the printer. it does not follow back.');
    b.classList.add('done'); b.querySelector('i').textContent = '✓';
    addAura(100, 'followed a printer');
  });
  $('#rInk').addEventListener('click', async () => {
    const v = await modal({
      title: '🩵 Genuine Cyan Cartridge',
      html: `<p style="font-size:3rem;text-align:center;margin:0">🩵🖨️</p><p>Prints <b>3 pages</b>. Required to print black. Price goes up while this window is open. Sorry, that is just how ink works.</p><p class="tiny">Is it worth it? no.</p>`,
      buttons: ['BUY (no)', 'close (sorry)'],
    });
    if (v === 0) { toast('❌ ur card was declined by the printer'); addAura(-300, 'tried to buy ink'); }
  });

  /* ---------- live chat overlay ---------- */
  const users = ['@xX_ohio_Xx', '@mrs_kowalski_rm12', '@steve_ms_paint', '@brayden.real', '@tralalero_fan', '@hp_support (bot)', '@gutenberg1440', '@pta_mom_deb', '@sigma_toner', '@greg_regional_ops'];
  const lines = ['chat is this real', 'W printer', 'L printer', 'PC LOAD LETTER 💀', 'who is steve', 'STEVE W 🎨', 'my printer did this too 😭', 'ratio', 'is this the history of the printer or greg\'s weekend', 'greg stop saying sorry', 'gutenberg aura +1000', '6 7', 'first', 'mrs kowalski is watching 👀', 'cyan is not real', 'brayden fell off', 'tung tung tung in tray 2', 'fanum taxed ur ink', 'is this on the test', 'ink more expensive than my rent', 'skibidi stampante 🗣️', 'bro got cooked by a printer'];
  const special = { '@steve_ms_paint': ['still drawing the fax machine', 'what color is a fax', 'used the bucket tool. sorry about the green'], '@greg_regional_ops': ['sorry', 'sorry chat', 'no', 'lets take this offline. sorry'], '@hp_support (bot)': ['have u tried genuine HP ink', 'ur cartridge is not genuine'] };
  const lc = $('#liveChat');
  function chatLine() {
    const u = pick(users);
    const t = special[u] ? pick(special[u]) : pick(lines);
    const d = el(`<div><b>${esc(u)}</b>${esc(t)}</div>`);
    lc.appendChild(d);
    [...lc.children].forEach((c, i, a) => c.classList.toggle('old', i < a.length - 2));
    while (lc.children.length > 4) lc.firstElementChild.remove();
  }
  chatLine(); setInterval(chatLine, 1700);

  /* ---------- For You sidebar ---------- */
  document.querySelectorAll('[data-v]').forEach((li) => li.addEventListener('click', () => {
    toast(pick(['this video is not available in Ohio', 'video removed: too educational', 'loading… (it\'s the printer\'s wifi)', 'Brayden has blocked u (sorry)']));
    addAura(-20, 'clicked a different video');
  }));

  /* ---------- Steve status creep ---------- */
  let steve = 37;
  setInterval(() => {
    steve = steve >= 99 ? 12 : steve + rnd(0, 2);
    $('#steveBar').style.width = `${steve}%`;
    $('#steveTxt').textContent = steve === 12 ? '12% (Steve hit Ctrl+Z 40 times. sorry)' : `${steve}% (since Thursday)`;
  }, 2500);

  /* ---------- demo: try to print ---------- */
  let prints = 0;
  slop.demo({
    form: '#printForm',
    output: '#printOut',
    credits: 3,
    creditsEl: '#inkLeft',
    loading: ['Contacting printer…', 'Printer found. Printer pretending not to see u…', 'Installing driver (4.2 GB)…', 'Cyan low. Black printing needs cyan. (this is real)', 'tung tung tung tung tung…', 'Feeding paper (it is eating it)…'],
    captions: ['Printed ½ of 1 page. Status: PC LOAD LETTER', 'print quality: "Draft" (forever)', 'Printer sold ur data to the cartridge. sorry.', 'AI confidence this is a printer: 12%'],
    render(fd) {
      const t = esc(fd.get('txt') || 'untitled');
      const pr = String(fd.get('pr'));
      if (pr.startsWith('Steve')) return `<div class="page steve"><h4>${t}</h4><p>(Steve is drawing it by hand in MS Paint. ETA: Thursday.)</p><span class="jam">STEVE IS ON LUNCH</span></div>`;
      if (pr.startsWith('Microsoft')) return `<div class="page pdf"><h4>${t}</h4><span class="jam">saved to: ??? (nowhere)</span></div>`;
      return `<div class="page"><h4>${t}</h4><p>by Brayden P. Grade 4 · The printing press was invented in 14</p><p>${'▓'.repeat(rnd(4, 14))} cyan missing ${'▓'.repeat(rnd(2, 9))}</p><span class="jam">${pick(['PAPER JAM', 'PC LOAD LETTER', 'OUT OF CYAN'])}</span></div>`;
    },
    onResult(out) {
      const top = out.closest('.top');
      top.scrollTo({ top: top.scrollHeight, behavior: calm ? 'auto' : 'smooth' });
      prints++;
      addAura(-100, 'tried to print at home');
      if (prints >= 3) {
        setTimeout(() => {
          slop.errors(['PC LOAD LETTER', 'Paper jam in Tray 2. There is no Tray 2.', 'Printer is offline. It can see you.', 'Error: Printed successfully. (nothing came out)', 'Cyan low. Black disabled out of spite.', 'Steve.exe is drawing. Please wait.'], 2);
          modal({ title: '🖨️ Stampantino Inchiostrino', html: '<p>Out of ink. Would u like to buy more ink?</p><p class="tiny">(the only answer is no. this was in the FAQ. sorry.)</p>', buttons: ['no', 'no (sorry)'] });
        }, 900);
      }
    },
  });

  /* ---------- MS Paint: help Steve ---------- */
  const cv = $('#paintCv');
  const ctx = cv.getContext('2d');
  const colors = ['#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3', '#b97a57', '#ffaec9'];
  let color = '#000000', tool = 'pencil', drawing = false, last = null, sized = false;
  const pal = $('#paintPal');
  colors.forEach((c, i) => pal.insertAdjacentHTML('beforeend', `<button type="button" style="background:${c}" data-c="${c}" aria-label="color ${c}" class="${i ? '' : 'on'}"></button>`));
  pal.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    color = b.dataset.c;
    pal.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
  });
  $('#paintTools').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tool]'); if (!b) return;
    tool = b.dataset.tool;
    $('#paintTools').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    if (tool === 'bucket') toast('🪣 Steve\'s bucket tool leaks. it fills everything. sorry');
  });
  function stevesFax() {
    const w = cv.width, h = cv.height;
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 3; ctx.strokeStyle = '#000';
    ctx.fillStyle = '#c3c3c3'; ctx.fillRect(w * .25, h * .35, w * .4, h * .4); ctx.strokeRect(w * .25, h * .35, w * .4, h * .4);
    ctx.fillStyle = '#fff'; ctx.fillRect(w * .32, h * .15, w * .2, h * .22); ctx.strokeRect(w * .32, h * .15, w * .2, h * .22);
    ctx.beginPath(); ctx.moveTo(w * .25, h * .45); ctx.bezierCurveTo(w * .1, h * .3, w * .12, h * .8, w * .2, h * .6); ctx.stroke();
    ctx.font = '14px "Comic Sans MS", cursive'; ctx.fillStyle = '#ed1c24'; ctx.fillText('FAX MASHEEN (1/2 done)', 8, 16);
    ctx.fillStyle = '#7f7f7f'; ctx.font = '11px "Comic Sans MS", cursive'; ctx.fillText('-steve. pls finish. sorry', w - 150, h - 8);
  }
  function sizeCanvas() {
    const r = cv.getBoundingClientRect();
    if (!r.width) return;
    cv.width = Math.round(r.width); cv.height = Math.round(r.height);
    stevesFax(); sized = true;
  }
  new ResizeObserver(() => { if (!sized || Math.abs(cv.width - cv.clientWidth) > 4) sizeCanvas(); }).observe(cv);
  const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)]; };
  function paintAt(p) {
    if (tool === 'spray') {
      ctx.fillStyle = color;
      for (let i = 0; i < 14; i++) ctx.fillRect(p[0] + rnd(-9, 9), p[1] + rnd(-9, 9), 1.5, 1.5);
      return;
    }
    ctx.strokeStyle = tool === 'eraser' ? '#fff' : color;
    ctx.lineWidth = tool === 'eraser' ? 14 : 3; ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(...(last || p)); ctx.lineTo(...p); ctx.stroke();
    last = p;
  }
  cv.addEventListener('pointerdown', (e) => {
    if (tool === 'bucket') { ctx.fillStyle = color; ctx.fillRect(0, 0, cv.width, cv.height); addAura(-50, 'used the bucket tool'); return; }
    drawing = true; last = null; cv.setPointerCapture(e.pointerId); paintAt(pos(e));
  });
  cv.addEventListener('pointermove', (e) => drawing && paintAt(pos(e)));
  addEventListener('pointerup', () => { drawing = false; last = null; });
  $('#paintClear').addEventListener('click', () => { stevesFax(); toast('😭 Steve is crying (he had a backup) (it was on a floppy)'); });
  $('#paintSend').addEventListener('click', async () => {
    const thumb = cv.toDataURL('image/png');
    const verdict = pick(['"that is a toaster." — Steve', '"fax machines dont have legs." — Steve', '"perfect. putting it in. sorry." — Steve', '"i will redo it by hand. again." — Steve']);
    await modal({ title: '📨 Steve reviewed ur drawing', html: `<img src="${thumb}" alt="your drawing" style="width:100%;border:2px solid #fff;background:#fff;image-rendering:pixelated"><p><b>${esc(verdict)}</b></p><p class="tiny">Fig. 2 will be added to the project. Mrs. Kowalski will think Brayden drew it. Sorry.</p>`, buttons: ['ok', 'ok (pay Steve in pizza)'] });
    addAura(200, 'helped Steve');
  });

  /* ---------- FAQ: ask anything (answer: no) ---------- */
  $('#askForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = e.target.querySelector('input');
    const q = inp.value.trim(); if (!q) return;
    inp.value = '';
    $('#faq').insertAdjacentHTML('afterbegin', `<li><b>@you</b> ${esc(q)}<div class="reply"><b>@greg_regional_ops</b> <span class="creator">Creator</span> <span class="typing">typing…</span></div></li>`);
    addAura(-1000, 'asked a question');
    setTimeout(() => { const t = $('#faq .typing'); if (t) t.outerHTML = 'no'; }, 1200);
  });

  /* ---------- engine gags ---------- */
  slop.cookie({
    text: '🍪 This project uses cookies (Brayden\'s, from his lunchbox — sorry), crumbs, and the printer\'s webcam (it has one now). By swiping u agree.',
    accept: ['Accept', 'ACCEPT HARDER 🗣️'],
    reject: 'reject',
    onReject: 'rejecting is a Steve Tier feature 💎',
  });
  document.addEventListener('click', (e) => {
    if (e.target.matches('.slop-cookie [data-a]')) addAura(-500, 'clicked the cookie banner');
  });

  slop.creep('[data-creep]', { step: 0.06, ms: 1000 });
  slop.creep('[data-creep-fast]', { step: 0.9, ms: 1000 });

  slop.proof({ ms: 11000, template: () => `🔔 ${pick(users)} just ${pick(['followed 🖨️', 'printed 0 pages', 'ran out of cyan', 'duetted this with a paper jam', 'reported this video for being homework', 'gave Brayden an A (lie)', 'stitched this with Gutenberg'])}` });

  setTimeout(async () => {
    const v = await modal({
      title: '📩 Message from Brayden\'s Dad',
      html: '<p>Dear Mrs. Kowalski,</p><p>Please find attached Brayden\'s project on <b>The History of the Printer</b>. It was supposed to be a poster. The printer did not print the poster. So it is a TikTok now. Brayden says this is "how people learn now."</p><p>I am so sorry.</p><p class="tiny">— Greg P., Regional Operations Manager (Midwest), Dad</p>',
      buttons: ['OK', 'OK (A+ for Brayden)'],
    });
    if (v === 1) addAura(500, 'gave an A+ (lie)');
    else addAura(-10, 'did not give an A+');
  }, 3500);

  slop.clippy([
    'It looks like ur trying to print. Would u like to jam instead?',
    'I\'m out of cyan. I know u printed black. I don\'t care.',
    'Did u know: Gutenberg\'s press never needed a firmware update. I need 4.',
    'tung tung tung tung (this is me warming up for 9 minutes)',
    'Tip: Steve can draw this tip by hand. ETA Thursday.',
  ], { face: '🖨️', first: 22000, ms: 30000 });

  slop.chat({
    name: 'DM Greg (in a meeting)',
    avatar: '👔',
    greeting: 'hi. sorry. is this about the project? the answer is no. sorry',
    replies: ['no', 'no. sorry', 'sorry, in a 1:1. also no', 'lets circle back. (no)', 'per my last message: no', 'Steve will get back to u (he is drawing)'],
    placeholder: 'ask Greg anything (answer: no)',
  });

  slop.exit({
    title: 'ur leaving?? 😭😭',
    html: '<p>sorry. SORRY. Brayden needs 4 more views to pass Grade 4.</p><p>here is 0.5% off cyan ink. final offer. (not final)</p>',
    buttons: ['ok fine (stay)', 'leave anyway (-500 aura)'],
  });

  slop.afterClick(() => {
    setInterval(() => { if (!document.hidden) toast(pick(['🖨️ Printer: PC LOAD LETTER', '🖨️ Printer: paper jam (emotional)', '🖨️ Printer: firmware update available (52 min)', '🖨️ Printer: cyan low (u have not used cyan)', '🖨️ Printer is now offline. it was never online.'])); }, 42000);
  });

  // Konami → mewing mode: the printer spits pages and the captions go cyan.
  slop.konami(() => {
    document.body.classList.add('mewing');
    toast('🤫🧏 MEWING MODE: the printer is mewing. jawline +67. it still won\'t print');
    addAura(6767, 'konami code (mewing)');
    slop.quake();
    if (!calm) {
      for (let i = 0; i < 24; i++) setTimeout(() => {
        const d = document.body.appendChild(el('<span class="slop-drop" aria-hidden="true">📄</span>'));
        d.style.left = `${Math.random() * 100}vw`;
        d.style.animationDuration = `${2 + Math.random() * 3}s`;
        setTimeout(() => d.remove(), 5000);
      }, i * 120);
    }
    setTimeout(() => document.body.classList.remove('mewing'), 8000);
  });

  // Keyboard swiping for desktop (feed is focused; arrows also feed konami).
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    const idx = slides.indexOf(active);
    if (e.key === 'j' && idx < slides.length - 1) goTo(idx + 1);
    if (e.key === 'k' && idx > 0) goTo(idx - 1);
  });
})();
