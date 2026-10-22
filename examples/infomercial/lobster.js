// LOBSTAKE™ site script. Needs slop.js loaded first (both deferred, in order).
(() => {
  const { $, toast, modal, every, pick, rnd, sleep, afterClick } = window.slop;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ---------- Terms of Service (a cry for help) ---------- */
  const TOS = [
    'By reserving a table, u agree to eat lobster. There is nothing else. We checked.',
    'Prices are "Market Price." The market is me. I am not doing well.',
    'All sales are final, like my divorce, and like SquidCoin.',
    'Hidden fees: butter fee, bib fee, claw fee, "Steve looked at u" fee. These fees are not hidden. They are here. Under my tears.',
    'Dress code: bib. Just the bib is technically acceptable. We wish it wasn\'t. We have seen things.',
    'LOBSTAKE LLC is not responsible for lost items, lost deposits, or lost years (2021 through 2023).',
    '<span class="help">Steve is the chef, waiter, accountant and logo. Steve has not been paid since the halving. If Steve does not answer the phone, please check the walk-in freezer. The door does not open from the inside. Steve wrote this section from the walk-in. Steve is fine.</span>',
    '<span class="help">If u are reading this far, u are the first person who has. Hi. How are u. Nobody asks me how I am. I am ok. I am mostly ok.</span>',
    'Customer agrees not to say the words "Terra," "Luna," "rug," or "my dad\'s retirement fund" on the premises.',
    'Gerald (tank lobster) is not for sale, not on the menu, and is the only one who listens. Do not tap on the glass. He is processing.',
    'Refunds are issued in $LOB tokens. I have 40 million $LOB. Please take some. Please.',
    'This agreement is governed by the laws of the State of Maine and the laws of my mom\'s basement, which are stricter.',
    '<span class="help">Please leave a review. Gary T. cannot do it all by himself. (Gary T. is me.) (I am tired.)</span>',
    'If found, please return this founder to a 9-to-5. He responds to "gm" and the smell of butter.',
    '<span class="help">ok that\'s all the terms. u can scroll back up now. or u could stay. it\'s nice having someone here.</span>',
  ];
  const tosHtml = `<ol>${TOS.map((t) => `<li>${t}</li>`).join('')}</ol>`;
  $('#tosBox').innerHTML = tosHtml;
  let tosToastShown = false;
  $('#tosBox').addEventListener('scroll', (e) => {
    const b = e.target;
    if (!tosToastShown && b.scrollTop + b.clientHeight >= b.scrollHeight - 8) {
      tosToastShown = true;
      toast('🥺 u read the whole thing?? thank u. nobody does that. (Brayden)', 4000);
    }
  });
  const showTos = () => modal({ title: 'TERMS OF SERVICE (please)', html: `<div class="tos">${tosHtml}</div>`, buttons: ['I AGREE (are u ok?)', 'close'], className: 'tos-modal' })
    .then((v) => v === 0 && toast('"no but thanks for asking" - Brayden'));
  $('#tosLink').addEventListener('click', showTos);

  /* ---------- countdown that resets ---------- */
  const cdEls = [$('#countdown'), ...document.querySelectorAll('.cd-mirror')];
  let secs = 60;
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  every(1000, () => {
    secs--;
    if (secs < 0) {
      secs = 600;
      toast('⏰ SALE EXTENDED due to popular demand (Gary T.)', 3500);
    }
    cdEls.forEach((n) => (n.textContent = fmt(secs)));
  });

  /* ---------- backwards progress bar #1 (sticky table prep) ---------- */
  let prep = 87;
  const prepFill = $('#prepFill'), prepLabel = $('#prepLabel'), prepBar = $('.prepbar');
  const prepMsg = (p) =>
    p > 70 ? 'Preparing ur table…' :
    p > 45 ? 'Steve is re-drawing ur table in MS Paint…' :
    p > 20 ? 'Steve used the eraser tool. On ur table…' :
    p > 0 ? 'Ctrl+Z ×40…' :
    p > -40 ? 'Ur table now owes us a table…' : 'Table has been converted to $LOB…';
  every(1400, () => {
    prep -= rnd(1, 3);
    if (prep < -80) {
      prep = 99;
      toast('🦞 table reset to 99%! (it will go down again. that\'s the experience.)');
    }
    prepBar.classList.toggle('neg', prep < 0);
    prepFill.style.width = `${Math.min(100, Math.abs(prep))}%`;
    prepLabel.textContent = `🦞 ${prepMsg(prep)} ${prep}%`;
  });

  /* ---------- urgency: viewers, stock that goes UP, price creep ---------- */
  let viewers = 37;
  every(2500, () => ($('#viewers').textContent = viewers = Math.max(36, viewers + rnd(-2, 3))));
  let stock = 3;
  const stockNotes = ['(Gerald keeps counting himself)', '(restocked: Steve found one in the sink)', '(one escaped)', '(one came back)', '(we counted Gerald twice)', '(the number is a vibe)'];
  every(4200, () => {
    stock = Math.max(1, stock + pick([-1, 1, 1, 2]));
    $('#stock').textContent = stock;
    $('#stockNote').textContent = pick(stockNotes);
  });
  window.slop.creep('.price', { step: 0.35, ms: 900 });

  /* ---------- backwards progress bar #3 (location #2 fundraiser) ---------- */
  let raised = 4212;
  const fundNotes = ['so close!!!', 'Brayden withdrew some for butter', 'gas fees', 'Steve needed a coat (walk-in)', 'still so close!!!', 'refunded Gary T. (he asked nicely)'];
  every(3000, () => {
    raised = Math.max(3, raised - rnd(40, 260));
    $('#fundRaised').textContent = `$${raised.toLocaleString()}`;
    $('#fundFill').style.width = `${(raised / 50000) * 100}%`;
    $('#fundNote').textContent = raised <= 3 ? 'we have $3. it\'s fine. 🙂' : pick(fundNotes);
  });

  /* ---------- Steve's MS Paint kitchen ticket (custom gag) ---------- */
  const cv = $('#orderCanvas');
  const ctx = cv.getContext('2d');
  let color = '#000', drawing = false, drew = false, last = null;
  const pt = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * cv.width, y: ((e.clientY - r.top) / r.height) * cv.height };
  };
  cv.addEventListener('pointerdown', (e) => {
    drawing = true;
    last = pt(e);
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = pt(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    drew = true;
  });
  const stop = () => (drawing = false);
  cv.addEventListener('pointerup', stop);
  cv.addEventListener('pointercancel', stop);
  document.querySelectorAll('.swatch').forEach((s) =>
    s.addEventListener('click', () => {
      document.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on'));
      s.classList.add('on');
      color = s.dataset.c;
      if (color === '#22b14c') toast('🟢 green?? nothing here is green. Steve is concerned.');
    }),
  );
  $('#paintClear').addEventListener('click', () => {
    ctx.clearRect(0, 0, cv.width, cv.height);
    drew = false;
  });
  const steveVerdicts = [
    ['🦞 Steve says: "lobster. coming right up."', 'Interpretation confidence: 12%. (You drew a lobster, right?)'],
    ['🦀 Steve says: "that\'s a crab."', 'We don\'t serve crab. We don\'t talk about crab. Steve has gone outside for a minute.'],
    ['🖼 Steve says: "beautiful. i\'m framing this."', 'Ur lobster will be 40 minutes late. Steve is looking for a frame.'],
    ['🧈 Steve says: "more butter. got it."', 'Steve interprets every drawing as "more butter". He is usually right.'],
    ['😟 Steve says: "is this… a cry for help?"', 'No, Steve, that\'s the Terms of Service. This is a lobster. Probably.'],
  ];
  let sends = 0;
  $('#sendSteve').addEventListener('click', async () => {
    if (!drew) {
      return modal({ title: 'STEVE (KITCHEN)', html: '<p class="big">📄</p><p>U sent Steve a blank page.</p><p><b>Steve:</b> "that\'s how i feel inside."</p>', buttons: ['draw something', 'sorry Steve'], className: 'upsell' });
    }
    sends++;
    toast('📠 faxing drawing to kitchen… (we use a fax. Steve trusts the fax.)', 2000);
    await sleep(2100);
    const [head, body] = sends >= 4 ? ['🛑 Steve says: "ok that\'s enough art."', 'Kitchen is now closed for an Art Show. Admission: market price.'] : pick(steveVerdicts);
    await modal({ title: 'STEVE HAS REVIEWED UR ORDER', html: `<p><b>${head}</b></p><p>${body}</p>`, buttons: ['OK CHEF', 'ok steve'], className: 'upsell' });
  });

  /* ---------- Gary T. video testimonial ---------- */
  const vid = $('#garyVideo');
  const playVid = () => {
    vid.classList.add('err');
    vid.querySelector('.video-cap').textContent = '⚠ This video is unavailable in ur country (Gary\'s). Gary T. has blocked Gary T.';
    toast('▶ buffering… buffering… Gary T. is buffering');
  };
  vid.addEventListener('click', playVid);
  vid.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), playVid()));

  /* ---------- order form: upsell chain → backwards progress → MS Paint reservation ---------- */
  const dateIn = $('#bookForm [name=date]');
  const today = new Date();
  dateIn.min = today.toISOString().slice(0, 10);
  dateIn.value = today.toISOString().slice(0, 10);

  const butterLevels = ['None (Steve is hurt)', 'Normal', 'Extra', 'Concerning', 'Medically Inadvisable', '🧈 SUBMERGED 🧈'];
  const butter = $('#butter');
  butter.addEventListener('input', () => ($('#butterOut').textContent = butterLevels[butter.value]));

  // one-off emoji burst (slop.rain runs forever, this stops)
  function burst(emojis, n = 18) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const d = document.body.appendChild(window.slop.el(`<span class="slop-drop" aria-hidden="true">${pick(emojis)}</span>`));
        d.style.left = `${Math.random() * 95}vw`;
        d.style.animationDuration = `${2.5 + Math.random() * 2.5}s`;
        setTimeout(() => d.remove(), 5200);
      }, i * 120);
    }
  }

  let tables = 3;
  let busy = false;
  const out = $('#bookOut');

  async function upsells() {
    const extras = [];
    const p1 = await modal({
      title: '🛡 WAIT! PROTECT UR BUTTER?',
      html: '<p class="big">🧈</p><p>Add the <b>Butter Protection Plan™</b> for just <mark>$14.99/mo forever</mark>.</p><p>Covers: cold butter, spilled butter, butter eaten by Steve.</p>',
      buttons: ['YES PROTECT MY BUTTER', 'no, I like risk'],
      className: 'upsell',
    });
    if (p1 === 0) extras.push('Butter Protection');
    const p2 = await modal({
      title: '🦞🦞 DOUBLE CLAW OFFER!!!',
      html: '<p class="big">🦞🦞</p><p>Get a <b>2nd lobster</b> for just shipping &amp; handling!</p><p class="fine">Shipping &amp; handling: $68. (Lobster must be handled. It\'s a whole thing. Steve wears gloves.)</p>',
      buttons: ['YES DOUBLE CLAW', 'one lobster is enough (it isn\'t)'],
      className: 'upsell',
    });
    if (p2 === 0) extras.push('2nd Lobster');
    if (p1 !== 0) {
      const p3 = await modal({
        title: '😢 ARE U SURE???',
        html: '<p class="big">🥺🧈</p><p>Are u SURE u don\'t want the Butter Protection Plan?</p><p>The butter asked me to ask u. The butter is crying. (it\'s melting.)</p>',
        buttons: ['OK FINE, PROTECT IT', 'I\'m sure (monster)'],
        className: 'upsell',
      });
      if (p3 === 0) extras.push('Butter Protection (guilted)');
    }
    const p4 = await modal({
      title: '🚀 MINT UR LOBSTER AS AN NFT?',
      html: '<p class="big">🖼🦞</p><p>Steve will draw ur lobster in MS Paint and right-click → Save As for u. <b>U will own it.</b></p><p class="fine">Gas fee: one (1) lobster. Floor price: the floor.</p>',
      buttons: ['MINT IT 🚀🚀', 'no (Brayden cries)'],
      className: 'upsell',
    });
    if (p4 === 0) extras.push('Lobster NFT (.bmp)');
    else toast('😭 Brayden is crying. that\'s ok. he does that.');
    return extras;
  }

  const steps = [
    [12, 'Contacting Steve…'],
    [34, 'Steve is opening MS Paint…'],
    [61, 'Steve is drawing ur table…'],
    [58, 'Steve used the fill bucket on the wrong area…'],
    [40, 'Ctrl+Z… Ctrl+Z… Ctrl+Z…'],
    [22, 'Steve is drawing ur table again, but smaller…'],
    [3, 'Asking Gary T. to confirm…'],
    [-8, 'Reservation complete (negative)'],
  ];

  function paintTicket({ name, party, date, time, butter: b, extras, num }) {
    const extraTxt = extras.length ? `+ ${extras.join(', ')}` : '+ no extras (Brayden noticed)';
    return `<div class="paint-win small book-res">
      <div class="paint-title"><span>🖌 reservation_${num}.bmp - Paint</span><span class="paint-ctl">_ □ ✕</span></div>
      <svg viewBox="0 0 400 260" role="img" aria-label="Steve's MS Paint drawing of ur reservation" shape-rendering="crispEdges">
        <rect width="400" height="260" fill="#fff"/>
        <circle cx="360" cy="34" r="18" fill="#fff200" stroke="#000" stroke-width="3"/>
        <path d="M352 30h2M366 30h2M352 42q8 6 16 0" stroke="#000" stroke-width="3" fill="none"/>
        <path d="M70 170L250 160 262 186 64 196Z" fill="#b97a57" stroke="#000" stroke-width="3"/>
        <path d="M84 194V236M240 186V232M150 194V226" stroke="#000" stroke-width="4"/>
        <path d="M40 150V220M40 180H62M290 150V215M290 178H268" stroke="#7f7f7f" stroke-width="5"/>
        <ellipse cx="160" cy="166" rx="40" ry="10" fill="#fff" stroke="#000" stroke-width="2"/>
        <ellipse cx="160" cy="158" rx="26" ry="10" fill="#ed1c24" stroke="#000" stroke-width="2"/>
        <circle cx="128" cy="148" r="8" fill="#ed1c24" stroke="#000" stroke-width="2"/>
        <circle cx="192" cy="148" r="8" fill="#ed1c24" stroke="#000" stroke-width="2"/>
        <text x="20" y="36" font-family="Arial" font-size="22" font-weight="700" fill="#ed1c24">TABLE 4 ${esc(name)}</text>
        <text x="20" y="62" font-family="Arial" font-size="15" fill="#000">${esc(party)} ppl @ ${esc(time)}</text>
        <text x="20" y="82" font-family="Arial" font-size="15" fill="#000">${esc(date)} (or so)</text>
        <text x="20" y="102" font-family="Arial" font-size="12" fill="#3f48cc">butter: ${esc(b)}</text>
        <text x="20" y="120" font-family="Arial" font-size="11" fill="#000">${esc(extraTxt.slice(0, 64))}</text>
        <text x="300" y="250" font-family="Comic Sans MS, Arial" font-size="14" fill="#3f48cc">ur welcome -steve</text>
        <text x="270" y="140" font-family="Arial" font-size="10" fill="#000">(table not to scale)</text>
      </svg>
      <div class="paint-status">Confirmation #${num} &nbsp;|&nbsp; Table prep: -8% &nbsp;|&nbsp; Steve's interpretation is final</div>
    </div>`;
  }

  $('#bookForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    if (tables <= 0) {
      return modal({
        title: 'SOLD OUT!!! (kind of)',
        html: '<p class="big">👨‍🍳</p><p>No tables left. <b>Steve is the table now.</b></p><p>U may eat off Steve. Steve has agreed to this. Steve was not asked.</p>',
        buttons: ['EAT OFF STEVE', 'no thank u'],
        className: 'upsell',
      }).then((v) => v === 0 && toast('👨‍🍳 Steve: "please use a plate tho"'));
    }
    busy = true;
    const fd = new FormData(e.target);
    const extras = await upsells();
    out.hidden = false;
    out.innerHTML = '<div class="book-load"><p class="book-pct">0%</p><div class="book-bar"><i style="width:0"></i></div><p class="book-msg"></p></div>';
    out.scrollIntoView({ behavior: 'smooth', block: 'center' });
    for (const [pct, msg] of steps) {
      out.querySelector('.book-pct').textContent = `${pct}%`;
      out.querySelector('.book-msg').textContent = msg;
      out.querySelector('.book-bar').classList.toggle('neg', pct < 0);
      out.querySelector('.book-bar i').style.width = `${Math.abs(pct)}%`;
      await sleep(rnd(650, 1100));
    }
    tables--;
    $('#tablesLeft').textContent = tables > 0 ? tables : '0 (Steve is the table now)';
    const num = String(rnd(1, 9)).padStart(6, '0');
    out.innerHTML = paintTicket({
      name: fd.get('name') || 'Gary T.',
      party: fd.get('party'),
      date: fd.get('date'),
      time: fd.get('time'),
      butter: butterLevels[fd.get('butter')],
      extras,
      num,
    }) + `<p class="slop-caption">${esc(pick([
      `Confirmation #${num}. (Same number as Gary T.'s. Please sit on his lap.)`,
      'Ur table is -8% ready. That\'s basically 92% if u think about it.',
      'Steve drew this in 47 minutes. He is very proud. Please say something nice.',
      'This .bmp is ur receipt, ur ticket, and ur NFT. Do not lose it. Do not right-click it.',
    ]))}</p>`;
    window.slop.quake();
    burst(['🦞', '🧈', '🦞', '💸']);
    busy = false;
  });

  /* ---------- engine gags ---------- */
  window.slop.cookie({
    text: '🍪🧈 We use cookies, butter, and ur webcam (Steve gets lonely). By smelling this site u agree to the <b>Terms</b> (please read the Terms) (section 8).',
    accept: ['Accept', 'ACCEPT & BUTTER'],
    reject: 'reject',
    onReject: 'Reject is only available with the Butter Protection Plan™ 🧈',
  });

  window.slop.proof({
    template: () => `🔔 Gary T. in ${pick(['Portland, ME', 'also Portland, ME', "Steve's basement", 'the parking lot (disguised)', 'Ohio (visiting)', 'the tank??'])} just ${pick(['booked a table', 'booked a table (again)', 'left a ★★★★★ review', 'bought the Butter Protection Plan', 'cried at the butter', 'renewed his disguise', 'reviewed his own review'])} ${rnd(1, 59)} seconds ago`,
    ms: 11000,
  });

  window.slop.exit({
    title: '⚠ WAIT!!! UR CART IS CRYING ⚠',
    html: '<p class="big">😭🦞</p><p>ok it\'s the steam. but STILL.</p><p>Here is <b>0.5% off</b>. Final offer. (not final)</p><p class="fine">Gerald watches u go.</p>',
    buttons: ['OK I\'LL STAY', 'leave (Gerald is hurt)'],
  });

  window.slop.chat({
    name: 'LobsterGPT (it\'s Steve)',
    avatar: '🦞',
    greeting: 'gm ser 🦞 welcome to LOBSTAKE. how can i help u lobster today?',
    placeholder: 'type here (Steve can\'t read)',
    replies: [
      'we only have lobster',
      'ser this is a seafood restaurant',
      'Steve is typing… (in MS Paint, ETA 40 min)',
      'have u considered: lobster',
      'i forwarded ur message to Gary T. he gave it ★★★★★',
      'pls read the Terms. section 8. pls.',
      'wagmi (we\'re all gonna melt ingredients)',
      'i am in the walk-in. it is cold. anyway how is ur day',
    ],
  });

  afterClick(() => setTimeout(() => toast('📞 1-800-LOB-STAK: Steve is standing by (Steve is also boiling)'), 15000));
  window.slop.konami(() => {
    toast('🦞 GERALD MODE: all prices now in lobsters. everything costs 1 lobster.');
    document.querySelectorAll('.bonuses s').forEach((s) => (s.textContent = '1 🦞'));
  });
})();
