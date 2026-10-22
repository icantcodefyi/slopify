// SlopSpace: Mike Rowave's profile. Needs slop.js loaded first.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal, afterClick, every } = window.slop;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const MW = '<span class="mw" aria-hidden="true"></span>';

  // ---------- Steve's MS Paint pics ----------
  // Every friend pic is an emoji on a paint-bucket fill with Steve's jaggy mouse scribbles on top.
  const scribble = (seed, color) => {
    let s = seed;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280) * 100;
    const pts = Array.from({ length: 6 }, () => `${r().toFixed(0)},${r().toFixed(0)}`).join(' ');
    return `<svg viewBox="0 0 100 100" shape-rendering="crispEdges" aria-hidden="true">
      <polygon points="0,${70 + (seed % 20)} 30,${80 - (seed % 15)} 0,100" fill="${color}" opacity=".9"/>
      <polyline points="${pts}" fill="none" stroke="#000" stroke-width="2"/>
      <text x="58" y="96" font-size="9" font-family="Comic Sans MS, cursive" fill="#000">-steve</text></svg>`;
  };
  const paint = (face, bg, seed = 7, leak = '#ff0') =>
    `<span class="paint" style="background:${bg}">${scribble(seed, leak)}<span class="em" aria-hidden="true">${face}</span></span>`;

  // ---------- Top 8 (custom era gag: Top 8 drama) ----------
  const friends = [
    { name: 'Tom', note: '(why is my pic a microwave)', face: MW, bg: '#9cf', seed: 3,
      say: 'Tom: "i have been everyone\'s first friend since 2003. why did Steve draw me as a microwave. STEVE."' },
    { name: 'Toaster', note: "(it's complicated)", face: '🍞', bg: '#fc9', seed: 11,
      say: 'Toaster: "we were both on the same counter. that\'s all i\'ll say." 💔' },
    { name: 'Fridge', note: '(dad)', face: '🧊', bg: '#cff', seed: 23,
      say: 'Fridge (dad): "i am very cool about this." (he is not)' },
    { name: 'Steve', note: "(we're not talking)", face: '🖌️', bg: '#fff', seed: 41,
      say: 'Steve: "i drew all of u. with a MOUSE. and this is the thanks i get. #4."' },
    { name: 'Popcorn Bag', note: '(ex. burnt.)', face: '🍿', bg: '#f99', seed: 5,
      say: 'Popcorn Bag: "he said 2 minutes. it was 4. i still smell like it."' },
    { name: 'Air Fryer', note: '(new. threatening.)', face: '🍟', bg: '#333', seed: 17,
      say: 'Air Fryer: "u can make wings in 12 min?? i can make wings in 11. crispy. just saying." 😤' },
    { name: 'Spoon', note: '(talking stage)', face: '🥄', bg: '#cfc', seed: 29,
      say: 'Spoon: "omg hi. is it true forks r banned here? lol good."' },
    { name: 'Mike Rowave', note: '(me) (self love 💖)', face: MW, bg: '#fcf', seed: 31,
      say: 'Mike put himself in his own Top 8. Brayden calls it "buying ur own bags".' },
  ];
  const top8 = $('#top8');
  const drawTop8 = (moved = -1) => {
    top8.innerHTML = friends
      .map((f, i) => `<li class="${i === moved ? 'moved' : ''}"><button data-f="${i}">${paint(f.face, f.bg, f.seed)}<span class="fname">${esc(f.name)}</span><span class="fnote">${esc(f.note)}</span></button></li>`)
      .join('');
  };
  drawTop8();
  top8.addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (b) toast(friends[b.dataset.f].say, 4200);
  });
  const shuffleLines = [
    'Toaster saw that. 💔',
    'Steve moved himself back to #4. how does he have the password',
    'Tom is #1. Tom is always #1. Tom will be #1 after the sun burns out.',
    'Air Fryer is now above Popcorn Bag. Popcorn Bag has posted a bulletin about it.',
    'Mike tried to remove Mike. Mike re-added Mike.',
  ];
  $('#shuffle').addEventListener('click', () => {
    const rest = friends.slice(1).sort(() => Math.random() - 0.5);
    const si = rest.findIndex((f) => f.name === 'Steve');
    const [steve] = rest.splice(si, 1);
    rest.splice(2, 0, steve); // Steve ALWAYS ends up at #4
    friends.splice(1, friends.length - 1, ...rest);
    drawTop8(3);
    toast(pick(shuffleLines), 3600);
  });
  window.slop.creep('#frcount', { step: 0.02, ms: 4000, prefix: '', decimals: 0 });

  // ---------- comments wall ----------
  const comments = [
    { who: 'Tom', face: MW, bg: '#9cf', t: '10/21/2006 11:58 PM', msg: 'Thanks for the add! ... wait why is my pic a microwave. who did this' },
    { who: 'Brayden 🚀', face: '🕶️', bg: '#000', t: '10/21/2006 9:41 PM', msg: 'gm. reminder: all date requests go thru me. 2% fee. Mike\'s love floor price is up 40% this week. also try <b>GOLD</b>. it\'s the same but gold. wagmi' },
    { who: 'Popcorn Bag', face: '🍿', bg: '#f99', t: '10/20/2006 2:13 AM', msg: 'u said 2 minutes. it was 4. i trusted the button. i trusted U. 💔 (half of me never even popped)' },
    { who: 'Steve', face: '🖌️', bg: '#fff', t: '10/19/2006 4:47 PM', msg: 'made u a new pic. its u but with legs. 4 hrs. mouse only. ur welcome. we still not talking tho' },
    { who: 'xXburritoGrl88Xx', face: '🌯', bg: '#fc6', t: '10/19/2006 1:02 PM', msg: 'omg ur pic is so cute!!! PC4PC?? can u do me tonite. 2 min each side. pls don\'t leave my middle frozen this time lol' },
    { who: 'Fridge (dad)', face: '🧊', bg: '#cff', t: '10/18/2006 7:30 AM', msg: 'proud of u son. stay cool. (that was a joke. i know u cannot.) - dad' },
    { who: 'Fork', face: '🍴', bg: '#ccc', t: '10/17/2006 3:33 AM', msg: '<i>[comment removed by Mike\'s manager. see FAQ question 1. the answer is no.]</i>' },
    { who: 'Mike Rowave', face: MW, bg: '#fcf', t: '10/16/2006 12:00 PM', msg: 'commenting on my own profile so it looks active. mmmmmmmm. BEEP. BEEP. BEEP.' },
  ];
  const wall = $('#wall');
  const cmHtml = (c, isNew) =>
    `<div class="cm${isNew ? ' new' : ''}"><div class="cm-who">${paint(c.face, c.bg, c.who.length * 7)}<a href="#" data-noop="profile">${esc(c.who)}</a></div>
     <div class="cm-body"><span class="cm-time">${esc(c.t)}</span>${c.msg}</div></div>`;
  wall.innerHTML = comments.map((c) => cmHtml(c)).join('');
  const now2006 = () => {
    const d = new Date();
    const h = d.getHours() % 12 || 12;
    return `${d.getMonth() + 1}/${d.getDate()}/2006 ${h}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`;
  };
  const braydenReplies = [
    'gm ser. ur comment has been minted. 2% fee.',
    'Brayden here. Mike is in a meeting (reheating soup). i\'ll pass it on. probably.',
    'love the energy. have u considered GOLD? same comment, but gold.',
    'Mike says "mmmmmmmm". i\'m translating that as a yes. NFA.',
  ];
  let posted = 0;
  $('#cm-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ta = $('#cm-text');
    const v = ta.value.trim();
    if (!v) return toast('u cant post nothing. ur not Mike on 0:00.');
    posted++;
    wall.insertAdjacentHTML('afterbegin', cmHtml({ who: 'u (new friend??)', face: '🙂', bg: '#ff9', t: now2006(), msg: esc(v) }, true));
    $('#cm-n').textContent = 8 + posted;
    ta.value = '';
    toast('comment posted!! 1 new friend request (from Air Fryer)');
    await sleep(1600);
    wall.insertAdjacentHTML('afterbegin', cmHtml({ who: 'Brayden 🚀', face: '🕶️', bg: '#000', t: now2006(), msg: esc(pick(braydenReplies)) }, true));
  });

  // ---------- microwave keypad + compatibility demo ----------
  let digits = '';
  const disp = $('#oven-display');
  const timeIn = $('#oven-time');
  const showTime = () => {
    const d = digits.padStart(4, '0').slice(-4);
    disp.textContent = `${Number(d.slice(0, 2))}:${d.slice(2)}`;
    timeIn.value = Number(d.slice(0, 2)) * 60 + Number(d.slice(2));
  };
  $('#keypad').addEventListener('click', (e) => {
    const k = e.target.closest('[data-k]')?.dataset.k;
    if (!k) return;
    audio(); // keypad presses are user gestures, so beeps are allowed from here on
    beep(1200, 0.05);
    if (k === 'pop') {
      $('#date-item').value = 'popcorn';
      digits = '230';
      toast('POPCORN button pressed. the only button Mike trusts.');
    } else {
      digits = (digits + k).slice(-4);
    }
    showTime();
  });
  $('#kclear').addEventListener('click', () => {
    digits = '';
    showTime();
    beep(600, 0.1);
  });

  const results = {
    leftovers: ['compatible-ish.', 'u will open my door at 0:01 and never hear me finish. classic. the pasta exploded on my ceiling. i will wear it forever.'],
    burrito: ['hot outside, frozen middle.', 'like my last 3 relationships. flip it and try again? (no) (see FAQ)'],
    popcorn: ['it\'s giving love 🍿', 'half of u didn\'t pop. the other half is burnt. the whole office smells like us now. this is what commitment feels like.'],
    fish: ['HR has been notified.', 'u brought FISH. to the OFFICE microwave. accounting is crying. Mike is honestly flattered tho.'],
    heart: ['rubbery.', 'u put ur heart in on HIGH with no cover. it popped. it\'s on the walls now. that\'s on u.'],
    grape: ['😳😳 PLASMA ON THE FIRST DATE', 'u cut a grape in half to make plasma?? we are moving fast. Mike likes it. Brayden is filming it for the NFT.'],
    fork: ['⚡⚡ SPARKS ⚡⚡', '(not the good kind.) the fire dept has been called. read the FAQ. the answer was no. the answer is always no.'],
    foil: ['⚡⚡ SPARKS ⚡⚡', 'u wrapped it in FOIL. Mike is screaming in microwave (it sounds like "bzzzrrrt"). no match. no refunds.'],
    nothing: ['red flag 🚩', 'u ran Mike EMPTY. that damages his magnetron. Brayden says "that\'s how they get u." he would know.'],
  };
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);

  window.slop.demo({
    form: '#date-form',
    output: '#date-out',
    credits: 3,
    creditsEl: '#credits',
    loading: [
      'mmmmmmmmmmmmmmmmmmm…',
      'spinning ur plate (it is hitting the wall)…',
      'scanning for forks…',
      'Brayden is taking his 2%…',
      'the outside is done…',
      'the middle is still frozen…',
      'opening door at 0:01 (rude)…',
    ],
    captions: ['BEEP. BEEP. BEEP. (nobody came)', 'result by Mike. not reviewed by anyone.', 'compatibility confidence: 12%', 'GOLD members get the same result. but gold.'],
    render: (fd) => {
      const who = String(fd.get('who') || 'anon').slice(0, 24);
      const item = String(fd.get('item'));
      const secs = Number(fd.get('time')) || 0;
      const [head, line] = results[item] || results.nothing;
      const sparks = item === 'fork' || item === 'foil';
      const pct = sparks ? 0 : item === 'fish' ? 100 : 20 + (hash(who + item) % 71);
      const timeNote = secs === 0
        ? 'u didn\'t set a time. u just pressed START. Mike ran for 30 sec out of habit.'
        : secs > 600
          ? `u set ${Math.floor(secs / 60)} minutes. nobody needs that long. (Mike does)`
          : secs < 15
            ? `${secs} seconds?? that's not a date that's a glance.`
            : `cooked for ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}. Mike lost count around 0:40.`;
      if (sparks) setTimeout(() => window.slop.errors(['⚡ ARCING DETECTED ⚡', 'Error: there is a fork in Mike.', 'Mike.exe has stopped spinning.', 'Task failed successfully. (fire)'], 2), 400);
      return `<p class="res-line">${esc(who)} + Mike Rowave =</p>
        <p class="res-big">${pct}% MATCH</p>
        <p class="res-line"><b>${esc(head)}</b> ${esc(line)}</p>
        <p class="res-line">${esc(timeNote)}</p>`;
    },
  });
  // glow + beeps around the demo
  $('#date-form').addEventListener('submit', () => {
    document.body.classList.add('cooking');
    setTimeout(() => {
      document.body.classList.remove('cooking');
      beepBeep();
    }, 6200);
  });

  // ---------- music player (can't be paused, beeps only after a real click) ----------
  let ctx, hum, humGain, playing = false, t = 0, len = 120;
  const audio = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
  function beep(freq = 1000, dur = 0.15, vol = 0.06) {
    if (!ctx) return; // never make sound before the user has pressed play/the keypad
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }
  function beepBeep() {
    if (!ctx) return;
    [0, 400, 800].forEach((ms) => setTimeout(() => beep(1000, 0.25), ms));
  }
  function startHum() {
    audio();
    if (hum) return;
    hum = ctx.createOscillator();
    const hum2 = ctx.createOscillator();
    humGain = ctx.createGain();
    hum.type = 'sawtooth';
    hum.frequency.value = 60;
    hum2.type = 'sine';
    hum2.frequency.value = 120;
    humGain.gain.value = 0.025;
    hum.connect(humGain);
    hum2.connect(humGain);
    humGain.connect(ctx.destination);
    hum.start();
    hum2.start();
    hum._b = hum2;
  }
  function stopHum() {
    if (!hum) return;
    hum.stop();
    hum._b.stop();
    hum = null;
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const pnote = $('#pnote');
  const tick = () => {
    if (!playing) return;
    t++;
    if (t >= len) {
      t = 0;
      beepBeep();
      toast('🎵 song over. BEEP BEEP BEEP. (nobody came to get it)');
    }
    $('#ptime').textContent = fmt(t);
    $('#plen').textContent = fmt(len);
    $('#pbar').style.width = `${(t / len) * 100}%`;
  };
  every(1000, tick);
  afterClick(() => {
    playing = true; // "autoplay" (visually) after the first click, still silent
  });
  $('#pplay').addEventListener('click', () => {
    playing = true;
    startHum();
    beep(1200, 0.06);
    pnote.textContent = 'now humming. 🔊 (this is the whole song)';
  });
  $('#ppause').addEventListener('click', () => {
    len += 30;
    toast('u cannot pause Mike. Mike pauses u. (+0:30 added)');
    pnote.textContent = `pausing not supported. +0:30 added. (${pick(['see FAQ', 'GOLD can\'t pause either', 'nice try'])})`;
    beep(1200, 0.06);
  });
  $('#pstop').addEventListener('click', () => {
    // the real way out (with one last beep, out of spite)
    playing = false;
    stopHum();
    beep(900, 0.4);
    t = 0;
    len = 120;
    $('#ptime').textContent = '0:00';
    $('#plen').textContent = '2:00';
    $('#pbar').style.width = '0';
    pnote.textContent = 'stopped. *one last beep, out of spite*';
  });

  // ---------- FAQ: ask ur own (the answer is no) ----------
  $('#faq-ask').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#faq-q').value.trim();
    const a = $('#faq-ans');
    if (!q) return (a.textContent = 'no.');
    a.textContent = 'Mike is thinking… mmmmmmmm…';
    await sleep(rnd(900, 1800));
    a.textContent = /\bno\b|\bnot\b/i.test(q) ? 'no. (double negatives also no)' : 'no.';
    $('#faq-q').value = '';
  });

  // ---------- contact box ----------
  const actions = {
    add: async () => {
      const v = await modal({
        title: 'Add Mike Rowave to Friends?',
        html: `<p>${MW} Mike must approve ur friend request.</p><p>Mike is a microwave. Est. approval time: <b>2:00 on HIGH</b>.</p><p class="tiny">did u read the FAQ? (u did not)</p>`,
        buttons: ['Send Request', 'Send Request (GOLD)'],
      });
      if (v < 0) return toast('request cancelled. Mike heard. Mike hums sadly.');
      await modal({
        title: 'Message from Mike\'s Manager',
        html: `<p>🚀 hey it's Brayden. Mike's friend requests have a <b>2% fee</b>.</p><p>i accept MikeCoin, HotPocketDAO tokens (worthless), or a referral to <b>icantcodefyi</b> who coded this profile and still hasn't been paid.</p>${v === 1 ? '<p>u picked GOLD. it\'s the same request. but gold. ✨</p>' : ''}`,
        buttons: ['pay 2% (imaginary)', 'refer icantcodefyi'],
      });
      sparkleBurst();
      toast('🎉 friend request sent!! Mike will see it when someone opens his door.');
    },
    msg: () => {
      $('#test').scrollIntoView({ behavior: 'smooth' });
      toast('Mike doesn\'t read messages. take the compatibility test instead.');
    },
    fwd: () => toast('forwarded to Toaster. that was a mistake. 💔'),
    fav: () => toast('⭐ added to Favorites. Air Fryer has been notified.'),
    im: () => {
      const c = $('.slop-chat');
      if (c) c.classList.add('open');
      toast('AIM window opened ↘');
    },
    block: () =>
      modal({
        title: 'Block User',
        html: `<p>u cannot block Mike.</p><p>Mike is in ur break room. Mike is in every break room. ${MW}${MW}${MW}</p><p class="tiny">FAQ: "can i block Mike?" — no.</p>`,
        buttons: ['ok', 'ok (i will wait for the beep)'],
      }),
    group: () => toast('added to group "Appliances Who Have Seen Too Much" (412 members)'),
    rank: () => toast('u ranked Mike ⭐⭐⭐⭐⭐. Brayden ranked him for u. 5 stars. NFA.'),
  };
  // a short burst of sparkles (slop.rain runs forever, this stops after ~2.5s)
  function sparkleBurst() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        const d = document.body.appendChild(el(`<span class="slop-drop" aria-hidden="true">${pick(['✨', '💖', '⭐', '💕'])}</span>`));
        d.style.left = `${Math.random() * 100}vw`;
        d.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        setTimeout(() => d.remove(), 5000);
      }, i * 160);
    }
  }
  document.querySelector('.contact-grid').addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]')?.dataset.act;
    if (a) actions[a]();
  });

  // ---------- GOLD (same thing, but gold) ----------
  window.slop.creep('[data-creep]', { step: 0.37, ms: 1500, prefix: '$' });
  const goldBtn = $('#gold-btn');
  goldBtn.addEventListener('click', async () => {
    if (document.body.classList.contains('gold')) {
      document.body.classList.remove('gold');
      $('.gold-badge').hidden = true;
      goldBtn.textContent = '⬆ UPGRADE TO GOLD!!!';
      return toast('downgraded to free. everything is the same. but not gold. 😔');
    }
    const v = await modal({
      title: '✨ Confirm SlopSpace GOLD™ ✨',
      html: '<p>u r about to unlock:</p><ul><li>Mike\'s profile</li><li>Mike\'s FAQ (still no)</li><li>the same song (still can\'t pause)</li><li><b>GOLD</b></li></ul><p class="tiny">billed monthly in MikeCoin. Brayden holds the keys. Brayden lost the keys.</p>',
      buttons: ['GO GOLD', 'stay poor'],
    });
    if (v !== 0) return toast('Brayden: "ok but u are ngmi"');
    document.body.classList.add('gold');
    $('.gold-badge').hidden = false;
    goldBtn.textContent = '⬇ return to free (same thing)';
    window.slop.quake();
    toast('✨ u r now GOLD. nothing else changed. Brayden thanks u for ur service.', 4000);
  });

  // ---------- blog survey ----------
  $('#survey-btn').addEventListener('click', () => {
    const s = $('#survey');
    s.hidden = !s.hidden;
    $('#survey-btn').textContent = s.hidden ? '(view more)' : '(view less)';
  });

  // ---------- inert links ----------
  const noop = {
    help: 'Help is a GOLD feature. GOLD does not include help.',
    signup: 'signups r closed. Brayden is "doing a raise".',
    login: 'ur already logged in. as Mike. somehow.',
    videos: 'Videos (1): "me spinning a mug for 2 min" — 0 views',
    rss: 'subscribed. u will now get every bulletin Popcorn Bag posts about Mike.',
    blog: 'this entry is GOLD only. GOLD is also locked.',
    comments: 'the other 1,096 comments r all Tom saying thanks for the add.',
    profile: 'that profile is private. it\'s a microwave in there too.',
  };
  document.addEventListener('click', (e) => {
    const n = e.target.closest('[data-noop]');
    if (!n) return;
    e.preventDefault();
    toast(noop[n.dataset.noop] || pick(['page not found. it\'s probably in Mike.', 'this page is still defrosting.', 'error: BEEP.']));
  });
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) $('#' + g.dataset.goto).scrollIntoView({ behavior: 'smooth' });
  });
  $('#search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.querySelector('input').value.trim();
    toast(q ? `0 results for "${q}". here is Mike instead. ${'⏲️'}` : 'u searched 4 nothing. u found Mike.');
    peek(true);
  });

  // ---------- the mascot keeps appearing where it shouldn't ----------
  const peeker = $('#peeker');
  const peekLines = [
    'how did he get here',
    'Mike is not supposed to be outside the break room',
    'ur cursor smells like popcorn. Mike followed it.',
    'Mike sighting #' + rnd(40, 90) + '. pls stop feeding him',
    'that was not Mike. (it was Mike)',
  ];
  let peekHide;
  function peek(force) {
    if (!force && document.hidden) return;
    peeker.classList.toggle('right', Math.random() > 0.5);
    peeker.style.bottom = `${rnd(15, 65)}%`;
    requestAnimationFrame(() => peeker.classList.add('show'));
    clearTimeout(peekHide);
    peekHide = setTimeout(() => peeker.classList.remove('show'), 2600);
  }
  peeker.addEventListener('click', () => {
    peeker.classList.remove('show');
    toast(pick(peekLines));
    beep(1000, 0.08);
  });
  afterClick(() => {
    setTimeout(() => peek(), 6000);
    every(19000, () => peek());
  });

  // ---------- engine gags, re-skinned for 2006 ----------
  window.slop.counter('#views', { start: rnd(31000, 48000), digits: 7, tick: 1800 });
  window.slop.proof({
    template: () =>
      pick([
        `💌 ${pick(['Toaster', 'Air Fryer', 'a Spoon in Ohio', 'Tom', 'Popcorn Bag', 'a Hot Pocket (sleeve)', 'Steve'])} just viewed Mike's profile ${rnd(1, 59)} seconds ago`,
        `➕ ${pick(['xXburritoGrl88Xx', 'Slow Cooker (older)', 'a Mug in a Walmart parking lot', 'Kettle (emo)'])} just added Mike as a friend`,
        `✨ someone in ${pick(['Ohio', "Steve's basement", 'the 3rd floor break room', 'Florida (again)'])} just upgraded to GOLD. it looks the same.`,
        `💔 someone just opened Mike's door at 0:01`,
      ]),
    ms: 11000,
  });
  window.slop.chat({
    name: 'xXMikeRowaveXx (Away: reheating)',
    avatar: '⏲️',
    greeting: 'mmmmmmmmmmmmmmmmmmmmmm',
    placeholder: 'type here (Mike cant read)',
    replies: [
      'mmmmmmmmmmmmmm',
      'BEEP',
      'BEEP. BEEP. BEEP.',
      '*spins*',
      'no. (Mike only knows FAQ answers)',
      'no.',
      'Brayden (auto-reply): pls route this thru management. 2% fee.',
      'ur food is done. the middle is cold.',
      '*light turns on* that means i care',
      'is that a fork in ur pocket or',
      'have u considered GOLD (Brayden typed this)',
    ],
  });
  window.slop.exit({
    title: 'ur leaving?? 😭😭😭',
    html: `<p>${MW} Mike will keep ur leftovers warm while ur gone.</p><p>(he won't. they'll be cold in the middle.)</p><p class="tiny">Brayden: "leaving now is how u miss the bottom."</p>`,
    buttons: ['ok bye Mike', 'wait for the beep'],
  });
  window.slop.konami(() => {
    document.body.classList.toggle('defrost');
    toast(document.body.classList.contains('defrost') ? '❄️ DEFROST MODE. everything is now unevenly thawed.' : 'defrost done. edges are cooked, middle is ice.');
  });

  // first-visit PM, then the slow upsell (one modal at a time, only after a click)
  setTimeout(() => toast('📬 New Friend Request! (from Air Fryer) (again)'), 4000);
  afterClick(() =>
    setTimeout(async () => {
      if (document.querySelector('.slop-overlay')) return;
      await modal({
        title: 'SlopSpace Instant Bulletin',
        html: `<p>🚀 <b>Brayden</b> posted a bulletin:</p><p>"Mike's profile is now available in <b>GOLD</b>. it's the same profile. but gold. early holders get nothing. LFG"</p>`,
        buttons: ['cool', 'cool (gold)'],
      });
    }, 25000),
  );
})();
