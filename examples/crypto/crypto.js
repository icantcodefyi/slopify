// $TATER site logic. Uses the slop.js gag engine (window.slop) + era-specific gags.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal, every, afterClick } = slop;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

  /* ---------- engine gags ---------- */
  slop.creep('#price', { step: 0.0000004, ms: 900, prefix: '$', decimals: 8 });
  slop.creep('#chg', { step: 9, ms: 700, prefix: '', decimals: 0 });
  slop.creep('#mcap', { step: 0.03, ms: 1100, prefix: '', decimals: 2 });
  slop.creep('[data-mcreep]', { step: 3, ms: 1300, prefix: '', decimals: 0 });

  slop.cookie({
    text: '🍪 We use the biscuits (cookies) (translated) to know ur wallet, ur fry order, and ur feelings. Biscuit the dog also uses them.',
    accept: ['Accept', 'ACCEPT HARDER 💎🙌'],
    reject: 'no',
    onReject: '"no" is only for the FAQ. please accept 🥺',
  });

  const whale = [
    () => `🐋 Whale alert: Steve just bought ${rnd(2, 4)} $TATER`,
    () => `🍟 Someone in Idaho just traded 1 real potato for 0.000${rnd(1, 9)} $TATER`,
    () => `🧻 Someone in Ohio just paper-handed ${rnd(2, 59)} seconds ago`,
    () => '📉 Tim just sold from Dubai (again)',
    () => '🔥 The fryer just caught fire (normal)',
    () => '🐕 Biscuit (auditor) just ate a hash brown. audit updated.',
    () => `🚌 The intern just missed the bus ${rnd(2, 40)} seconds ago`,
    () => '💎 Someone in a Walmart parking lot is holding (they cannot sell)',
  ];
  slop.proof({ template: () => pick(whale)(), ms: 11000 });

  slop.exit({
    title: '🧻🙌 PAPER HANDS DETECTED',
    html: '<p>ur leaving?? with ur hands made of paper??? 😭😭</p><p>here is 0.5% off a Small Fry. final offer. (not final) (no fries available)</p>',
    buttons: ['i will hold (the potato)', 'no'],
  });

  slop.konami(rugPull);

  afterClick(() =>
    slop.chat({
      name: 'TaterBot (online-ish)',
      avatar: '🥔',
      greeting: 'gm ser!! i am TaterBot. ask me anything (the answer is no)',
      replies: ['no.', 'no 🥔', 'no (see FAQ)', 'Tim says no (from Dubai)', 'the intern says no but nicely', 'Steve drew a picture of the word "no" for u', 'Ei. (that is "no" in Finnish) (translated)', 'no. wagmi tho'],
      placeholder: 'ask a question (answer: no)',
    }),
  );

  /* ---------- custom gag: progress bars that go backwards ---------- */
  function backbar(barSel, pctSel, { from, min = 0, ms = 1400, label = (v) => `${v}%`, onEmpty, max = 100 }) {
    const bar = $(barSel).querySelector('i'), pct = $(pctSel);
    let v = from;
    const draw = () => ((bar.style.width = `${(v / max) * 100}%`), (pct.textContent = label(v)));
    draw();
    every(ms, () => {
      v -= rnd(1, 3);
      if (v <= min) {
        v = min;
        draw();
        const next = onEmpty?.();
        v = next ?? from;
      }
      draw();
    });
  }
  backbar('#lockBar', '#lockPct', {
    from: 87,
    ms: 1600,
    onEmpty: () => {
      toast('🔓 liquidity fully unlocked. Steve re-locked it by hand in MS Paint. this is fine.');
      $('#lockNote').textContent = `re-locked by Steve (attempt #${rnd(40, 400)}). bar is going backwards again (as designed).`;
      return 99;
    },
  });
  backbar('#roadBar', '#roadPct', {
    from: 64,
    ms: 2200,
    min: 8,
    onEmpty: () => (toast('🗺️ roadmap progress reset. we are back at "Phase 2: make website"'), 64),
  });
  backbar('#boostBar', '#boostPct', {
    from: 3,
    max: 4,
    ms: 5000,
    label: (v) => `${v} boost${v === 1 ? '' : 's'}`,
    onEmpty: () => (toast('🚀 server boosts: 0. Steve boosted it by hand. it is a drawing of a boost.'), 3),
  });

  /* ---------- custom gag: already-launched countdown ---------- */
  let since = 214 * 86400 + rnd(1000, 80000);
  const cd = $('#countdown');
  const pad = (n) => String(n).padStart(2, '0');
  const drawCd = () => {
    const d = Math.floor(since / 86400), h = Math.floor((since % 86400) / 3600), m = Math.floor((since % 3600) / 60), s = since % 60;
    cd.textContent = `-${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
  };
  drawCd();
  every(1000, () => (since++, drawCd()));

  /* ---------- custom gag: Steve's MS Paint chart ---------- */
  const candleWrap = $('#candles'), status = $('#paintStatus'), timSold = $('#tim-sold');
  let drawing = false;
  async function drawChart() {
    if (drawing) return;
    drawing = true;
    candleWrap.innerHTML = '';
    timSold.hidden = true;
    const n = innerWidth < 560 ? 9 : 14;
    let pct = 71;
    for (let i = 0; i < n; i++) {
      const h = Math.min(92, 8 + i * (80 / n) + rnd(-3, 6));
      const c = el(`<div class="candle" style="height:${h}%;transform:rotate(${rnd(-3, 3)}deg)"></div>`);
      candleWrap.appendChild(c);
      pct = Math.max(2, pct - rnd(3, 8));
      status.textContent = `Steve is drawing the chart… ${pct}% (going backwards is normal)`;
      await sleep(calm ? 60 : rnd(220, 420));
    }
    await sleep(calm ? 100 : 700);
    const red = el('<div class="candle red" style="height:96%;flex:2.2"></div>');
    candleWrap.appendChild(red);
    timSold.hidden = false;
    slop.quake();
    status.textContent = 'Chart complete: 0%. 📉 Tim sold. this is the bottom (again).';
    toast('📉 Tim sold 91% of supply from Dubai. few understand.');
    drawing = false;
  }
  const chartObs = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) (chartObs.disconnect(), drawChart());
  }, { threshold: 0.4 });
  chartObs.observe($('#canvas'));
  $('#redraw').addEventListener('click', () => {
    if (drawing) return toast('🖌️ Steve is already drawing. pls do not rush Steve.');
    toast('🖌️ Steve: "ok but i am drawing it the same"');
    drawChart();
  });

  /* ---------- custom gag: translate button (it gets worse) ---------- */
  const TR = {
    heroSub: [
      'The potato that goes moon. Hold with hand of diamond. The fry is coming for the you. 🚀',
      'Tuber of moon which goes. Hold it with the diamond-shaped hand. The fried are coming to arrest you. 🚀',
      'Moon tuber is walking. A diamond is holding your hand. Frying is your destiny, officer.',
      'The moon is a potato. The hand is a diamond family. Fried police. Go.',
      'Potato. 🥔',
    ],
    ctaBuy: ['Buy on DEXSlop 🚀🚀', 'Purchase in DEXSlop rocket 🚀', 'Shopping at the Slop of Dex 🚀', 'Shop. Slop. Rocket enters you.', 'Potato. 🥔'],
    menuNote: [
      'Fried Potato Sticks of French Origin (they are not French) (they are not of origin). All potatoes are certificate. Substitutions? No.',
      'Sticks of potato burned in France style (not France). All potatoes have the diploma. Replacing? No.',
      'Burned sticks, French of style. The potatoes graduated. To replace is forbidden. No.',
      'France is burning the sticks. The potato finished university. No no.',
      'Potato. No. 🥔',
    ],
    roadP4: [
      "Potato to moon. The moon is the potato's ancestral house. (in progress) (backwards)",
      'The potato to the moon. The moon is the old house of potato grandfather. (progressing to back)',
      'Grandfather potato lives in the moon house. We are going backwards to visit him.',
      'Moon grandfather. Backwards house. Visiting.',
      'Potato. 🥔',
    ],
    paper: [
      null,
      '$TATER is potato without center. In the start, Tim possessed fries. Then idea possessed Tim. What if fries, but chain of blocks. Each $TATER is 0.0001 of the feeling of one potato, kept in the prison of the cold room (broken). One trillion, drawn by Steve with hand. The rest is moon.',
      '$TATER: centerless potato. Tim was possessed by fries in the beginning. Chain of blocks of fries. Each one is a small feeling in a broken cold prison. Steve has the hand. The moon is the rest.',
      'Potato has no center. Tim is possessed. Blocks are chained. Feelings are cold. Steve is a hand. The moon rests.',
      'Potato. 🥔',
    ],
    open: ['OPEN (probably)', 'OPENED (maybe)', 'IS OPEN (it thinks)', 'OPENING OF DOOR (feeling)', 'POTATO'],
    nfa: ['NOT FINANCIAL ADVICE', 'IS NOT THE ADVICE OF FINANCE', 'ADVICE: NOT FOR FINANCE', 'FINANCE DOES NOT ADVISE YOU', 'POTATO.'],
  };
  const LANGS = ['🌐 EN<small>(ish)</small>', '🌐 KO→EN<small>(pass 2)</small>', '🌐 PT→EN<small>(pass 3)</small>', '🌐 FI→EN<small>(pass 4)</small>', '🌐 JA→EN<small>(pass 5)</small>'];
  const ACC = [12, 7, 3, 1, 0];
  let pass = 0;
  $('#lang').addEventListener('click', () => {
    pass = (pass + 1) % LANGS.length;
    document.querySelectorAll('[data-tr]').forEach((n) => {
      const v = TR[n.dataset.tr]?.[pass];
      if (!n.dataset.orig) n.dataset.orig = n.textContent;
      n.textContent = v ?? n.dataset.orig;
    });
    $('#lang').innerHTML = LANGS[pass];
    toast(pass === 0 ? '🌐 reset to original English (it was already translated 5 times)' : `🌐 translated again. accuracy: ${ACC[pass]}%. Steve checked it by hand.`);
  });

  /* ---------- fake wallet: MetaSpud ---------- */
  const SEED = ['russet', 'yukon', 'gold', 'fingerling', 'tot', 'wedge', 'curly', 'waffle', 'hash', 'brown', 'mash', 'please'];
  let connected = false;
  $('#wallet').addEventListener('click', async () => {
    const btn = $('#wallet');
    if (connected) {
      const r = await modal({ title: '🥔 MetaSpud: Disconnect?', html: '<p>Can I disconnect my wallet?</p><p style="font:800 1.8rem var(--mono);color:var(--red)">No.</p><p class="tiny">(it was never connected. nothing here is real. u are safe. the intern is not.)</p>', buttons: ['ok', 'no'] });
      if (r === 0) toast('🥔 wallet still connected (emotionally)');
      return;
    }
    const seed = SEED.map((w, i) => `<span><b>${i + 1}</b>${w}</span>`).join('');
    const r = await modal({
      title: '🦊🥔 MetaSpud: Join your purse',
      html: `<div class="fox">🦊🥔</div>
        <p>To join the purse, MetaSpud need your secret seed phrase. Just type <b>"please"</b>. <i>(we're kidding. NEVER do this. not here, not anywhere. the intern is legally required to say this.)</i></p>
        <p>Here is a seed phrase we prepared for u, by hand, by Steve:</p>
        <div class="seed">${seed}</div>
        <p class="warn">⚠ Network: Potato Mainnet (Steve's laptop) · Gas: 3 potatoes</p>`,
      buttons: ['Connect (by hand) 🖌️', 'no'],
    });
    if (r !== 0) return toast(r === 1 ? '"no" is a valid answer here. we learned it from the FAQ.' : 'purse not joined. the purse is sad. 🥔');
    btn.disabled = true;
    const steps = ['Steve is drawing ur wallet address…', 'Translating to Finnish…', 'Asking Tim (no reply)…'];
    for (const s of steps) ((btn.textContent = s.slice(0, 22) + '…'), await sleep(700));
    btn.disabled = false;
    connected = true;
    btn.classList.add('connected');
    btn.textContent = '0xP0TA…dEAd';
    modal({
      title: '✅ Purse joined (successfully failed)',
      html: '<p>Wallet: <b class="mono">0xP0TAT0…dEAd</b></p><p>Balance: <b class="mono">0 $TATER</b> (Tim has the rest)</p><p>Can you withdraw? <b>No.</b></p>',
      buttons: ['WAGMI 🚀', 'ngmi'],
    });
  });

  /* ---------- the demo that works badly: swap + order fries ---------- */
  const RATES = { ETH: 4.2e9, USD: 1.3e6, '1 real potato': 0.0004, 'ur dignity': 69, "a Wendy's gift card": 420000 };
  const form = $('#swapForm'), out = $('#swapOut'), recv = $('#recv'), creditsEl = $('#credits');
  const quote = () => {
    const fd = new FormData(form);
    const v = Math.max(0, parseFloat(fd.get('amt')) || 0) * (RATES[fd.get('cur')] ?? 1);
    recv.textContent = v < 1 ? fmt(v, 4) : fmt(Math.round(v));
  };
  form.addEventListener('input', quote);
  quote();
  let credits = 3, busy = false;
  const LOADING = [
    'Approving potato… (requires 2nd potato)',
    'Steve is writing the transaction by hand…',
    'Translating transaction to Finnish and back…',
    'Heating fryer (slippage 99%)…',
    'Asking Tim for permission (Dubai, 3am)…',
    'Almost done (backwards)…',
  ];
  const CAPTIONS = ['WAGMI (u did not)', 'transaction: successful-ish', 'fry temperature: room', 'this is the bottom (again)', 'Steve says thank u for ur purchase (by hand)'];
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    if (credits <= 0) return toast('🥔 out of swaps. Steve needs a nap. come back in 47h. or never.');
    busy = true;
    out.hidden = false;
    out.innerHTML = '<p class="step"></p><div class="bb"><i style="width:96%"></i></div><p class="tiny">progress bar goes backwards. this is a feature.</p>';
    let w = 96;
    for (const line of LOADING) {
      out.querySelector('.step').textContent = line;
      w = Math.max(1, w - rnd(10, 18));
      await sleep(rnd(700, 1200));
      out.querySelector('.bb i').style.width = `${w}%`;
    }
    credits--;
    creditsEl.textContent = credits > 0 ? credits : '0 (Steve is tired)';
    const fd = new FormData(form);
    const got = (Math.random() * 0.0009).toFixed(4);
    const hash = '0xP0TAT0' + Array.from({ length: 30 }, () => '0123456789abcdef'[rnd(0, 15)]).join('') + 'FRY';
    out.innerHTML = `<div class="receipt">
        <h4>🥔 TATER TIM'S SPUD SHACK 🥔<br>behind the Sunoco · rt 9</h4>
        <div><span>You paid</span><span>${escapeHtml(fd.get('amt') || '0')} ${escapeHtml(fd.get('cur'))}</span></div>
        <div><span>Quoted</span><span>${recv.textContent} $TATER</span></div>
        <div><span>Received</span><span>${got} $TATER</span></div>
        <div><span>Slippage</span><span>99.99999%</span></div>
        <div><span>Fries</span><span>1 (cold)</span></div>
        <div><span>Gas</span><span>3 potatoes</span></div>
        <div><span>Refund?</span><span>No.</span></div>
        <span class="hash">tx: ${hash}<br>(written by hand, may be illegible)</span>
      </div><p class="cap">${pick(CAPTIONS)}</p>`;
    slop.quake();
    burst(['🍟', '🥔', '🚀', '💎'], 18);
    busy = false;
  });
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  // A one-off emoji burst (slop.rain runs forever, this stops).
  function burst(emojis, n) {
    if (calm) return;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const d = document.body.appendChild(el(`<span class="slop-drop" aria-hidden="true">${pick(emojis)}</span>`));
        d.style.left = `${Math.random() * 96}vw`;
        d.style.animationDuration = `${2.5 + Math.random() * 3}s`;
        setTimeout(() => d.remove(), 6000);
      }, i * 90);
    }
  }

  /* ---------- discord ---------- */
  $('#joinDiscord').addEventListener('click', () =>
    modal({
      title: '💬 Discord invite',
      html: '<p>This invite has expired. (Tim made it in march.)</p><p>Can I get a new invite?</p><p style="font:800 1.8rem var(--mono);color:var(--red)">No.</p><p class="tiny">but u can talk to TaterBot, bottom right. it also says no.</p>',
      buttons: ['wen invite', 'ok'],
    }),
  );

  /* ---------- FAQ: the last one tries to say yes ---------- */
  document.querySelectorAll('.faq details').forEach((d, i, all) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      if (i === all.length - 1) toast('🤔 the intern almost typed "yes" here. Steve stopped him. by hand.');
    });
  });

  /* ---------- rug pull (konami + footer button) ---------- */
  function rugPull() {
    if (document.body.classList.contains('rugged')) return;
    scrollTo({ top: 0 });
    document.body.classList.add('rugged');
    setTimeout(() => {
      $('#rugMsg').hidden = false;
      $('#unrug').focus();
    }, calm ? 0 : 1200);
  }
  $('#rugBtn').addEventListener('click', rugPull);
  $('#unrug').addEventListener('click', () => {
    $('#rugMsg').hidden = true;
    document.body.classList.remove('rugged');
    toast('🖌️ Steve put the website back by hand. some pixels are in the wrong place now.');
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#rugMsg').hidden) $('#unrug').click();
  });

  /* ---------- intern desperation, after first click ---------- */
  afterClick(() =>
    setTimeout(() => {
      if (document.querySelector('.slop-overlay')) return;
      modal({
        title: '📢 message from the intern',
        html: '<p>hi it is me again. the intern. 🥔</p><p>if anyone knows how to make a website without Steve, pls tell me. last guy who knew was <b>icantcodefyi</b> but he said "no" (he read the FAQ).</p>',
        buttons: ['ok', 'ok (i will buy 1 small fry)'],
      }).then((r) => r === 1 && toast('🙏 thank u. the intern can now afford the bus. one way.'));
    }, 25000),
  );
})();
