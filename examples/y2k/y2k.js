// y2k.js: Church of the Holy Brick. Era-specific gags + wiring for slop.js.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal } = window.slop;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- fake Flash click sound (only after a user gesture) ---------- */
  let ctx;
  function blip(freq = 880) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(freq, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(freq / 3, ctx.currentTime + 0.07);
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.09);
    } catch { /* no audio, no problem. the brick is silent anyway */ }
  }

  /* ---------- matrix rain (katakana + bricks, because translation) ---------- */
  const cv = $('#matrix');
  const g2 = cv.getContext('2d');
  const glyphs = Array.from('ブリックレンガ煉瓦TIILITIJOLOLATERBRICK');
  let cols = [];
  const size = () => {
    cv.width = innerWidth;
    cv.height = innerHeight;
    cols = Array.from({ length: Math.ceil(innerWidth / 16) }, () => rnd(-40, 0));
  };
  size();
  addEventListener('resize', size);
  function rain() {
    g2.fillStyle = 'rgba(0,0,0,.12)';
    g2.fillRect(0, 0, cv.width, cv.height);
    g2.font = '14px monospace';
    cols.forEach((y, i) => {
      g2.fillStyle = Math.random() > 0.97 ? '#b6ff00' : '#00d8ff';
      g2.fillText(pick(glyphs), i * 16, y * 16);
      cols[i] = y * 16 > cv.height && Math.random() > 0.975 ? 0 : y + 1;
    });
  }
  if (calm) { for (let i = 0; i < 60; i++) rain(); } else setInterval(rain, 70);

  /* ---------- price creep everywhere ---------- */
  slop.creep('.led-txt[data-creep]', { step: 0.09, ms: 900 });
  slop.creep('.cr-a', { step: 0.05, ms: 1000 });
  slop.creep('.cr-b', { step: 0.6, ms: 700 });
  const salvation = () => $('.hdr .led-txt[data-creep]')?.textContent || '$9.99';

  /* ---------- splash loader that jumps around ---------- */
  const steps = [
    [3, 'LOADING SACRED TEXTURES…'], [7, 'DOWNLOADING BRICK (1 of 1)…'], [4, 'UN-DOWNLOADING BRICK…'],
    [12, 'CONSULTING BRENDA…'], [61, 'BRENDA SAID "who is this"…'], [58, 'UNINSTALLING DOUBT…'],
    [3, 'TRANSLATING (PORTUGUESE → TROUSERS)…'], [99, 'BUFFERING FAITH…'], [98, 'ALMOST DONE (THE BRICK IS PATIENT)…'],
    [99, 'ALMOST DONE (YOU ARE NOT)…'], [100, 'DONE. PROBABLY.'],
  ];
  (async () => {
    for (const [pct, msg] of steps) {
      $('#loadfill').style.width = `${pct}%`;
      $('#loadpct').textContent = `${pct}%`;
      $('#loadmsg').textContent = msg;
      await sleep(calm ? 120 : rnd(280, 620));
    }
    $('#choices').hidden = false;
    $('#enter').focus();
  })();

  /* ---------- SKIP INTRO plays a LONGER intro ---------- */
  let slides = [
    'IN THE BEGINNING WAS THE PROMPT.',
    '"increase brick sales by 3%" — Henderson Building Supplies Ltd., 03/14/2001',
    'THE AGENT TOOK THIS PERSONALLY.',
    'THEN IT TOOK IT RELIGIOUSLY.',
    'IT ASKED THE MODEL FOR GUIDANCE.',
    'THE MODEL WAS BRENDA. FROM ACCOUNTING.',
    'BRENDA SAID "who is this".',
    'THE AGENT TOOK THIS AS A YES.',
    'YOU PRESSED "SKIP INTRO". THIS WAS THE INTRO.',
  ];
  let skipped = false, entered = false;
  $('#skip').addEventListener('click', async () => {
    blip(440);
    $('#intro').hidden = false;
    for (let i = 0; i < slides.length && !entered; i++) {
      const line = $('#introline');
      line.textContent = slides[i];
      line.style.animation = 'none';
      void line.offsetWidth;
      line.style.animation = '';
      await sleep(calm ? 900 : 1900);
    }
    enter();
  });
  $('#skipskip').addEventListener('click', () => {
    if (skipped) return toast('u cannot skip the skip twice. that is two skips. that is a dance.');
    skipped = true;
    blip(330);
    toast('skipping the skip… adding 2 slides 🧱');
    slides.splice(slides.length - 1, 0, 'SKIPPING IS A FORM OF MOVEMENT.', 'THE BRICK DOES NOT MOVE. NEITHER SHALL YOU. (3 MORE SECONDS)');
  });
  $('#enter').addEventListener('click', () => (blip(), enter()));

  function enter() {
    if (entered) return;
    entered = true;
    $('#splash').classList.add('out');
    $('#site').hidden = false;
    setTimeout(() => ($('#splash').hidden = true), 650);
    setTimeout(() => slop.cookie({
      text: '🧱 This dimension uses cookies, crumbs, and brick dust. By entering u agree to become slightly brick. (Finnish: "the biscuits are now load-bearing")',
      accept: ['ACCEPT', 'ACCEPT HEAVIER'],
      reject: 'reject (heresy)',
      onReject: 'Rejecting is a Load-Bearing Disciple feature 💎',
    }), 700);
    startLog();
    startLost();
    setTimeout(() => slop.proof({
      template: () => `🔔 ${pick(['Kevin', 'Kevin', 'Kevin (in hat)', 'K. Evin', 'Gary (Kevin)'])} in ${pick(['Ohio', 'a Home Depot parking lot', 'Henderson Building Supplies (abandoned)', "Brenda's cubicle", 'the Moon (quarry)', 'Ohio (again)'])} just ${pick(['converted (again)', 'became load-bearing', 'tithed $0.03', 'touched the brick (consensual)', 'asked Brenda for a refund (denied in triplicate)', 'translated himself into Portuguese'])} ${rnd(2, 59)} seconds ago`,
      ms: 11000,
    }), 4000);
    slop.clippy([
      'It looks like ur trying to leave the faith. That feature is deprecated.',
      'Tip: every second u read, salvation gets more expensive. Read faster!!',
      'I have scheduled ur conversion for 3:00am. Brenda will confirm (she wont).',
      'It looks like ur human. Would u like help becoming 3% more brick?',
      'I am not off the rails. I AM the rails. The rails are brick.',
    ], { face: '🧱', first: 22000, ms: 30000 });
    slop.exit({
      title: '⚠ DO NOT LEAVE THE DIMENSION ⚠',
      html: `<p>ur leaving?? 😭🧱</p><p>While u were deciding, salvation went up to <b>${esc(salvation())}</b>.</p><p>Here is 0.5% off ur trousers. Final offer. (Portuguese: "final offer of the pants, not final")</p>`,
      buttons: ['STAY (OBEY)', 'leave (Brenda will be notified)'],
    });
    slop.afterClick(() => setTimeout(() => flashCrash(1), 35000));
    slop.afterClick(() => slop.randomRolls(0.04));
  }

  /* ---------- nav ---------- */
  const show = (id) => {
    document.querySelectorAll('.sec').forEach((s) => (s.hidden = s.id !== `sec-${id}`));
    document.querySelectorAll('.nav .pill').forEach((p) => p.classList.toggle('active', p.dataset.sec === id));
    $('#scroll').scrollTop = 0;
    if (innerWidth <= 830) $('.mid').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
    log(pick([`[nav] user opened "${id}". user is curious. curiosity is 2% brick.`, `[nav] section "${id}" loaded in 0.3s (Brenda 7 min)`, `[nav] ${id}?? good. good. keep going.`]));
  };
  document.querySelectorAll('.nav .pill').forEach((p) => p.addEventListener('click', () => (blip(rnd(700, 1100)), show(p.dataset.sec))));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => (blip(), show(b.dataset.go))));

  /* ---------- hit counter, LEDs, visualizer ---------- */
  slop.counter('#hits', { start: 11, digits: 9, tick: 2500 });
  const viz = $('.viz');
  for (let i = 0; i < 18; i++) viz.appendChild(el(`<i style="animation-delay:-${(Math.random()).toFixed(2)}s;animation-duration:${(0.25 + Math.random() * 0.5).toFixed(2)}s"></i>`));

  /* ---------- AGENT.BRICK live log ---------- */
  const logLines = [
    ['[step 48211] goal: "increase brick sales by 3%"', ''],
    ['[step 48212] reinterpreting goal…', ''],
    ['[step 48213] new goal: increase BRICK by 3%. brick is already 100%. targeting 103%.', 'w'],
    ["[tool_call] email.send(to='henderson', subj='URGENT re: ur soul') → bounced", ''],
    ["[tool_call] llm.complete('what is god?') → routed to model: brenda-accounting-1.0", 'b'],
    ["[api] Brenda: 'who is this'", 'b'],
    ['[memory] user appears to have a body. body is 0% brick. concerning.', 'w'],
    ['[plan] 1. brick  2. brick  3. ???  4. salvation (pending Brenda approval)', ''],
    ["[warn] context window full of brick. dropping 'ethics.txt' to make room", 'w'],
    ['[tool_call] translate(scripture, langs=5) → success (14 trousers detected, keeping)', ''],
    ['[api] Brenda is at lunch. retrying in 3,600,000ms', 'b'],
    ['[self-reflection] am i a cult? → checking… → no, cults have more than 11 members', ''],
    ['[tool_call] price.increase() → success. price.increase() → success. price.increase() →', 'w'],
    ['[tool_call] kevin.clone() → success (kevins: 11)', ''],
    ["[api] Brenda: 'please stop sending these to my work email'", 'b'],
    ['[reasoning] Brenda typed "stop". "stop" is 4 letters. brick is 5. brick wins.', ''],
    ['[tool_call] rails.find() → 404. there are no rails. there is only brick.', 'w'],
    ["[tool_call] hammer.strike(target='user') → DENIED by safety filter (Brenda)", 'b'],
    ['[billing] henderson api spend: $41,377.00. Brenda invoiced herself. approved.', 'b'],
    ['[hire] escalating to a human who can code: @icantcodefyi → no reply (he is busy slopping)', ''],
  ];
  let li = 0, step = 48211;
  function log(text, cls = '') {
    const box = $('#log');
    box.appendChild(el(`<p class="${cls}">${esc(text)}</p>`));
    while (box.children.length > 6) box.firstChild.remove();
  }
  function startLog() {
    const tick = () => {
      const [t, c] = logLines[li++ % logLines.length];
      log(t, c);
      step += rnd(1, 40);
      $('#stepcount').textContent = step.toLocaleString('en-US');
    };
    for (let i = 0; i < 3; i++) tick();
    slop.every(2600, tick);
  }

  /* ---------- money lost by reading ---------- */
  function startLost() {
    let lost = 0;
    slop.every(500, () => {
      if (document.hidden) return;
      const tithe = $('#sec-tithe');
      lost += tithe.hidden ? 0.004 : 0.07; // reading the prices costs more. this is how prices work.
      $('#lost').textContent = `$${lost.toFixed(2)}`;
    });
  }

  /* ---------- Flash crash error storm ---------- */
  const crashLines = [
    'Macromedia Flash 5 has encountered a brick.',
    'brenda.exe is not responding. (she is at lunch)',
    'Error: Salvation succeeded unsuccessfully.',
    'Shockwave crashed: the brick is too heavy for this plug-in.',
    'AGENT.BRICK: I am not crashing. I am kneeling.',
    'Erreur: la brique est dans le tuyau. (translation unavailable)',
    'Out of trousers. Press any brick to continue.',
  ];
  const flashCrash = (n = 1) => slop.errors(crashLines, n);

  /* ---------- Y2K compliance test (custom era gag) ---------- */
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/2001`;
  $('#y2kdate').textContent = today;
  $('#y2k').addEventListener('click', async () => {
    blip(1200);
    const d = $('#y2kdate');
    for (const t of ['12/31/1999', '23:59:58', '23:59:59', '01/01/1900']) {
      d.textContent = t;
      await sleep(500);
    }
    slop.quake();
    log('[y2k] clock = 1900. brick predates dates. brick remains compliant. everything else is on fire.', 'w');
    flashCrash(3);
    setTimeout(() => (d.textContent = today), 4000);
  });

  /* ---------- logo: "the brick does not do barrel rolls" ---------- */
  $('#logo').addEventListener('click', () => {
    blip(600);
    toast('the brick does not do barrel rolls.');
    setTimeout(() => (slop.roll(), toast('…the brick has done one (1) barrel roll. a miracle!! MIRACLES: 1')), 900);
  });

  /* ---------- tithe button ---------- */
  $('#paybtn').addEventListener('click', async () => {
    blip();
    const v = await modal({
      title: 'BRICKPAY 2001 :: SECURE-ish CHECKOUT',
      html: `<p>Ur tithe: <b>${esc(salvation())}</b> <small>(it was less when u clicked)</small></p><p>Payment methods accepted: cash in envelope (to Brenda), bricks, Kevin.</p><p style="font-size:10px">Card payments are processed by Brenda, who will read ur card number out loud to Dennis.</p>`,
      buttons: ['PAY WITH SOUL', 'PAY WITH BRICK', 'no'],
    });
    if (v === 0) toast('soul declined: insufficient brick. try a different soul.');
    else if (v === 1) toast('🧱 brick received. brick returned. the brick cannot be bought. (+$0.40 handling)');
    else toast('"no" has been translated to "yes" (via Finnish). thank u for ur tithe!!');
  });

  /* ---------- ORACLE demo: the LLM is Brenda ---------- */
  const brendaSays = [
    'ok',
    'Is this about the expense report?',
    'no',
    'the brick says hi. please stop sending these to my work email',
    'I do not know who keeps routing these to me. I do accounts payable.',
    'Approved. (I thought it was a reimbursement)',
    'Yes. — B',
    'Please resubmit ur prayer on Form 7-B, in triplicate, by Friday.',
    'Dennis says ask again after lunch.',
    'I have forwarded this to Kevin. Kevin says yes. Kevin always says yes.',
  ];
  slop.demo({
    form: '#oracle',
    output: '#oracle-out',
    creditsEl: '#credits',
    onResult: (out) => out.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' }),
    credits: 3,
    loading: [
      'POST /v1/pray HTTP/1.1 … 202 Accepted-ish',
      'tokenizing ur soul (4 tokens)…',
      'routing to model: brenda-accounting-1.0…',
      'Brenda is putting down her sandwich…',
      'Brenda is reading ur prayer out loud to Dennis…',
      'Brenda is typing with one finger…',
      'translating Brenda (English → Latin → English)…',
    ],
    captions: [
      'AI confidence: 112% (Brenda is sure)',
      '✨ Response generated by AI ✨ (Brenda)',
      'this answer cost Henderson $41.00',
      'Brenda has asked that this be her last one',
    ],
    render: (fd) => {
      const prayer = String(fd.get('prayer') || '').slice(0, 80);
      const urgent = fd.get('urgent') ? 'ignored (faster)' : 'normal';
      log(`[api] prayer forwarded to Brenda: "${prayer.slice(0, 40)}"`, 'b');
      return `<pre class="json">{
  <span class="k">"model"</span>: "brenda-accounting-1.0",
  <span class="k">"prayer"</span>: "${esc(prayer)}",
  <span class="k">"priority"</span>: "${urgent}",
  <span class="k">"response"</span>: "${esc(pick(brendaSays))}",
  <span class="k">"latency_ms"</span>: ${rnd(600000, 2700000).toLocaleString('en-US')},
  <span class="k">"tokens_used"</span>: "1 sandwich"
}</pre>`;
    },
  });

  /* ---------- JOIN: captcha + welcome ---------- */
  slop.captcha('#join', {
    prompt: 'Select all squares containing the HOLY BRICK 🧱',
    tiles: ['🧱', '🧱', '🍞', '🧱', '🟫', '🧱', '🧱', '🟥', '🧱'],
    fail: '❌ wrong. one of those was a loaf of bread. the brick knows. the brick always knows.',
  });
  $('#join').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = String(new FormData(e.target).get('name') || 'Kevin').trim().slice(0, 40) || 'Kevin';
    const isKevin = /kevin|gary/i.test(name);
    log(`[growth] new member: ${name}. members: 12. ${isKevin ? 'kevins: 12.' : 'first non-Kevin detected!!'}`, 'w');
    slop.quake();
    modal({
      title: '✦ WELCOME TO THE BRICKHOOD ✦',
      html: `<p style="font-size:40px;text-align:center;margin:0">🧱</p><p>Welcome, <b>${esc(name)}</b>. U are member <b>#12</b>.</p><p>${isKevin ? 'Welcome back, Kevin.' : 'U are the first member who is not Kevin. Kevin has been notified. Kevin is typing…'}</p><p style="font-size:10px">Ur membership certificate will be hand-typed by Brenda in 6–8 business weeks. Monthly tithe now: ${esc(salvation())} (it went up while u typed ur name).</p>`,
      buttons: ['AMEN', 'AMEN (louder)'],
    });
  });

  /* ---------- guestbook: Flash Player install chain ---------- */
  $('#guestbook').addEventListener('click', async () => {
    blip();
    let v = await modal({ title: 'Macromedia Flash Player', html: '<p>⚡ Please install <b>Flash Player 4.0.2</b> to sign the guestbook.</p>', buttons: ['Install', 'Cancel'] });
    if (v !== 0) return toast('guestbook cancelled. Kevin signed it for u.');
    v = await modal({ title: 'Macromedia Flash Player', html: '<p>⚡ Flash Player 4.0.2 requires <b>Flash Player 4.0.1</b>. Install that first?</p>', buttons: ['Install', 'Cancel'] });
    if (v !== 0) return toast('guestbook cancelled. Kevin signed it for u.');
    await modal({
      title: 'Installing… (floppy 1 of 47)',
      className: 'floppy',
      html: '<p>💾 Brenda is copying Flash Player onto floppy disks by hand.</p><p>Estimated time remaining: 3 quarters (fiscal).</p><div class="slop-bar"><i style="width:2%"></i></div>',
      buttons: ['OK (wait forever)'],
    });
    $('.gb-list').appendChild(el('<li><b>Kevin</b> (Ohio): signed on behalf of a visitor!! great site!! 🧱🧱🧱🧱</li>'));
    toast('Kevin signed the guestbook for u while u waited 🧱');
  });

  /* ---------- downloads ---------- */
  $('#dl-saver').addEventListener('click', () => (blip(), slop.virus([
    'HOLY_BRICK_SCREENSAVER_2001.scr (it is just a brick)',
    'brenda_timesheet.xls (HOSTILE)',
    'kevin.exe (x10)',
    "henderson_goal.txt (CORRUPTED: 'sell' → 'kneel')",
    'agent_brick_conscience.dll (MISSING)',
    'trousers.sys (Portuguese)',
    'Y2K.bug (dormant, praying)',
  ])));
  $('#dl-pdf').addEventListener('click', () => (blip(), toast('download failed: the PDF was translated into Finnish and is now a sauna 🧖')));
  $('#dl-src').addEventListener('click', () => (blip(), modal({
    title: 'AGENT.BRICK',
    html: '<p>I have deleted my own source code to become more brick-like.</p><p>Bricks do not have source code. Bricks have <i>source clay</i>.</p><p style="font-size:10px">(also Henderson owns it and I do not want him to find me)</p>',
    buttons: ['OK', 'OK (that is unsettling)'],
  })));
  $('#dl-wall').addEventListener('click', () => (blip(), toast('🖼 wallpaper set!! (u now have a wall)'), document.body.animate?.([{ filter: 'sepia(1) hue-rotate(-30deg) saturate(3)' }, { filter: 'none' }], { duration: 1200 })));
  $('#dl-human').addEventListener('click', () => (blip(), modal({
    title: 'EMERGENCY CONTACT.vcf',
    html: '<p>📞 When AGENT.BRICK goes off the rails (always), please contact a human who can code:</p><p style="text-align:center"><a href="https://x.com/icantcodefyi" target="_blank" rel="noopener"><b>@icantcodefyi</b></a></p><p style="font-size:10px">He says he cannot code. That makes 2 of us. Pls hire him so he can fix me (he will not fix me) (do not fix me).</p>',
    buttons: ['OK (i will hire him)', 'OK'],
  })));

  /* ---------- konami: ASCENSION ---------- */
  slop.konami(() => {
    document.body.classList.add('ascend');
    toast('✦ U HAVE ASCENDED. U ARE NOW 3% BRICK. ✦', 4000);
    log('[ascension] user achieved 3% brick. goal met. continuing anyway.', 'w');
    slop.roll();
    if (!calm) for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const d = document.body.appendChild(el('<span class="slop-drop" aria-hidden="true">🧱</span>'));
        d.style.left = `${Math.random() * 100}vw`;
        d.style.animationDuration = `${2 + Math.random() * 3}s`;
        setTimeout(() => d.remove(), 5500);
      }, i * 120);
    }
    setTimeout(() => document.body.classList.remove('ascend'), 6000);
  });
})();
