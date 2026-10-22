// Uncle Gary's HOT DOG SHRINE: page-specific gags on top of slop.js.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal } = slop;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- running gag 3: the apology counter ---------- */
  let apologies = document.querySelectorAll('.sorry').length;
  const drawSorry = () => document.querySelectorAll('[data-sorry]').forEach((n) => (n.textContent = String(apologies).padStart(4, '0')));
  const sorry = (n = 1) => ((apologies += n), drawSorry());
  document.querySelectorAll('.sorry').forEach((s, i) => (s.title = `apology #${i + 1}`));
  drawSorry();
  const garyToast = (msg) => (toast(`👴 ${msg}`), sorry());

  const bannerLines = [
    'Hello. This is Gary. I learned HTML yesterday. Sorry for the website.',
    'Sorry about the colors. I can not find where to turn them off.',
    'Sorry the button moves. I did not tell it to do that.',
    'Sorry to Brenda. (Brenda, if u are reading this, sorry.)',
    'Sorry if the hotdog is spinning too fast. I do not know how to slow it.',
    'Sorry for saying sorry so much. Brenda says I have to stop. Sorry.',
    'Sorry, the progress bar is going the wrong way. The book did not cover this.',
  ];
  let bl = 0;
  slop.every(9000, () => {
    bl = (bl + 1) % bannerLines.length;
    $('#gary-line').textContent = bannerLines[bl];
    sorry();
  });

  /* ---------- custom era gag: ENTER THE BUN REALM splash ---------- */
  const splash = $('#splash');
  let entered = false;
  const enter = () => {
    if (entered) return;
    entered = true;
    splash.classList.add('gone');
    setTimeout(() => {
      slop.cookie({
        text: '🍪 This site uses cookies. I asked Tyler what that means and he said "don\'t worry about it". So I am not worrying about it. <span class="sorry">Sorry.</span>',
        accept: ['OK', 'OK (with mustard)'],
        reject: 'no thank u',
        onReject: 'Tyler says the "no" button is premium. I do not know what that means either. Sorry.',
      });
      sorry();
    }, 700);
    setTimeout(() => garyToast('welcome!! sorry it took so long to load (it did not load)'), 1400);
  };
  splash.addEventListener('click', (e) => e.target.closest('[data-enter]') && enter());
  addEventListener('keydown', (e) => e.key === 'Escape' && !entered && enter());

  /* ---------- running gag 1: progress bars that go backwards ---------- */
  function backbar(root, { labels, from = 99, floor = -12, ms = 750, loop = false, crash = '⚠ HOTDOG UN-LOADED. Restarting. Sorry.' }) {
    root = $(root);
    root.classList.add('backbar');
    root.innerHTML = '<div class="bb-top"><span class="bb-label"></span><b class="bb-pct"></b></div><div class="bb-track"><i></i></div>';
    const lab = root.querySelector('.bb-label'), pct = root.querySelector('.bb-pct'), fill = root.querySelector('i');
    const draw = (v) => {
      fill.style.width = `${Math.max(0, v)}%`;
      pct.textContent = `${v}%`;
      root.classList.toggle('neg', v < 0);
    };
    const once = async () => {
      root.classList.remove('crash');
      const steps = labels.length;
      for (let k = 0; k < steps; k++) {
        lab.textContent = labels[k];
        const target = k === steps - 1 ? floor : Math.round(from - ((from - floor) * k) / (steps - 1)) - rnd(0, 4);
        draw(Math.min(from, target));
        await sleep(ms + rnd(-150, 350));
      }
    };
    if (!loop) return once();
    (async () => {
      for (;;) {
        await once();
        root.classList.add('crash');
        lab.textContent = crash;
        await sleep(2200);
        draw(from);
        await sleep(400);
      }
    })();
    return null;
  }

  backbar('#bar-hero', {
    labels: ["Loading today's Hotdog Of The Day...", 'Warming up the bun...', 'Bun too warm. Cooling the bun...', 'Un-loading the hotdog...', 'Hotdog has left the building...', 'We now owe a hotdog...'],
    loop: true, ms: 1100,
  });
  backbar('#bar-foot', {
    labels: ['Site completion (under construction)', 'Gary is adding a new thing...', 'Gary deleted the old thing...', 'Gary deleted the new thing...', 'Brenda has asked Gary to stop...'],
    from: 80, floor: -5, loop: true, ms: 1700, crash: 'Site completion reset. Gary is starting over. Sorry.',
  });

  /* ---------- running gag 2: the CTA that runs away ---------- */
  const taunts = ['nope 🌭💨', 'too slow!!', 'sorry!! reflex', 'almost (no)', 'Gary coded this, sorry', 'catch me (pls dont)'];
  function runaway(btn, { tries = 6, tired = 'ok fine. click me. (sorry) 😮‍💨', onClick }) {
    btn = $(btn);
    const zone = btn.parentElement;
    let n = 0;
    const flee = () => {
      n++;
      const zr = zone.getBoundingClientRect(), br = btn.getBoundingClientRect();
      btn.classList.add('moved');
      btn.style.left = `${rnd(0, Math.max(0, Math.floor(zr.width - br.width) - 4))}px`;
      btn.style.top = `${rnd(0, Math.max(0, Math.floor(zr.height - br.height) - 4))}px`;
      if (n >= tries) {
        btn.textContent = tired;
        btn.classList.add('tired');
        sorry();
        // re-fit after the label changes width
        requestAnimationFrame(() => {
          const w = btn.getBoundingClientRect().width;
          btn.style.left = `${Math.max(0, Math.min(parseFloat(btn.style.left), zr.width - w - 4))}px`;
        });
      } else {
        btn.textContent = pick(taunts);
      }
    };
    btn.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && n < tries && flee());
    btn.addEventListener('click', (e) => {
      // keyboard users (detail 0) get through; Gary did not know keyboards could do that
      if (n < tries && e.detail !== 0) return flee();
      onClick();
    });
  }

  let members = 3, joined = 0;
  function burst(emojis = ['🌭', '🌭', '⭐', '🔥', '🌭']) {
    if (calm) return;
    for (let i = 0; i < 28; i++) {
      const d = document.body.appendChild(el(`<span class="slop-drop" aria-hidden="true">${pick(emojis)}</span>`));
      d.style.left = `${Math.random() * 96}vw`;
      d.style.animationDuration = `${2.5 + Math.random() * 3}s`;
      d.style.animationDelay = `${Math.random() * 0.8}s`;
      setTimeout(() => d.remove(), 6500);
    }
  }
  async function join() {
    joined++;
    members++;
    $('#members').textContent = members;
    burst();
    const ranks = ['Cocktail Wiener (entry level)', 'Footlong (senior)', 'Jumbo Frank (management)'];
    const again = joined > 1 ? `<p>U were already a member. Now u are a member ${joined} times. Sorry the button was so hard.</p>` : '';
    await modal({
      title: '🌭 WELCOME TO THE FAN CLUB 🌭',
      html: `${again}<div class="member-card"><span class="big">🌭</span><h4>OFFICIAL MEMBER</h4>
        Member #: ${String(members).padStart(6, '0')}<br>Rank: ${ranks[Math.min(joined - 1, 2)]}<br>Dues: $0.00<br>Invoice: to follow (Brenda)<br>Signed: <i>Gary</i></div>
        <p class="tiny">Please print this card. Tyler says "nobody prints things". Sorry Tyler.</p>`,
      buttons: ['I am honored', 'I am honored (sorry)'],
    });
    sorry();
    toast('📎 Brenda: invoice #' + rnd(1000, 9999) + ' for $0.00 has been mailed to u');
  }
  runaway('#cta-hero', { onClick: join });
  runaway('#cta-club', { onClick: join, tired: 'FINE. SIGN UP. (sorry) 😮‍💨' });
  runaway('#cta-mail', {
    tries: 4,
    tired: '📬 ok email me (sorry)',
    onClick: () => {
      modal({
        title: '📬 E-MAIL GARY',
        html: '<p>My e-mail is <b>gary@[REDACTED BY BRENDA]</b>.</p><p>The book said not to put ur e-mail on the internet. I did it anyway. Brenda fixed it. Sorry.</p><p>Please use the guestbook. Brenda will forward it to me (by printing it out).</p>',
        buttons: ['take me to the guestbook', 'ok'],
      }).then((v) => v === 0 && $('#guestbook').scrollIntoView());
      sorry();
    },
  });

  /* ---------- poll ---------- */
  let yesPending = 0;
  $('#poll').addEventListener('click', (e) => {
    const b = e.target.closest('[data-vote]');
    if (!b) return;
    if (b.dataset.vote === 'no') return toast('✅ vote counted. NO is still at 100%. thank u. 🌭');
    yesPending++;
    $('#yes-count').textContent = `0% (${yesPending} pending review)`;
    modal({ title: 'Vote Received', html: '<p>Your vote has been forwarded to Brenda for review.</p><p>Brenda has reviewed it.</p><p><b>It was wrong.</b></p><p>Sorry.</p>', buttons: ['ok', 'ok (I was wrong)'] });
    sorry();
  });

  /* ---------- the demo that works badly: Brenda's calculator ---------- */
  let credits = 3;
  const calcBusy = { v: false };
  $('#calc-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (calcBusy.v) return;
    if (credits <= 0) return toast('📎 Brenda has gone home. Calculations resume 9:00am (9:20 if traffic).');
    calcBusy.v = true;
    const fd = new FormData(e.target);
    const guests = Math.max(0, Math.min(999, parseInt(fd.get('guests'), 10) || 0));
    const per = parseInt(fd.get('per'), 10) || 1;
    const out = $('#calc-out');
    out.hidden = false;
    out.innerHTML = '<div id="bar-calc" class="backbar-box"></div>';
    await backbar('#bar-calc', {
      labels: ['Brenda is sharpening her pencil...', 'Brenda is carrying the 1...', 'Brenda is un-carrying the 1...', 'Brenda found an error (it was Gary)...', 'Brenda is redoing it in pen...'],
      floor: -8, ms: 850,
    });
    credits--;
    $('#credits').textContent = credits > 0 ? credits : '0 (Brenda has gone home)';
    const need = guests * per;
    const total = Math.max(40, Math.ceil(need / 40) * 40);
    const extra = total - need;
    const captions = [
      'Brenda checked this twice. By hand.',
      'Accuracy: 12% (Brenda\'s calculator is solar and it is cloudy)',
      'Do not ask why buns come in 8. Brenda does not know. Nobody knows.',
      'Brenda would like u to know this is not her job.',
    ];
    const note = guests === 0 ? '0 guests? Sorry. Me too. Brenda still says buy 40.' : per === 7 ? 'Note: 7 per guest is the "Gary" setting. Please do not.' : `Leftover hotdogs: ${extra}. Gary will eat these. Sorry.`;
    out.innerHTML = `<div class="receipt"><h4>INVOICE #${rnd(100, 999)} — FRANK/BUN RECONCILIATION</h4><table>
      <tr><td>Hotdogs u need</td><td>${need}</td></tr>
      <tr><td>Packs of franks (×10)</td><td>${total / 10}</td></tr>
      <tr><td>Packs of buns (×8)</td><td>${total / 8}</td></tr>
      <tr><td>Hotdogs u will have</td><td>${total}</td></tr>
      <tr><td>Is it a sandwich</td><td>NO</td></tr>
      <tr><td>Brenda's time</td><td>$${(rnd(40, 90) + 0.5).toFixed(2)} (waived)</td></tr>
    </table><p>${esc(note)}</p><span class="stamp">RECONCILED ✓</span></div><p class="slop-caption">${esc(pick(captions))}</p>`;
    sorry();
    calcBusy.v = false;
  });

  /* ---------- guestbook: Brenda answers everything by hand ---------- */
  let brendaCount = 14;
  const brendaReply = (msg, cond) => {
    const rules = [
      [/sandwich/i, "Sandwich claim received and rejected per Gary's policy (memo 10/21). Please do not reply. — Brenda"],
      [/ketchup/i, 'Ketchup preference recorded. Filed under: Controversial Liabilities. — Brenda'],
      [/brenda/i, 'Thank you for asking about me. I am fine. I have 340 unread invoices. — Brenda'],
      [/sorry/i, 'Please do not apologize. Gary has used up this quarter\'s apologies. — Brenda'],
      [/gary/i, 'Forwarded to Gary. Gary says sorry. Gary did not know what for. — B.'],
      [/chicago|salad|pickle/i, 'Chicago-style noted. Gary respects it. Gary is uncomfortable. — Brenda'],
      [/frankfurt|germany|vienna/i, 'This is not Frankfurt. Reclassified as misdirected correspondence. — B.'],
    ];
    for (const [re, r] of rules) if (re.test(msg) || re.test(cond)) return r;
    return pick([
      `Entry received ${new Date().toLocaleDateString()}. Logged, stamped, and placed in the Hotdog Correspondence binder (3-ring). — Brenda`,
      'Thank you for your entry. It has been entered. In the ledger. In pen. — Brenda',
      `Received. This is entry #${brendaCount} I have answered this week. I am not paid for this. Have a nice day. — Brenda`,
      'Approved for display. Spelling corrected in 2 places. You are welcome. — Brenda',
    ]);
  };

  const gb = $('#gb-form');
  slop.captcha(gb, {
    prompt: 'Brenda needs to know u are human. Select all squares with a hotdog:',
    tiles: ['🌭', '🌭', '🐕', '🌭', '🥖', '🌭', '🐶', '🌭', '🌭'],
    fail: '❌ wrong. one of the hotdogs was Biscuit. try again (sorry)',
  });
  gb.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(gb);
    const name = String(fd.get('name') || 'Anonymous').trim() || 'Anonymous';
    const loc = String(fd.get('loc') || '').trim() || 'somewhere';
    const cond = String(fd.get('cond') || '');
    const msg = String(fd.get('msg') || '').trim();
    if (!msg) return;
    brendaCount++;
    gb.reset();
    const entry = el(`<article class="entry fresh"><header><b>${esc(name)}</b> from ${esc(loc)} · ${esc(cond)}</header><p>${esc(msg)}</p><div class="backbar-box"></div></article>`);
    $('#entries').prepend(entry);
    entry.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
    await backbar(entry.querySelector('.backbar-box'), {
      labels: ['Brenda is reading ur entry by hand...', 'Brenda is re-reading it...', 'Brenda is on lunch 🥪 (sorry)...', 'Brenda is back. Brenda is typing...'],
      floor: -6, ms: 1000,
    });
    const reply = el('<div class="brenda"><b>📎 Reply from Brenda (Accounting):</b> <span></span></div>');
    entry.querySelector('.backbar-box').replaceWith(reply);
    const text = brendaReply(msg, cond);
    const span = reply.querySelector('span');
    if (calm) span.textContent = text;
    else for (const ch of text) { span.textContent += ch; await sleep(28); }
    sorry();
  });

  /* ---------- custom era gag: NO RIGHT CLICK script ---------- */
  let rightClicks = 0;
  addEventListener('contextmenu', (e) => {
    rightClicks++;
    if (rightClicks > 2) return;
    e.preventDefault();
    modal({
      title: '⛔ NO RIGHT CLICKING!!! ⛔',
      html: rightClicks === 1
        ? '<p>These hotdog pictures are COPYRIGHT GARY 2026.</p><p>Please do not steal my hotdogs. (Sorry for yelling. The book said to put this.)</p>'
        : '<p>Ok. u can right click next time. I can not stop u. I am 73. Sorry.</p>',
      buttons: ['ok sorry', 'ok (I wont steal ur hotdogs)'],
    });
    sorry();
  });

  /* ---------- custom era gag: hotdog cursor trail ---------- */
  if (!calm && matchMedia('(pointer: fine)').matches) {
    let last = 0;
    addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - last < 70 || e.pointerType !== 'mouse') return;
      last = now;
      const t = document.body.appendChild(el(`<span class="trail" aria-hidden="true">${Math.random() < 0.3 ? '🌭' : pick(['✨', '⭐', '✦'])}</span>`));
      t.style.left = `${e.clientX}px`;
      t.style.top = `${e.clientY + 14}px`;
      setTimeout(() => t.remove(), 800);
    });
  }

  /* ---------- custom era gag: ballgame.mid (WebAudio, only after a click) ---------- */
  let ctx = null, midiTimer = null, playing = false;
  const N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, R: 0 };
  // "Take Me Out to the Ball Game" (public domain, 1908), played badly
  const tune = [['C5', 2], ['C6', 1], ['A5', 1], ['G5', 1], ['E5', 1], ['G5', 3], ['D5', 3], ['C5', 2], ['C6', 1], ['A5', 1], ['G5', 1], ['E5', 1], ['G5', 5], ['R', 1],
    ['A5', 1], ['G#', 1], ['A5', 1], ['E5', 1], ['F5', 1], ['G5', 1], ['A5', 2], ['F5', 1], ['D5', 3], ['A5', 2], ['A5', 1], ['A5', 1], ['B5', 1], ['C6', 1], ['D6', 1], ['B5', 1], ['A5', 1], ['G5', 1], ['E5', 1], ['D5', 1], ['C5', 4]];
  N['G#'] = 830.61; N.D6 = 1174.66;
  const stopMidi = () => {
    playing = false;
    clearTimeout(midiTimer);
    $('.midi').classList.remove('playing');
  };
  $('#midi-play').addEventListener('click', () => {
    if (playing) return garyToast('it is already playing. sorry.');
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return garyToast('ur computer has no MIDI. sorry.');
    ctx = ctx || new AC();
    ctx.resume();
    playing = true;
    $('.midi').classList.add('playing');
    const beat = 0.27;
    let t = ctx.currentTime + 0.05;
    for (const [note, len] of tune) {
      const f = N[note];
      if (f) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.012); // slightly out of tune, like a real .mid on a 1999 sound card
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.045, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len * beat * 0.92);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + len * beat);
        stopMidi.nodes = (stopMidi.nodes || []).concat(o);
      }
      t += len * beat;
    }
    midiTimer = setTimeout(() => {
      stopMidi();
      garyToast('ballgame.mid has ended. Sorry, that is the whole file.');
    }, (t - ctx.currentTime) * 1000);
  });
  $('#midi-stop').addEventListener('click', () => {
    (stopMidi.nodes || []).forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
    stopMidi.nodes = [];
    stopMidi();
    toast('■ stopped. (it was not that loud, but sorry)');
  });

  /* ---------- webring, sidebar links ---------- */
  document.querySelector('.webring').addEventListener('click', (e) => {
    const a = e.target.closest('[data-ring]');
    if (!a) return;
    e.preventDefault();
    garyToast({
      prev: 'The previous site in the Encased Meats Webring is this site. Sorry, I am the only member.',
      next: 'The next site in the webring is also this site. Brenda says that is "not a ring, it is a dot".',
      random: 'Randomly picked: this site! (sorry, it is always this site)',
    }[a.dataset.ring]);
  });
  $('[data-nolinks]').addEventListener('click', (e) => (e.preventDefault(), garyToast('No links yet. I only know this one website. Sorry.')));
  $('[data-viewsource]').addEventListener('click', (e) => {
    e.preventDefault();
    sorry();
    slop.errors([
      'hotdog.exe has stopped responding (it is eating)',
      'Cannot find BUN.DLL. Sorry.',
      'Error: Gary has right-clicked again.',
      'brenda.exe is on lunch. Please try again at 1:00.',
      'Source code is copyright Gary. Also it is mostly <br>. Sorry.',
      'Task failed successfully (like the hotdog in 1983).',
    ], 2);
  });

  /* ---------- Gary's status ---------- */
  const statuses = ['ONLINE 🟢', 'AWAY 🟡 (getting a hotdog)', 'ONLINE 🟢', 'BRB 🔴 (Biscuit needs out)', 'ONLINE 🟢', 'AWAY 🟡 (reading the book again)'];
  let si = 0;
  slop.every(11000, () => ($('#gary-status').textContent = statuses[(si = (si + 1) % statuses.length)]));

  /* ---------- engine gags ---------- */
  slop.counter('#hits', { start: 48213, digits: 9, tick: 2200 });
  slop.creep('[data-creep]', { step: 0.3, ms: 2500, prefix: '', decimals: 0 });
  slop.proof({
    template: () => `🌭 Someone in ${pick(['Ohio', 'Coney Island', 'a Costco food court', "Gary's den", "Brenda's cubicle", 'Chicago (no ketchup!!)', 'Toledo', 'a Little League bleacher'])} just ${pick(['ate a hotdog', 'tried to join the fan club (button escaped)', 'signed the guestbook', 'put ketchup on it (reported to Brenda)', 'apologized', 'called it a sandwich (removed)', 'dropped a hotdog (Gary felt that)'])} ${rnd(1, 59)} min ago`,
    ms: 12000,
  });
  slop.clippy([
    'Hi! I am Franky the Helper Dog. Gary made me yesterday. Sorry.',
    'It looks like ur reading about hotdogs. Would u like to read about hotdogs?',
    'Tip: Brenda reads every guestbook entry. Please be nice to Brenda.',
    'It looks like ur trying to catch the button. Have u tried being faster?',
    'Did u know: franks come in 10 and buns come in 8? Gary would like u to be angry about this.',
    'Tip: the progress bar goes backwards. That means it is working (Gary).',
  ], { face: '🌭', first: 22000, ms: 30000 });
  slop.exit({
    title: '⚠ LEAVING THE SHRINE?? 😭🌭',
    html: '<p>Sorry. Was it the colors? I am sorry about the colors.</p><p>Please sign the guestbook before u go. Brenda will answer. She has to.</p>',
    buttons: ['stay (good)', 'leave (Gary will be sad)'],
  });
  slop.konami();
})();
