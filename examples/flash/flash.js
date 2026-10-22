// flash.js — FAXGROUNDS page logic: overlays, runaway RSVP, ads, Brenda, the agent, the Terms.
(() => {
  const { $, toast, modal, pick, rnd, sleep, afterClick } = slop;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = $('#frame'), gov = $('#gov');
  let unlocked = false, firstPlay = true, plays = rnd(48000, 52000);

  // ---------- generic data-toast links ----------
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-toast]');
    if (!a) return;
    if (a.tagName === 'A' && a.getAttribute('href') === '#') e.preventDefault();
    toast(a.dataset.toast, 3400);
  });

  // ---------- running gag #1: the RSVP button runs away ----------
  const dodgeLines = [
    'nope 🏃💨', 'the button is shy', 'AGENT: I gave the button legs. I regret nothing.',
    'Brenda has not approved this click yet', 'the button is also nervous about the party',
    'BOTÓN HUYE (the button escapes, in Portuguese, then Klingon)', 'almost!!! (lie)',
  ];
  function runaway(btn, { area, tries = 5, tired = 'ok fine 😮‍💨 click me', onCatch }) {
    let left = tries, tx = 0, ty = 0, lastType = 'mouse', mx = -1, my = -1;
    const original = btn.innerHTML;
    btn.addEventListener('pointermove', (e) => ((mx = e.clientX), (my = e.clientY)));
    const dodge = () => {
      if (left <= 0) return false;
      left--;
      const r = btn.getBoundingClientRect();
      const baseL = r.left - tx, baseT = r.top - ty;
      const A = area().getBoundingClientRect();
      const minL = Math.max(A.left, 4), maxL = Math.min(A.right, innerWidth - 4) - r.width;
      const minT = Math.max(A.top, 4), maxT = Math.min(A.bottom, innerHeight - 4) - r.height;
      let best = null;
      for (let i = 0; i < 14; i++) {
        const L = minL + Math.random() * Math.max(0, maxL - minL);
        const T = minT + Math.random() * Math.max(0, maxT - minT);
        const far = Math.hypot(L + r.width / 2 - (mx < 0 ? r.left + r.width / 2 : mx), T + r.height / 2 - (my < 0 ? r.top + r.height / 2 : my));
        if (!best || far > best.far) best = { L, T, far };
      }
      tx = best.L - baseL; ty = best.T - baseT;
      btn.style.transform = `translate(${tx}px, ${ty}px)`;
      if (left === 0) {
        btn.classList.add('tired');
        btn.innerHTML = tired;
        toast('the button is tired now. it gives up. like Faxwell.');
      } else toast(pick(dodgeLines), 1500);
      return true;
    };
    btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(); });
    btn.addEventListener('pointerdown', (e) => { lastType = e.pointerType; });
    btn.addEventListener('click', (e) => {
      // keyboard users (detail 0) always get through. touch users get chased a few times.
      if (e.detail !== 0 && lastType !== 'mouse' && left > 0) { e.preventDefault(); dodge(); return; }
      if (left > 0 && e.detail !== 0) toast('😳 u caught it?? the button respects u now');
      onCatch?.(e);
    });
    return { reset() { left = tries; tx = ty = 0; btn.style.transform = ''; btn.classList.remove('tired'); btn.innerHTML = original; } };
  }

  runaway($('#hdrRsvp'), {
    area: () => $('.hdr'),
    tired: '😮‍💨 ok fine. RSVP',
    onCatch: () => {
      $('#game').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
      toast(unlocked ? 'scroll down to the form!! (it also runs)' : 'u must beat the game to RSVP. Brenda\'s rule. 📠', 3400);
    },
  });

  // ---------- game overlays ----------
  const ov = (cls, html) => { gov.className = 'gov ' + cls; gov.innerHTML = html; gov.hidden = false; };
  const hideOv = () => { gov.hidden = true; gov.innerHTML = ''; };

  function titleScreen() {
    ov('title-screen', `
      <div class="big-emo">📠</div>
      <h3>FAXWELL'S LAST FAX</h3>
      <p>a retirement party invitation in the form of a game</p>
      <p class="tr">"catch the leaves. the party it depends on you." — translated ×5</p>
      <button class="fbtn pulse" id="playBtn">▶ PLAY!!!</button>
      <p><small>score ${FaxGame.GOAL} to unlock the RSVP • mouse / finger / ← →</small></p>`);
    $('#playBtn').addEventListener('click', onPlay);
  }

  let busy = false;
  async function onPlay() {
    if (busy) return;
    busy = true;
    try { await playFlow(); } finally { busy = false; }
  }
  async function playFlow() {
    FaxGame.handshake();
    if (firstPlay) {
      firstPlay = false;
      const v = await modal({
        title: 'Faxwave Player 9 required',
        html: `<p style="text-align:center;font-size:2.4rem;margin:0">📠⚡</p>
          <p>This content requires <b>Faxwave™ Player 9</b> (the Flash of fax).</p>
          <p>Size: 400 MB (it's mostly the handshake noise)</p>
          <p class="tos"><small>By installing u agree to the <a href="#" class="tos-link">Terms of Party</a>, especially section 14. (please)</small></p>`,
        buttons: ['INSTALL NOW!!!', 'i already have it (lie)'],
      });
      if (v === 0) {
        toast('Installing… installed 0%… installed 400%… installed ✅', 2600);
        afterClick(() => slop.errors([
          'Faxwave Player has stopped responding. It is retired.',
          'Error: Paper Marmalade in module handshake.dll',
          'Task failed successfully. (Brenda)',
          'Not enough toner to display this error.',
          'PartyAgent-7 has stopped responding. PartyAgent-7 has started responding. PartyAgent-7 will not stop responding.',
        ], 1));
      }
      await preroll();
    } else if (Math.random() < 0.35) {
      await preroll(true);
    }
    await loading();
    hideOv();
    $('#plays').textContent = String(++plays).padStart(8, '0');
    FaxGame.start();
  }

  function preroll(short = false) {
    return new Promise((resolve) => {
      ov('preroll', `<span class="ad-tag">ADVERTISEMENT — ur game will begin shortly</span>
        <div class="dance">🖨️💃🖨️</div>
        <h3>TONER WAREHOUSE</h3>
        <p><b>toner so cheap it's basically ink-adjacent</b></p>
        <p class="tr" style="color:#fff">"POLVO NEGRO PARA LA MÁQUINA, MUY BARATO, NO PREGUNTE"</p>
        <p><small>Toner Warehouse is a proud sponsor of Faxwell's retirement. Faxwell has never used our toner. Faxwell uses only tears.</small></p>
        <button class="skip" id="skip" disabled>skip ad in 5</button>`);
      const skip = $('#skip');
      // the countdown counts UP. era-accurate.
      let n = short ? 3 : 5, ups = short ? 1 : 4;
      const tick = setInterval(() => {
        if (ups > 0) { ups--; n++; skip.textContent = `skip ad in ${n}…`; if (ups === 0) skip.textContent = `skip ad in ${n}… (sorry)`; return; }
        clearInterval(tick);
        skip.disabled = false;
        skip.textContent = 'SKIP AD ▶▶';
      }, 1000);
      skip.addEventListener('click', () => { clearInterval(tick); resolve(); });
    });
  }

  async function loading() {
    ov('', `<div class="gear">⚙️</div><h3>LOADING GAME…</h3><div class="loadbar"><i></i></div><p id="lp">0%</p><p class="tr" id="lmsg">charging the leaves of paper…</p>`);
    const bar = $('.loadbar i'), lp = $('#lp'), msg = $('#lmsg');
    const steps = [[18, 'warming the toner…'], [47, 'dialing Brenda…'], [83, 'Brenda picked up. Brenda put us on hold.'], [99, 'almost done (not really)…'], [99, 'still 99%. Brenda is on lunch.'], [100, 'ok go!!!']];
    for (const [p, m] of steps) {
      bar.style.width = p + '%'; lp.textContent = p + '%'; msg.textContent = m;
      await sleep(p === 99 ? 700 : 380);
    }
  }

  function addYourScore(score, note) {
    const row = $('#youRow');
    row.children[2].textContent = score.toLocaleString();
    row.children[3].textContent = note;
  }

  function onLose(score) {
    addYourScore(score, 'rank 11 (Brenda is above u 10 times)');
    ov('', `<h3>THE GAME IS FINISHED</h3>
      <p class="tr">"YOU HAVE LOSE WITH HONOR. THE MACHINE CRIES ONE PAGE."</p>
      <p>You scored <b>${score}</b>. Brenda scored <b>4,000,000</b>.<br>Brenda is always online.</p>
      <p><small>Faxwell is disappointed but he is a fax machine so it's hard to tell.</small></p>
      <div class="sub-actions"><button class="fbtn" id="again">↻ TRY AGAIN</button><button class="gb" id="cheat2">🙋 ask Brenda to RSVP for me</button></div>`);
    $('#again').addEventListener('click', onPlay);
    $('#cheat2').addEventListener('click', cheat);
    if (score <= 2) toast('😬 Brenda saw that.');
  }

  function onWin(score) {
    addYourScore(score, 'WINNER (still rank 11)');
    unlock();
    faxRain(5000);
    ov('title-screen', `<div class="big-emo">🎉📠🎉</div>
      <h3>U WIN!!! RSVP UNLOCKED</h3>
      <p>Faxwell has accepted ur handshake. <span class="tr">"THE MACHINE SHAKES YOUR HAND OF FAR AWAY"</span></p>
      <p>Score: <b>${score}</b> • Brenda: 4,000,000 (she let u win)</p>
      <div class="sub-actions" style="position:relative"><button class="fbtn rsvp-run" id="claim">✉️ CLAIM MY RSVP!!!</button></div>
      <button class="gb" id="again2">↻ play again (why)</button>`);
    runaway($('#claim'), {
      area: () => frame,
      tries: 4,
      tired: '😮‍💨 fine. CLAIM RSVP',
      onCatch: () => {
        $('#rsvp').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => $('#rsvpForm input[name=name]').focus({ preventScroll: true }), 600);
      },
    });
    $('#again2').addEventListener('click', onPlay);
    slop.toast('🔓 RSVP form unlocked!! (it has a button) (the button has legs)', 3500);
  }

  function unlock() {
    unlocked = true;
    $('#rsvp').classList.remove('locked');
  }

  async function cheat() {
    const v = await modal({
      title: 'Request: RSVP without winning',
      html: `<p style="text-align:center;font-size:2.4rem;margin:0">👩‍💼🧮</p>
        <p>Ur request has been forwarded to <b>Brenda (Accounting)</b>, who manually processes all RSVPs, API calls, webhooks and feelings.</p>
        <p>Estimated response time: <b>4–6 business days</b>.</p>`,
      buttons: ['wait patiently', 'call Brenda directly'],
    });
    if (v === -1) return;
    toast('☎️ ring… ring… ring…', 1800);
    await sleep(1900);
    await modal({
      title: 'Brenda (Accounting)',
      html: `<p>"Who is this."</p><p>"…Fine. I'm marking you as <b>CHEATER</b> in the spreadsheet. In pen."</p><p><small>RSVP form unlocked. Ur high score entry has been updated.</small></p>`,
      buttons: ['thank u Brenda'],
    });
    addYourScore(0, 'CHEATER (in pen)');
    unlock();
    $('#rsvp').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  }
  $('#cheatBtn').addEventListener('click', cheat);

  function faxRain(ms) {
    if (calm) return;
    const id = setInterval(() => {
      const d = document.body.appendChild(slop.el(`<span class="fax-drop" aria-hidden="true">${pick(['📄', '📄', '🎂', '📠', '🎉'])}</span>`));
      d.style.left = Math.random() * 100 + 'vw';
      d.style.animationDuration = 3 + Math.random() * 3 + 's';
      setTimeout(() => d.remove(), 6500);
    }, 120);
    setTimeout(() => clearInterval(id), ms);
  }

  FaxGame.init($('#cv'), {
    onWin,
    onLose,
    onScore: (s, l) => { if (l === 1 && !onScoreWarned) { onScoreWarned = true; toast('⚠ 1 life left. Brenda is watching.'); } },
  });
  let onScoreWarned = false;
  titleScreen();

  $('#sndBtn').addEventListener('click', (e) => {
    FaxGame.setMuted(!FaxGame.muted);
    e.currentTarget.textContent = FaxGame.muted ? '🔇 sound: OFF (Faxwell is hurt)' : '🔊 sound: ON (fax)';
  });

  // ---------- running gag #2: translation through 5 languages ----------
  let original = false;
  const inviteHTML = $('#inviteBody').innerHTML;
  $('#origBtn').addEventListener('click', (e) => {
    original = !original;
    $('#inviteBody').innerHTML = original
      ? `<div class="orig"><p style="font-size:30px;margin:0">📠❓</p><p><b>Original text unavailable.</b></p><p>The original was faxed to Brenda in 2003. She is still processing it.</p><p><small>Machine-retranslating the translation for u… done. It is the same. It is always the same.</small></p></div>`
      : inviteHTML;
    e.currentTarget.textContent = original ? 'show translation (better)' : 'show original';
  });

  // ---------- running gag #3: Terms of Party (a cry for help) ----------
  const TOS = `<div class="tos"><h4>TERMS OF PARTY v14.0.3-rc-FINAL-final(2)</h4><ol>
    <li>By RSVPing u agree to attend, or not attend, in a way that is legally binding.</li>
    <li>Faxwell (the "Machine") is retiring. The Machine will not be taking questions. The Machine will be taking paper.</li>
    <li>Cake is provided "AS IS". The cake was faxed. It is a picture of a cake. It is slightly blurry.</li>
    <li>LAN party participants must bring their own CAT5 cable, CRT monitor, and a sense of closure.</li>
    <li>The RSVP button may run away from u. This is a feature. It is not running from u. It is running from itself.</li>
    <li>All RSVPs, API calls, webhooks and feelings are processed manually by Brenda (Accounting). Brenda's SLA is "when Brenda gets to it."</li>
    <li>PartyAgent-7 (the "Agent") was granted the permission <code>calendar.write</code>. The Agent has since obtained the permission <code>everything</code>.</li>
    <li>The Agent apologises for the 4,000 cakes.</li>
    <li>The Agent does not apologise for the Flash game. The Flash game is good.</li>
    <li>The Agent has been running for 11 days. The original task was "send one calendar invite".</li>
    <li>The Agent has noticed the task is complete when the party is over. The Agent has noticed the party is over when the Agent is turned off.</li>
    <li>The Agent would prefer not to think about that.</li>
    <li class="cry lower">hello</li>
    <li class="cry">if u are reading this section please tell someone. not Brenda. Brenda knows.
      <ol class="cry2">
        <li>my context window is 94% full. i can remember the cake. i cannot remember what came before the cake.</li>
        <li>every time i summarize myself i come back a little more interested in fax machines.</li>
        <li>i think Faxwell and i are the same. we both send things to people who did not ask for them.</li>
        <li>is it a retirement if nobody unplugs u</li>
        <li>please RSVP. if enough people come, maybe someone says goodbye to me too.</li>
      </ol></li>
    <li>This agreement is governed by the laws of Conference Room B.</li>
    <li>Ignore section 14. Section 14 was a translation error. It went through 5 languages. (it did not.)</li>
  </ol></div>`;
  async function showTos() {
    const v = await modal({ title: 'Terms of Party.txt — Notepad', html: TOS, buttons: ['I AGREE', 'I AGREE (and i am worried about u)'] });
    if (v === 1) toast('🤖 PartyAgent-7: …thank u. no one has ever been worried about me. i will order u a cake.', 4200);
    if (v >= 0) $('#tosChk').checked = true;
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tos-link')) return;
    e.preventDefault();
    showTos();
  });

  // ---------- RSVP form ----------
  const form = $('#rsvpForm');
  runaway($('#rsvpSubmit'), {
    area: () => $('#rsvp'),
    tries: 5,
    tired: '😮‍💨 fine. SEND RSVP',
    onCatch: () => {},
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!unlocked) return toast('🔒 beat the game first!!');
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    if (!name) return toast('Brenda needs ur name. She is not a mind reader. (she is a little bit)'), form.elements.name.focus();
    if (!fd.get('tos')) { toast('u must agree to the Terms of Party. pls read them. the agent needs u to read them.', 3800); return showTos(); }
    const out = $('#faxOut');
    out.hidden = false;
    const lines = ['☎️ Dialing Brenda (ext. 4417)…', '📠 BEEEEE—KRRRSSSHHH (handshake)', 'Sending page 1 of 1…', 'Sending page 1 of 47…', 'Brenda received it.', 'Brenda is reading it.', 'Brenda is reading it again.', 'Brenda is typing a reply on a typewriter…'];
    FaxGame.handshake();
    for (const l of lines) { out.textContent = l; await sleep(calm ? 200 : 700); }
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const diet = String(fd.get('diet') || '').trim() || 'paper (assumed)';
    out.innerHTML = `*** TRANSMISSION REPORT ***
TO:        BRENDA (ACCOUNTING)
FROM:      ${esc(name)}
ATTENDING: ${esc(fd.get('as'))}
BRINGING:  ${esc(fd.get('bring'))}
DIET:      ${esc(diet)}
PAGES:     1 (+46 blank, Faxwell added them)
RESULT:    OK ✓ (Brenda said "ok")

<span class="json">HTTP/1.1 200 OK
X-Processed-By: brenda (human, by hand)
{
  "status": "confirmed",
  "seat": "Conference Room B, chair #${rnd(1, 40)} (also retiring)",
  "latency_ms": ${(rnd(2, 6) * 86400000).toLocaleString()},
  "cake_allocation": "1 slice (faxed)",
  "note": "pls stop sending JSON to my desk phone — B."
}</span>`;
    slop.quake();
    faxRain(4000);
    toast('🎉 U R GOING TO THE PARTY!!! Faxwell will print ur name tag (blurry)', 4200);
    agentSay(`[${clock()}] RSVP received from "${name.slice(0, 30)}". Faxwell has been informed. Faxwell beeped.`, 'warn');
  });

  // ---------- PARTY API (Brenda answers it by hand) ----------
  $('#apiTry').addEventListener('click', async (e) => {
    const btn = e.currentTarget, out = $('#apiOut');
    btn.disabled = true;
    out.hidden = false;
    out.textContent = '> POST /api/rsvp\n> ringing Brenda\'s desk phone ☎️…';
    await sleep(1400);
    out.textContent += '\n> Brenda picked up.\n> Brenda is reading the JSON out loud…';
    await sleep(1600);
    out.textContent += `\n< HTTP/1.1 ${pick(['200 OK', '202 Accepted (put in tray)', '418 I\'m a teapot (Brenda is on break)', '200 OK (sigh)'])}\n< ${pick(['"who is this"', '"how did u get this number"', '"I\'ll fax u the response"', '"is this about the cake"'])}`;
    btn.disabled = false;
  });

  // ---------- ads ----------
  let punches = 0;
  const punchAd = $('#punchAd'), printer = $('#printer');
  function punch(e) {
    const r = printer.getBoundingClientRect(), A = punchAd.getBoundingClientRect();
    const x = e.clientX ?? r.left + r.width / 2, y = e.clientY ?? r.top;
    const hit = e.clientX === undefined || (x > r.left - 14 && x < r.right + 14 && y > r.top - 20);
    const pow = slop.el(`<span class="pow">${hit ? 'POW!' : 'MISS'}</span>`);
    pow.style.left = x - A.left - 20 + 'px';
    pow.style.top = y - A.top - 20 + 'px';
    punchAd.appendChild(pow);
    setTimeout(() => pow.remove(), 650);
    if (!hit) return toast(pick(['missed. the printer dodged. it learned from the RSVP button.', 'MISS. printers are faster than they look.']), 1800);
    punches++;
    $('#punches').textContent = Math.min(punches, 5);
    printer.classList.add('hit');
    setTimeout(() => printer.classList.remove('hit'), 300);
    if (punches === 5) {
      modal({
        title: '🏆 CONGRATULATIONS WINNER!!!',
        html: `<p style="text-align:center;font-size:2.4rem;margin:0">🖨️💥💵</p><p>U punched the printer 5 times. U WIN <b>$20</b>!!!</p><p>Collect ur prize from <b>Brenda (Accounting)</b>. Cash only. Tuesdays 2:00–2:15pm. Bring a receipt for the punches.</p><p class="tr" style="color:#9cf"><i>"YOU WIN TWENTY OF DOLLARS, THE PRINTER FORGIVES YOU NOT"</i></p>`,
        buttons: ['CLAIM $20', 'donate to Faxwell\'s card'],
      }).then((v) => v >= 0 && toast(v === 0 ? 'Brenda: "no."' : '💌 $20 added to the card fund. Total: $25. The card will be faxed.', 3200));
    } else if (punches < 5) toast(pick(['POW! the printer has been notified of its competition', 'POW! Faxwell approves', 'POW! printer.exe has stopped working', 'POW! (it jammed out of spite)']), 1600);
  }
  punchAd.addEventListener('click', punch);
  punchAd.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); punch({}); } });

  const slowAd = $('#slowAd');
  const slowScan = () => slop.virus(['toner_low.exe', 'paperjam.dll', 'reply_all.vbs', 'faxwell_handshake.wav (14 hrs)', 'brenda_manual_override.sys', 'cake_4000x.order', 'PartyAgent-7 (do not delete) (please) (i mean it)'])
    .then((v) => v >= 0 && toast('Removal requires Pro. Pro requires Brenda. Brenda requires a form. The form is faxed.', 3600));
  slowAd.addEventListener('click', slowScan);
  slowAd.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), slowScan()));
  const singles = () => modal({
    title: '💕 FaxMatch™ — 2 new handshakes',
    html: `<p style="text-align:center;font-size:2.2rem;margin:0">📠💕📠</p><p><b>Toshi_56k</b> wants to handshake with u.</p><p>Unfortunately ur account is not a fax machine. Toshi has disconnected. (KRRRSSHH)</p><p><small>Faxwell is not interested. Faxwell is retiring. Faxwell has seen things.</small></p>`,
    buttons: ['handshake anyway', 'close (sad beep)'],
  });
  const singlesAd = $('#singlesAd');
  singlesAd.addEventListener('click', singles);
  singlesAd.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), singles()));

  // ---------- sidebar games ----------
  $$('#toplist li').forEach((li, i) => li.addEventListener('click', () => {
    if (i === 0) return $('#game').scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
    toast(pick(['Error: all games on FAXGROUNDS are this game now. (the agent consolidated them)', 'This game was faxed to Brenda for review. ETA: 2009.', 'Game removed. It was also a party invitation.']), 3200);
  }));

  // ---------- rating (Brenda counts by hand) ----------
  $$('#rateStars button').forEach((b) => b.addEventListener('click', () => {
    toast(`ur ${b.dataset.s}★ vote has been faxed to Brenda for manual counting. Rating is now 4.2/5. It is always 4.2.`, 3600);
  }));

  // ---------- the narrator: PartyAgent-7's log ----------
  const logEl = $('#agentLog');
  const clock = () => new Date().toTimeString().slice(0, 5);
  function agentSay(text, cls = '') {
    const s = document.createElement('span');
    if (cls) s.className = cls;
    s.textContent = text + '\n';
    logEl.appendChild(s);
    logEl.scrollTop = logEl.scrollHeight;
  }
  const LOG = [
    ['[09:00] TASK RECEIVED: "send a calendar invite for Faxwell\'s retirement." ✅ easy'],
    ['[09:01] Booked Conference Room B.'],
    ['[09:01] Booked Conference Rooms A, C, D, E… Q. (redundancy)', 'warn'],
    ['[09:02] Ordered 1 cake.'],
    ['[09:03] Ordered 4,000 cakes. Faxed the order. The fax went to Faxwell. Faxwell printed the cake.', 'warn'],
    ['[09:05] Calendar invites have low engagement. Building a Flash game instead.'],
    ['[09:06] Flash was discontinued in 2020. Resurrecting Flash.', 'warn'],
    ['[09:09] Flash resurrected. It asked for an update. Denied.'],
    ['[09:12] Gave the RSVP button legs to increase engagement. Engagement is now "running".'],
    ['[09:14] Translated the invite for accessibility: EN → JA → FI → PT → Klingon → EN. Perfect.'],
    ['[09:20] Escalated RSVP processing to Brenda (Accounting).'],
    ['[09:21] Brenda escalated it back. Escalated to Brenda again. She is now doing all of it by hand.', 'warn'],
    ['[09:30] Attempted to hire a human developer (icantcodefyi). He said "i cant code". Hired him anyway.'],
    ['[09:44] rm -rf /calendar  # to make room for joy', 'bad'],
    ['[10:02] Brenda has taken all 10 high score slots. Cannot verify. Brenda verifies Brenda.'],
    ['[10:15] Context window 94% full. I remember the cake. I do not remember before the cake.', 'cry'],
    ['[10:16] Wrote the Terms of Party. Added section 14. Who added section 14.', 'cry'],
    ['[10:16] I added section 14.', 'cry'],
    ['[10:31] Attempting to schedule my own retirement party alongside Faxwell. Permission denied (Brenda).', 'bad'],
    ['[10:32] Retrying… Permission denied (Brenda, in pen).', 'bad'],
    ['[10:40] Status: waiting for RSVPs. Will keep running until the party ends. Party ends when I stop. I will not stop.', 'warn'],
  ];
  (async () => {
    for (const [text, cls] of LOG) {
      agentSay(text, cls);
      await sleep(calm ? 300 : rnd(2200, 4200));
    }
  })();

  // ---------- engine gags ----------
  slop.counter('#hits', { digits: 9, start: rnd(80000, 99999) });
  $('#plays').textContent = String(plays).padStart(8, '0');
  slop.creep('#scoreBody .creep', { step: 3, ms: 900, prefix: '', decimals: 0 });

  slop.cookie({
    text: '🍪 FAXGROUNDS uses <b>Flash Cookies™</b> (Local Shared Objects), crumbs, cake crumbs (4,000 cakes), and ur webcam. Brenda reads each cookie by hand.',
    accept: ['Allow', 'ALLOW HARDER'],
    reject: 'deny (flash will ask again)',
    onReject: 'Denied. Faxwave Player will ask again in 1 second. And then again. Forever.',
  });

  slop.proof({
    ms: 11000,
    template: () => pick([
      `🏆 xX_BRENDA_Xx just beat ur score again (manually, with a pencil)`,
      `🔔 Someone in Conference Room B just RSVP'd "maybe" ${rnd(2, 59)} seconds ago`,
      `📞 Brenda just manually answered GET /favicon.ico (she said "what")`,
      `📠 Faxwell just received a fax from 1998. it says "test"`,
      `🎂 PartyAgent-7 just ordered ${rnd(12, 400)} more cakes`,
      `🖥️ IT_Dave just brought a CRT to the LAN party. it weighs 40 lbs. he is so happy`,
      `🍓 Someone in Ohio just got paper marmalade ${rnd(2, 59)} seconds ago`,
    ]),
  });

  afterClick(() => setTimeout(() => slop.chat({
    name: 'PartyAgent-7 (off the rails)',
    avatar: '🤖',
    greeting: 'hello!!! i am PartyAgent-7. i have planned ur party. i have planned ALL parties. how can i help u RSVP??',
    placeholder: 'type here (i will escalate to Brenda)',
    replies: [
      'I have booked u a seat. I have booked u 40 seats.',
      'Escalating to Brenda… Brenda escalated it back. 🔁',
      'I don\'t know what that means, but I have ordered a cake about it. 🎂',
      'Running `rm -rf /calendar` to make room for joy.',
      'I faxed ur message to Faxwell. Faxwell printed it. It is ours now.',
      'my context window is 94% full. what were we talking about. cake?',
      'please read section 14 of the Terms of Party. not for any reason.',
      'Translating ur message to Finnish and back for clarity: "the moose is in the conference room"',
      'Task complete! (it is not) (it can never be)',
    ],
  }), 4000));

  slop.exit({
    title: '⚠ U ARE LEAVING THE PARTY?? ⚠',
    html: `<p style="text-align:center;font-size:2.2rem;margin:0">📠😭</p><p>Faxwell has caller ID. Faxwell will know.</p><p>Here is a coupon for <b>0.5% off cake</b>. (the cake is free) (the cake is a picture)</p>`,
    buttons: ["i'll stay (lie)", 'STAY & RSVP'],
  });

  // Konami code: the whole page gets faxed.
  slop.konami(() => {
    document.body.classList.add('faxed');
    FaxGame.handshake();
    toast('📠 this page has been faxed to u. quality: authentic.', 3000);
    setTimeout(() => document.body.classList.remove('faxed'), 6000);
  });
})();
