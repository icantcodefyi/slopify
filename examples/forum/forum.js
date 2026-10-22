// DGC Boards: forum-specific gags. Requires ./slop.js loaded first.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal, afterClick, every } = window.slop;
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- running gag 2: the apology counter ----------
  let sorry = 212;
  const drawSorry = () => $$('[data-sorry]').forEach((n) => (n.textContent = sorry.toLocaleString()));
  const apologize = (n = 1) => ((sorry += n), drawSorry());
  // every toast/modal line that contains "sorry" bumps the counter
  const say = (msg, ms) => {
    toast(msg, ms);
    const hits = (msg.match(/sorry/gi) || []).length;
    if (hits) apologize(hits);
  };
  drawSorry();

  // ---------- running gag 1: the permit fee creeps up (one shared price) ----------
  let fee = 4.99;
  const feeStr = () => '$' + fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const drawFee = () => $$('[data-fee]').forEach((n) => (n.textContent = feeStr()));
  every(1200, () => {
    fee += Math.random() * 0.07 + (fee > 9 ? 0.04 : 0.01);
    drawFee();
  });
  const feeMilestones = [6, 8, 10, 15, 20];
  every(1200, () => {
    if (fee >= feeMilestones[0]) {
      const m = feeMilestones.shift();
      say(`📈 NOTICE: permit fee has passed $${m}.00. sorry. inflation (we learned it in Social Studies)`);
    }
  });

  // ---------- views + online counters ----------
  let views = 48201;
  every(900, () => ($('#views').textContent = (views += rnd(1, 4)).toLocaleString()));
  let online = 4003;
  every(2200, () => ($('#online').textContent = (online += rnd(-3, 9)).toLocaleString()));

  // ---------- clock + school bell countdown (custom gag) ----------
  const periods = ['3rd period', '4th period (lunch)', '5th period (Math, again)', 'detention'];
  let periodIdx = 0, secs = 360;
  const clock = new Date(2026, 9, 22, 10, 47);
  const drawBell = () => {
    $('#bell').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    $('#bell-label').textContent = periods[periodIdx];
  };
  drawBell();
  every(1000, async () => {
    clock.setSeconds(clock.getSeconds() + 1);
    $('#clock').textContent = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    secs--;
    if (secs > 0) return drawBell();
    secs = 360;
    const done = periods[periodIdx];
    periodIdx = Math.min(periodIdx + 1, periods.length - 1);
    drawBell();
    const v = await modal({
      title: '🔔 DGC Boards — SYSTEM NOTICE',
      html: `<p><b>${esc(done)} has ended.</b></p><p>The Department of Goose Crossings is now closed while the Commissioner walks to his next class. Permits submitted during passing period will be processed by Steve (he does not have class).</p><p class="gensmall">sorry. i have to log off before Mr. Delgado sees.</p>`,
      buttons: ['OK', 'tell Mr. Delgado'],
    });
    apologize();
    if (v === 1) say('📛 u told Mr. Delgado. the admin has been assigned 2 extra worksheets. sorry (him)');
  });

  // ---------- running gag 3: APPLY button runs away ----------
  const taunts = ['nope', 'too slow', 'HONK', 'security feature', 'sorry!!', 'almost', 'the button is tired', 'ok fine'];
  $$('.runaway-zone').forEach((zone) => {
    const btn = $('.runaway', zone);
    const taunt = $('.zone-taunt', zone);
    let escapes = 0, lastFlee = 0;
    const tired = () => escapes >= 6;
    const flee = () => {
      if (tired() || Date.now() - lastFlee < 350) return;
      lastFlee = Date.now();
      escapes++;
      const zr = zone.getBoundingClientRect();
      const bw = btn.offsetWidth, bh = btn.offsetHeight;
      const minX = bw / 2 + 4, maxX = Math.max(minX, zr.width - bw / 2 - 4);
      const minY = bh / 2 + 14, maxY = Math.max(minY, zr.height - bh / 2 - 14);
      const curX = parseFloat(btn.style.left) || zr.width / 2;
      let x, y, tries = 0;
      do {
        x = minX + Math.random() * (maxX - minX);
        y = minY + Math.random() * (maxY - minY);
        tries++;
      } while (Math.abs(x - curX) < bw * 0.8 && tries < 10);
      btn.style.left = `${x}px`;
      btn.style.top = `${y}px`;
      taunt.textContent = `${taunts[Math.min(escapes - 1, taunts.length - 1)]} (${escapes}/6)`;
      if (escapes === 3) apologize();
      if (tired()) {
        btn.classList.add('tired');
        btn.textContent = '😮‍💨 ok fine. click me';
        taunt.textContent = 'the button is tired (like a goose)';
      }
    };
    btn.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && flee());
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || tired()) return;
      const r = btn.getBoundingClientRect();
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
      const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      if (Math.hypot(dx, dy) < 18) flee();
    });
    // touch: the first taps make it hop away
    btn.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || tired()) return;
      e.preventDefault();
      flee();
    });
    btn.addEventListener('click', async (e) => {
      if (Date.now() - lastFlee < 350) return;
      if (!tired()) { e.preventDefault(); flee(); return; }
      const v = await modal({
        title: '📝 DGC — Application Gateway',
        html: `<p>Congratulations, citizen! You caught the button.</p><p>You have been redirected to <b>Form G-00SE</b>, which is a post further down this thread. sorry, i don't know how to make pages yet.</p><p class="gensmall">Current fee: ${esc(feeStr())} (it went up while u were chasing)</p>`,
        buttons: ['TAKE ME TO THE FORM', 'I just wanted to click it'],
      });
      apologize();
      if (v === 0) $('#form-post').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      else say('respect. the button respects u too. sorry for running');
    });
  });

  // ---------- Steve's MS Paint permit ----------
  let permitNo = 1;
  const jit = (n = 3) => (Math.random() * 2 - 1) * n;
  const wobbly = (pts) => pts.map(([x, y]) => `${(x + jit()).toFixed(1)},${(y + jit()).toFixed(1)}`).join(' ');
  function paintPermit({ name, goose, cross, dir, why, price }) {
    const no = String(permitNo++).padStart(7, '0');
    const round = /round/i.test(dir);
    const svg = `<svg viewBox="0 0 400 250" role="img" aria-label="Hand drawn MS Paint goose crossing permit for ${esc(name)}">
      <path d="M150 0 Q170 40 210 30 Q260 70 300 40 Q340 90 400 70 L400 0Z" fill="#ffff00" opacity=".9"/>
      <polyline points="${wobbly([[8, 8], [392, 10], [390, 242], [10, 240], [8, 8]])}" fill="none" stroke="#000" stroke-width="3"/>
      <text x="${200 + jit(4)}" y="40" text-anchor="middle" font-family="'Comic Sans MS','Comic Neue',cursive" font-weight="bold" font-size="26" fill="#0000ff" transform="rotate(${jit(2)} 200 40)">GOOSE PERMIT</text>
      <text x="22" y="72" font-family="'Comic Sans MS','Comic Neue',cursive" font-size="13">No. ${no}</text>
      <text x="22" y="98" font-family="'Comic Sans MS','Comic Neue',cursive" font-size="15">this person: <tspan fill="#ff0000" font-weight="bold">${esc(name.slice(0, 22))}</tspan></text>
      <text x="22" y="120" font-family="'Comic Sans MS','Comic Neue',cursive" font-size="13">may cross: ${esc(cross.slice(0, 26))}</text>
      <text x="22" y="140" font-family="'Comic Sans MS','Comic Neue',cursive" font-size="13">goose: ${esc((goose || 'unknown (hostile)').slice(0, 22))}</text>
      <text x="22" y="160" font-family="'Comic Sans MS','Comic Neue',cursive" font-size="11" fill="#555">reason: ${esc((why || 'to get to the other side').slice(0, 34))}</text>
      <text x="22" y="180" font-family="'Comic Sans MS','Comic Neue',cursive" font-size="11" fill="#008000">paid: ${esc(price)} (+ goose tax)</text>
      <g transform="translate(${292 + jit(4)} ${150 + jit(4)}) ${round ? '' : 'scale(-1 1)'}">
        <ellipse cx="0" cy="20" rx="38" ry="22" fill="#fff" stroke="#000" stroke-width="3"/>
        <path d="M-6 6 Q-14 -30 -26 -44" stroke="#000" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M-6 6 Q-14 -30 -26 -44" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="-28" cy="-48" r="9" fill="#fff" stroke="#000" stroke-width="3"/>
        <circle cx="-30" cy="-50" r="2" fill="#000"/>
        <path d="M-36 -48 L-52 -44 L-36 -42Z" fill="#ff8800" stroke="#000" stroke-width="2"/>
        <path d="M-8 42 L-8 58 L-16 60 M10 42 L10 58 L2 60" stroke="#ff8800" stroke-width="4" fill="none"/>
      </g>
      <text x="300" y="${80 + jit(4)}" font-family="Arial" font-weight="bold" font-size="12" transform="rotate(${jit(8)} 300 80)">HONK</text>
      ${round ? '<path d="M210 220 L250 220 M244 214 L252 220 L244 226 M250 232 L210 232 M216 226 L208 232 L216 238" stroke="#000" stroke-width="3" fill="none"/>' : ''}
      <g transform="rotate(${-14 + jit(4)} 110 215)"><rect x="40" y="196" width="140" height="36" fill="none" stroke="#ff0000" stroke-width="4"/><text x="110" y="222" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-size="24" fill="#ff0000">APPROVED</text></g>
      <path d="M300 230 q8 -18 14 0 t14 0 t12 -6 q10 -14 16 4" stroke="#000080" stroke-width="2" fill="none"/>
      <text x="316" y="244" font-family="Arial" font-size="8">Steve</text>
      <circle cx="${rnd(30, 370)}" cy="${rnd(20, 230)}" r="2" fill="#ff00ff"/>
    </svg>`;
    const palette = ['#000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#fff', '#c0c0c0', '#f00', '#ff0', '#0f0', '#0ff', '#00f', '#f0f'];
    return `<div class="paint">
      <div class="paint-title"><span>🎨 permit_${no}_FINAL_final2.bmp - Paint</span><span>_ □ ✕</span></div>
      <div class="paint-menu"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>I</u>mage</span><span><u>C</u>olors</span><span><u>H</u>elp</span></div>
      <div class="paint-main"><div class="paint-tools" aria-hidden="true">${'✂ ▢ 🧽 🪣 💉 🔍 ✏ 🖌 💨 A ╲ ∿ ▭ ⬠ ⬭ ▢'.split(' ').map((t) => `<span>${t}</span>`).join('')}</div>
      <div class="paint-canvas">${svg}</div></div>
      <div class="paint-palette" aria-hidden="true">${palette.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
      <div class="paint-status">For Help, click Help Topics on the Help Menu. · ${rnd(41, 58)} min</div>
    </div>`;
  }
  $('#steve-sample').innerHTML = paintPermit({ name: 'LINDA', goose: 'that one', cross: 'Route 9', dir: 'One way', why: 'GOOSE IN FRONT OF MY CAR', price: '$4.99' });

  // ---------- the demo: Form G-00SE → Steve ----------
  slop.captcha('#g00se', {
    prompt: 'Government security check: select all squares with a GOOSE',
    tiles: ['🪿', '🦆', '🪿', '🦢', '🪿', '🐓', '🪿', '🦆', '🪿'],
    fail: '❌ wrong. one of those was a duck in a goose costume. sorry. try again',
  });
  slop.demo({
    form: '#g00se',
    output: '#g00se-out',
    credits: 3,
    creditsEl: '#credits',
    loading: [
      "Uploading form to Steve's basement…",
      'Steve is opening MS Paint…',
      'Steve is selecting the bucket tool…',
      'Bucket fill leaked onto the whole permit. Steve pressed Ctrl+Z 31 times…',
      'Steve is drawing the goose freehand (with a mouse)…',
      'Saving as .bmp (4.2 MB) on a floppy…',
    ],
    captions: [
      'APPROVED. Steve has approved 48,202 permits and denied 0. He cannot find the deny tool.',
      'APPROVED. Processing time: 47 minutes. The goose has been notified (it does not care).',
      'APPROVED. Steve says the goose is "the best one he\'s drawn". It is the same goose.',
      'APPROVED. Note: this permit is not valid in Ohio. Nothing is.',
    ],
    render: (fd) => {
      const f = Object.fromEntries(fd);
      return `<p><b>🪿 Permit issued!</b> Fee charged: <b class="fee">${esc(feeStr())}</b> (locked in) (it is not locked in)</p>${paintPermit({ ...f, price: feeStr() })}`;
    },
    onResult: () => {
      apologize();
      say('📩 PM from SteveTheClerk: "approved."');
    },
  });

  // ---------- poll (custom gag: the goose wins) ----------
  const pollRes = $('#poll-results');
  const showPoll = (choice) => {
    const opts = ['Yes', 'No', 'I am the goose', 'what is this poll for'];
    const votes = [3, 2, 4012, 1];
    if (choice != null) votes[choice]++;
    const total = votes.reduce((a, b) => a + b, 0);
    pollRes.innerHTML = opts.map((o, i) => {
      const pct = (votes[i] / total) * 100;
      return `<div class="pr-row ${i === 2 ? 'hot' : ''}"><span>${o}</span><span class="pr-bar"><i style="width:0"></i></span><span>[ ${pct.toFixed(1)}% ]</span></div>`;
    }).join('') + `<p class="gensmall">Total Votes: ${total.toLocaleString()} · ${choice != null ? 'ur vote was counted as "I am the goose". sorry, the radio buttons are broken.' : 'the bots are all geese. we checked.'}</p>`;
    requestAnimationFrame(() => requestAnimationFrame(() => $$('.pr-bar i', pollRes).forEach((b, i) => (b.style.width = `${Math.max(1, (votes[i] / total) * 100)}%`))));
    pollRes.hidden = false;
    $('#poll-form').hidden = true;
  };
  $('#poll-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = new FormData(e.target).get('v');
    if (v == null) return say('pick an option first. sorry. (pick "I am the goose")');
    showPoll(2);
    apologize();
  });
  $('#poll-view').addEventListener('click', (e) => (e.preventDefault(), showPoll(null)));

  // ---------- quick reply: post appears, then a mod deletes it ----------
  const posts = $('#new-posts');
  const modReasons = [
    'Please use the search function.',
    'Thread is locked. (how did u even post this)',
    'Off-topic: not about geese.',
    'On-topic: too much about geese.',
    'Duplicate of a post from 2005.',
  ];
  $('#quick').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ta = $('#qr-text');
    const text = ta.value.trim();
    if (!text) return say('Your message is empty. sorry. even "first" is something');
    ta.value = '';
    const now = clock.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
    const post = el(`<article class="post row2">
      <aside class="up"><b class="name">Guest_${rnd(1000, 9999)}</b><span class="utitle">Unverified Citizen</span><span class="pips">☆☆☆☆☆</span><div class="avatar" aria-hidden="true">👤</div><span class="det">Joined: just now<br>Posts: 1<br>Permit: pending</span></aside>
      <div class="pp"><div class="ph"><span>📄 Posted: Thu Oct 22, 2026 ${now}</span><span>Post subject: Re: OFFICIAL ANNOUNCEMENT</span></div>
      <div class="pb"><p></p></div></div></article>`);
    post.querySelector('.pb p').textContent = text;
    posts.appendChild(post);
    post.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' });
    say('✅ Your message has been entered successfully.');
    await sleep(2600);
    post.classList.add('removed');
    post.querySelector('.pb').innerHTML = `<p class="modtxt">[ This post was removed by Honk_Moderator. Reason: ${esc(pick(modReasons))} ]</p>`;
    say('🔨 Honk_Moderator deleted ur post. sorry, i cant stop him, he is my older cousin -admin', 3500);
  });

  // ---------- login box: flood control error storm ----------
  $('#loginbox').addEventListener('submit', (e) => {
    e.preventDefault();
    slop.errors([
      'Flood control: You cannot log in again so soon. Please wait 3 years.',
      'Login failed: You are not Linda\'s son.',
      'Your password is "goose". Everyone\'s password is "goose". sorry.',
      'Session expired (3rd period ended).',
      'The school firewall has blocked "logging in".',
      'General Error: Could not connect to the database (Steve unplugged it to charge his phone).',
    ], 2);
    apologize();
  });

  // ---------- nav links, "must be logged in" image, pagination ----------
  const navMsgs = {
    faq: ['FAQ', '<p><b>Q: Is this a real government?</b><br>A: it is real in my heart. sorry.</p><p><b>Q: Why does the fee keep going up?</b><br>A: inflation.</p><p><b>Q: Who is Steve?</b><br>A: Steve.</p>'],
    search: ['Search', '<p>🔍 Please use the search function.</p><p class="gensmall">(this is the search function. sorry)</p>'],
    memberlist: ['Memberlist', '<p>1. xX_GooseAdmin_Xx (me)<br>2. SteveTheClerk<br>3. Honk_Moderator (my cousin)<br>4. LINDA_CAPS_LOCK (my mom)<br>5. PondLawyer_Esq (banned)<br>6. The_Goose (not a member, just walked in)<br>7–4,000. bots</p>'],
    usergroups: ['Usergroups', '<p><b>Geese</b> (1 member, hostile)<br><b>Ducks</b> (pending review)<br><b>People who caught the button</b> (0 members)</p>'],
    register: ['Registration', '<p>Registration is closed.</p><p>The admin is 13 and the internet says he isn\'t allowed to register people. or himself. sorry.</p>'],
    profile: ['Profile', '<p>You are: <b>Guest</b>.<br>Rank: Unpermitted Pedestrian ☆☆☆☆☆<br>Posts: 0<br>Geese crossed: 0</p>'],
    pm: ['Private Messages', '<p>📩 <b>1 new message</b> from xX_GooseAdmin_Xx:</p><p class="quote">sorry</p>'],
    login: ['Log in', '<p>Please use the login box below the header. sorry it is so far away. it took 3 class periods to center it.</p>'],
    newtopic: ['Post a new topic', '<p>⛔ New topics can only be posted by people who have a Goose Crossing Permit.</p><p>Permits can only be applied for by posting a new topic.</p><p class="gensmall">sorry. i noticed this too late.</p>'],
  };
  $$('[data-nav]').forEach((a) => a.addEventListener('click', async (e) => {
    e.preventDefault();
    const [title, html] = navMsgs[a.dataset.nav];
    await modal({ title: `DGC Boards :: ${title}`, html, buttons: ['OK'] });
    if (/sorry/i.test(html)) apologize();
  }));
  $$('[data-t]').forEach((a) => a.addEventListener('click', (e) => (e.preventDefault(), say(a.dataset.t))));
  $$('[data-page]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    say(`Loading page ${Number(a.dataset.page).toLocaleString()} of 4,812… it's this page. every page is this page. sorry`, 3500);
    window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
  }));
  $('#jump').addEventListener('change', (e) => {
    say(`Jumping to "${e.target.value}"… jump failed. there is only one forum. sorry`);
    e.target.selectedIndex = 0;
  });
  $('.need-login').addEventListener('click', async () => {
    const v = await modal({
      title: 'DGC Boards :: Information',
      html: '<p>🔒 You must be logged in to view this image.</p><p>Registration is closed.</p><p class="gensmall">(it is a picture of a goose. it is the goose from post #6. it is also in front of ur car)</p>',
      buttons: ['Log in', 'Imagine the goose'],
    });
    if (v === 0) $('#loginbox input').focus();
    if (v === 1) say('🪿 correct. that is the image.');
  });

  // ---------- cookie, proof, clippy, PM, exit ----------
  slop.cookie({
    text: '🍪 This government website uses cookies. The goose ate most of them. By continuing to read, you consent to the goose.',
    accept: ['Accept', 'ACCEPT (official)'],
    reject: 'reject (Form G-07, mail-in only)',
    onReject: 'Rejecting cookies requires a Cookie Rejection Permit (' + '$4.99' + '+). sorry',
  });

  slop.proof({
    ms: 11000,
    template: () => pick([
      `✏️ SteveTheClerk is typing a reply…`,
      `🔔 Someone in ${pick(['Ohio', 'a Walmart parking lot', 'Room 114', 'the middle of Route 9', 'the pond'])} just got a permit approved ${rnd(2, 59)} seconds ago`,
      `🪿 The_Goose is viewing this topic`,
      `🔔 Someone in Florida (again) just tried to permit an alligator. denied (first ever denial)`,
      `🎨 Steve just used the bucket tool. it leaked`,
      `👀 Honk_Moderator is watching you type`,
      `📈 Permit fee is now ${feeStr()}. ${rnd(3, 40)} citizens wept`,
    ]),
  });

  slop.clippy([
    'HONK. It looks like ur trying to cross. Do u have a permit?',
    'HONK. The fee went up while u read this bubble.',
    'HONK honk. I am not a goose. I am the Permit Assistant.',
    'Tip: the APPLY button gets tired after 6 tries. so do I. HONK.',
    'It looks like ur reading a locked thread. Would u like to post anyway? (it will be deleted)',
  ], { face: '🪿', first: 22000, ms: 30000 });

  afterClick(() => setTimeout(async () => {
    const v = await modal({
      title: '✉️ You have a new private message',
      html: '<p class="pm-from"><b>From:</b> xX_GooseAdmin_Xx · <b>Subject:</b> sorry</p><p>hi, sorry for this popup. phpBB makes them automatically and i dont know how to turn it off.</p><p>also if u see a goose pls dont tell it about this website.</p><p class="gensmall">p.s. sorry</p>',
      buttons: ['Close window', 'Reply ("its ok")'],
    });
    apologize(3);
    if (v === 1) say('reply sent. he said "sorry". sorry');
  }, 30000));

  slop.exit({
    title: '🪿 DGC Boards — WAIT',
    html: `<p><b>ur leaving without a permit??</b></p><p>Leaving a government website without a Goose Crossing Permit counts as crossing. The goose has been notified.</p><p class="gensmall">sorry. also the fee went up while u moved ur mouse.</p>`,
    buttons: ['I accept the goose', 'leave anyway (hiss)'],
  });

  // ---------- konami: goose migration ----------
  slop.konami(() => {
    say('🪿🪿🪿 MIGRATION SEASON. all permits are suspended. sorry', 4000);
    if (calm) return;
    for (let i = 0; i < 30; i++) {
      setTimeout(() => {
        const d = document.body.appendChild(el('<span class="slop-drop" aria-hidden="true">🪿</span>'));
        d.style.left = `${Math.random() * 100}vw`;
        d.style.animationDuration = `${3 + Math.random() * 3}s`;
        setTimeout(() => d.remove(), 6500);
      }, i * 120);
    }
  });

  // occasional unprompted apologies
  every(9000, () => apologize(rnd(0, 2)));
})();
