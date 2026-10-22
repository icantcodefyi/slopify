// Unclr (beta) — page script. Uses the slop.js gag engine plus Web 2.0-specific gags.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal, every, afterClick } = window.slop;
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const LINDA = ['Linda', 'Linda D.', 'Mrs. Dennis', 'L.', 'Linda (wife)', 'Linda (GOLD)'];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  /* ---------- GOLD MODE (running gag: premium = free, but gold) ---------- */
  let gold = false;
  async function goGold() {
    if (gold) {
      const v = await modal({
        title: '✨ Unclr GOLD ✨',
        html: '<p>You are already GOLD.</p><p>Would you like to downgrade to Free? It is the same, but not gold.</p>',
        buttons: ['Stay GOLD', 'Downgrade (sad)'],
      });
      if (v === 1) { gold = false; document.body.classList.remove('gold-mode'); toast('Downgraded. Everything is the same. Except gold.'); }
      return;
    }
    const v = await modal({
      title: '✨ Upgrade to Unclr GOLD ✨',
      html: '<p><b>GOLD includes:</b></p><ul><li>Everything in Free</li><li>Nothing else</li><li>But gold</li></ul><p class="small">Free trial 7 days, then $9.99/mo, billed to Linda.</p>',
      buttons: ['GO GOLD!!!', 'no (stay ungold)'],
    });
    if (v !== 0) return toast('ok. u are still free. it is the same.');
    gold = true;
    document.body.classList.add('gold-mode');
    toast('✨ U are now GOLD. Nothing else changed. Enjoy!!');
  }
  $$('.go-gold').forEach((b) => b.addEventListener('click', goGold));

  /* ---------- engine gags, re-themed ---------- */
  slop.cookie({
    text: '🍪 Unclr uses cookies. Linda baked them. By looking at this page you are agree to the cookies of oatmeal raisin.',
    accept: ['Accept', 'Accept GOLD ✨'],
    reject: 'no thx i hate raisin',
    onReject: 'Rejecting cookies is a GOLD feature ✨',
  });

  slop.creep('#waitlist', { step: 90, ms: 700, prefix: '', decimals: 0 });
  slop.counter('#hits', { start: 4012, digits: 8, tick: 2200 });

  slop.proof({
    template: () =>
      `🔔 ${pick(LINDA)} in ${pick(['the kitchen', 'the den', 'Ohio', "Gary's garage (visiting)", 'the car, outside, honking'])} just ${pick([
        'shared a casserole',
        'rated a sock ★★★★★',
        'upgraded to GOLD (it is the same)',
        'dugg this page',
        'signed the guestbook again',
        'asked Dennis to come to dinner',
        'wrote a testimonial',
      ])} ${rnd(2, 59)} seconds ago`,
    ms: 11000,
  });

  slop.clippy(
    [
      'Hi! I am Socky 🧦. It looks like you are reading about Me (Dennis). Would you like to read about Me (Dennis)?',
      'I lost my pair in 1996. Have u seen him? He is argyle. He is LEFT. No wait I am left.',
      'Tip: GOLD members see this tip in gold.',
      'Gary says the server is hot. Please scroll slower.',
      'Tip: You can translate this page into 5 languages at the same time! (button at top)',
      'Linda says dinner is ready. I am a sock, I cannot eat.',
    ],
    { face: '🧦', first: 16000, ms: 30000 },
  );

  slop.exit({
    title: '⚠ YOU LEAVE?? ⚠',
    html: '<p>ur leaving?? 😭😭 Linda made a casserole.</p><p>Here is <b>0.5% off GOLD</b>. Final offer. (not final)</p>',
    buttons: ['OK I STAY', 'i must go (Linda will know)'],
  });

  slop.konami(() => {
    gold = true;
    document.body.classList.add('gold-mode');
    toast('🎮 CHEAT CODE: GOLD unlocked for free. (it was always the same)');
  });

  /* ---------- header buttons ---------- */
  async function signup() {
    const v = await modal({
      title: 'Join Unclr (beta)',
      html: `<p>Unclr is <b>invite-only</b> because it is beta. Tyler says this makes it exclusive.</p>
        <p>Ur position in the waitlist: <b>#${$('#waitlist').textContent}</b> (it goes UP, this is normal for web 2.0)</p>
        <p class="small">Or skip the line with GOLD. (GOLD also has a line. It is gold.)</p>`,
      buttons: ['Request invite', 'Skip line (GOLD)'],
    });
    if (v === 0) toast('📧 Invite requested! Gary will mail it. (stamp not included)');
    if (v === 1) goGold();
  }
  $('#signup-btn').addEventListener('click', signup);
  $('#invite-btn').addEventListener('click', signup);
  $('#free-btn').addEventListener('click', signup);

  $('#gary-btn').addEventListener('click', async () => {
    const v = await modal({
      title: '📞 Calling Gary (garage extension)…',
      html: `<p>☎ ring ring…</p><p>☎ ring ring…</p><p><i>"Hello? This is Gary's wife. Gary is in the garage. With the data center. He says the server is making 'the noise again'."</i></p>`,
      buttons: ['Leave message', 'Hang up'],
    });
    if (v === 0) toast("📼 Message left on Gary's answering machine. It is full. Of Dennis.");
  });

  /* ---------- 5-LANGUAGE TRANSLATOR (running gag + custom gag) ---------- */
  const DICT = [
    [/\bthe\b/gi, 'the the'],
    [/\bhello\b/gi, 'greetings of the day'], [/\bhi\b/gi, 'high'], [/\bhey\b/gi, 'hay'],
    [/\bnice\b/gi, 'of nice'], [/\bwebsite\b/gi, 'net-house page'], [/\bsite\b/gi, 'place of web'],
    [/\bcool\b/gi, 'refrigerated'], [/\bawesome\b/gi, 'that causes the fear'], [/\blove\b/gi, 'approve strongly'],
    [/\bsocks\b/gi, 'foot-stockings'], [/\bsock\b/gi, 'foot-stocking'], [/\bgreat\b/gi, 'large'],
    [/\buncle\b/gi, 'brother of the parent'], [/\bpage\b/gi, 'leaf'], [/\bgood\b/gi, 'well-made'],
    [/\bthanks\b/gi, 'gratitudes'], [/\bthank you\b/gi, 'gratitudes to you'], [/\blol\b/gi, 'laugh of the loud'],
    [/\bfish\b/gi, 'water chicken'], [/\bhome\b/gi, 'house place'], [/\bfriends?\b/gi, 'known persons'],
    [/\bgold\b/gi, 'yellow money'], [/\bfree\b/gi, 'free of beer'], [/\bpls\b|\bplease\b/gi, 'if it is pleasing'],
    [/\bbig\b/gi, 'enormous of size'], [/\bgarage\b/gi, 'house of car'],
  ];
  const TAILS = [', is it not?', ' (of course)', ', as the cow.', ', thank you for your cooperation.', '. Good appetite.', ' in the summer.'];
  function mangle(text) {
    let out = text;
    let hit = false;
    for (const [re, rep] of DICT) out = out.replace(re, () => ((hit = true), rep));
    if (!hit) {
      // nothing to translate: swap word pairs, the classic round-trip result
      const w = out.split(/\s+/);
      for (let i = 0; i + 1 < w.length; i += 2) [w[i], w[i + 1]] = [w[i + 1], w[i]];
      out = w.join(' ');
    }
    out = out.replace(/[.!?]*\s*$/, '') + pick(TAILS);
    return out.charAt(0).toUpperCase() + out.slice(1);
  }

  const CHAIN = ['English', 'Deutsch', '日本語', 'Português', 'Suomi', 'English'];
  const originals = new Map($$('[data-tr]').map((n) => [n, n.innerHTML]));
  let passes = 0;
  let translating = false;

  function showNotice(text) {
    $('#notice-text').textContent = text;
    $('#notice').hidden = false;
  }
  function restore() {
    originals.forEach((html, n) => (n.innerHTML = html));
    document.body.classList.remove('tr-mode');
    document.documentElement.lang = 'en';
    $('#lang-btn').textContent = '🌐 Language: English ▾';
    $('#notice').hidden = true;
    passes = 0;
    toast('Restored to English (the original English, of before)');
  }
  $('#notice-restore').addEventListener('click', restore);

  $('#lang-btn').addEventListener('click', async () => {
    if (translating) return;
    if (passes >= 3) {
      return modal({
        title: 'Translation quota exceeded',
        html: '<p>You have used all 3 free translations.</p><p><b>Upgrade to GOLD</b> for the same 3 translations, but gold.</p>',
        buttons: ['OK', 'Restore English'],
      }).then((v) => v === 1 && restore());
    }
    const v = await modal({
      title: '🌐 Internationalize this page',
      html: '<p>To be global like the Google, Unclr translates the whole page through <b>all 5 languages at once</b>. Choose ur language:</p>',
      buttons: ['Deutsch', '日本語', 'Português', 'Suomi', 'All 5 (recommended)'],
    });
    if (v < 0) return;
    translating = true;
    for (let i = 1; i < CHAIN.length; i++) {
      toast(`🌐 Translating ${CHAIN[i - 1]} → ${CHAIN[i]}… (${i}/5)`, 1200);
      await sleep(700);
    }
    passes++;
    $$('[data-tr]').forEach((n) => {
      n.textContent = passes === 1 ? n.dataset.tr : mangle(n.textContent);
    });
    document.body.classList.add('tr-mode');
    document.documentElement.lang = 'en-x-5langs';
    $('#lang-btn').textContent = `🌐 Language: English (${passes * 5} languages) ▾`;
    showNotice(`This leaf has been translated from English to English via ${passes * 5} languages for the international known persons.`);
    toast(passes === 1 ? '✅ Translation complete! Accuracy: 12%' : '✅ Translated AGAIN. It is more international now.');
    translating = false;
  });

  /* ---------- hobby 1: AJAX sock rating with Yellow Fade Technique ---------- */
  const stars = $$('#rating [data-star]');
  const light = (n) => stars.forEach((s) => s.classList.toggle('lit', +s.dataset.star <= n));
  light(5);
  stars.forEach((s) => {
    s.addEventListener('mouseenter', () => light(+s.dataset.star));
    s.addEventListener('mouseleave', () => light(5));
    s.addEventListener('click', async () => {
      const n = +s.dataset.star;
      const st = $('#rstatus');
      st.innerHTML = '<span class="spinner" style="display:inline-block;width:12px;height:12px;vertical-align:middle"></span> Saving via AJAX to Gary\'s garage…';
      await sleep(1400);
      const r = $('#rating');
      r.classList.remove('yft');
      void r.offsetWidth;
      r.classList.add('yft');
      st.textContent = n === 5
        ? 'Saved! avg ★★★★★ (2 votes: u + Linda)'
        : `Saved! Ur ${n}★ was outvoted. avg ★★★★★ (Linda voted 4,000 times)`;
      light(5);
    });
  });

  /* ---------- hobby 2: metal detector ---------- */
  const FINDS = [
    ['🍾', 'bottle cap #15', 'beep'], ['🔑', "Gary's OTHER key", 'BEEP'], ['🥫', 'a can of beans (full, 1991)', 'beeeep'],
    ['🧦', 'a sock?? (not metal. still counts)', 'b e e p'], ['🪙', '$0.02 (also Canadian)', 'BEEP BEEP'],
    ['💍', 'a ring!!! (it is a pull tab)', 'BEEEEEP'], ['📟', 'an even smaller metal detector', 'beep (small)'],
  ];
  let detecting = false;
  $('#detect-btn').addEventListener('click', async () => {
    if (detecting) return;
    detecting = true;
    const beep = $('#beep');
    for (const b of ['.', '. .', '. . .']) { beep.textContent = `scanning${b}`; await sleep(380); }
    const [ico, what, sound] = pick(FINDS);
    beep.textContent = `🔊 ${sound}!`;
    const li = el(`<li class="gb-entry-new">${ico} ${esc(what)}</li>`);
    $('#finds').appendChild(li);
    const items = $('#finds').children;
    if (items.length > 8) items[4].remove();
    toast(`Found: ${what}. Lifetime value now $0.3${rnd(5, 7)}`);
    slop.quake();
    detecting = false;
  });

  /* ---------- hobby 3: the fish story (grows every time it is told) ---------- */
  const SIZES = [
    [1, 'It was 14 inches.'], [1.6, 'It was 22 inches. (Gary: "14")'], [2.3, 'It was 41 inches.'],
    [3, 'It was 6 feet. It looked at me.'], [3.7, 'It was the size of a Buick.'], [4.4, "It was the size of Gary's garage (the data center)."],
    [5, 'It pulled the boat to Canada. Ask Gary. (do not ask Gary)'],
  ];
  let fishIdx = 0;
  $('#fish-btn').addEventListener('click', () => {
    fishIdx = Math.min(fishIdx + 1, SIZES.length - 1);
    const [scale, line] = SIZES[fishIdx];
    $('#fish').style.transform = `scale(${scale}) rotate(${fishIdx % 2 ? -8 : 8}deg)`;
    $('#fishsize').textContent = line;
    if (fishIdx === SIZES.length - 1) {
      $('#fish-btn').textContent = 'Reset story (it gets bigger again)';
      fishIdx = -1;
      setTimeout(() => toast('🐟 Gary has left the chat.'), 600);
    }
  });

  /* ---------- the widget that never loads (custom AJAX gag) ---------- */
  const NEVER = [
    'Loading…', 'Loading… (Ajax)', 'Loading… 94%', 'Loading… 93%', 'Loading… 91%',
    'Loading… (Gary is restarting the modem)', 'Loading… (Gary is mowing)', 'Loading… 97%', 'Loading… 12%',
    'Loading… (Tyler says Twitter is "for the phone")', 'Fail Whale 🐳 (loading)', 'Loading…',
  ];
  let ni = 0;
  every(2600, () => ($('#never-text').textContent = NEVER[(ni = (ni + 1) % NEVER.length)]));

  /* ---------- data center status (Gary's schedule) ---------- */
  const STATUS = [
    ['up', '● ONLINE (Gary is home)', false],
    ['down', '● OFFLINE (Gary is at Costco)', true],
    ['up', '● ONLINE (Gary is back, with 48 eggs)', false],
    ['down', '● DEGRADED (Gary\'s wife is parking the car)', true],
    ['up', '● ONLINE (cat sat on the power button, then off it)', false],
    ['down', '● OFFLINE (Gary needed the extension cord for the hedge trimmer)', true],
  ];
  let si = 0;
  every(7000, () => {
    si = (si + 1) % STATUS.length;
    const [cls, txt, closed] = STATUS[si];
    const d = $('#dcstatus');
    d.className = cls;
    d.textContent = txt;
    $('#led').classList.toggle('off', closed);
    $('#door').classList.toggle('closed', closed);
  });

  /* ---------- tag cloud ---------- */
  const TAGS = [
    'socks', 'synergy', 'mashup', 'Linda', 'Gary', 'AJAX', '1987 fish', 'GOLD', 'beta', 'web 2.0', 'social', 'argyle',
    'retirement', 'metal detecting', 'bottle caps', 'folksonomy', 'Tyler (nephew)', 'lawnmower', 'RSS', 'foot-stocking',
    'web 3.0', 'casserole', 'long tail', 'Ohio', 'the den', 'HTML (yesterday)', 'insurance', 'Buick', 'left sock', 'Costco',
  ];
  const COLORS = ['#0063dc', '#ff0084', '#7ab800', '#ff6600', '#0063dc', '#557'];
  $('#cloud').innerHTML = TAGS.map((t) => {
    const big = t === 'socks' || t === 'Linda' ? 26 : rnd(10, 21);
    return `<a href="#" data-tag="${esc(t)}" style="font-size:${big}px;color:${pick(COLORS)}">${esc(t)}</a>`;
  }).join(' ');
  $('#cloud').addEventListener('click', (e) => {
    const a = e.target.closest('[data-tag]');
    if (!a) return;
    e.preventDefault();
    toast(`🔎 Tag "${a.dataset.tag}": 0 results. (1 result from Linda)`);
  });

  /* ---------- Digg + bookmarks ---------- */
  let diggs = 412;
  let dugg = false;
  $('#digg').addEventListener('click', () => {
    diggs += dugg ? 0 : 1;
    $('#digg-n').textContent = diggs;
    toast(dugg ? 'u already dugg it. Linda has dugg it 411 times.' : 'Dugg!! (411 of the other diggs are Linda)');
    dugg = true;
  });
  $$('[data-bm]').forEach((b) =>
    b.addEventListener('click', () => {
      const where = b.dataset.bm;
      toast(where === 'RSS'
        ? '📡 Subscribed to RSS! Gary will print each update and put it in ur mailbox.'
        : `🔖 Saved to ${where}! (in Gary's garage, on a floppy)`);
    }),
  );

  /* ---------- Guestbook 2.0: the demo that works badly ---------- */
  // Ugly 2008 squiggly-text captcha, intercepts the submit first (capture phase).
  const form = $('#gb-form');
  let human = false;
  form.addEventListener('submit', async (e) => {
    if (human) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const word = pick(['s0ck lInda', 'gArY 2.0', 'b3ta unc1e', 'fi5h 1987', 'ajAx g0ld']);
    const html = `<p>Type the 2 words (to prove u are not a robot of spam):</p>
      <div class="cap-img" aria-label="captcha image">${word.split('').map((c) => `<span style="transform:rotate(${rnd(-35, 35)}deg) translateY(${rnd(-6, 6)}px);font-size:${rnd(18, 30)}px">${esc(c)}</span>`).join('')}</div>
      <input class="cap-in" aria-label="captcha answer" placeholder="type here" style="width:100%;padding:6px;font:inherit">
      <p class="small">🔊 audio captcha: Gary reading it aloud (unavailable)</p>`;
    const pending = modal({ title: 'Are u human? (reCAPTCHA-ish)', html, buttons: ['Verify', 'I cannot read this'] });
    await sleep(50);
    let typed = '';
    const inp = document.querySelector('.cap-in');
    if (inp) { inp.focus(); inp.addEventListener('input', () => (typed = inp.value)); }
    const v = await pending;
    if (v < 0) return;
    if (v === 1) return toast('Nobody can. That is how we know it works.');
    if (!typed.trim()) return toast('❌ u did not type anything. Robot detected (beep boop?)');
    if (Math.random() < 0.5) return toast(`❌ Wrong. It said "${word.toUpperCase()}". Case sensitive. Try again`);
    toast('✅ ok fine ur human');
    human = true;
    form.requestSubmit();
    human = false;
  }, true);

  const LINDA_REPLIES = [
    'Thank u for visiting. Dennis is in the den. —Linda',
    'Did u eat? —L.',
    'Pls do not encourage him. —Linda (wife)',
    'Your message is translated very well. —Linda (GOLD)',
    'Gary, is this you? —Mrs. Dennis',
  ];
  slop.demo({
    form: '#gb-form',
    output: '#gb-out',
    credits: 3,
    creditsEl: '#credits',
    loading: [
      'Posting via AJAX…',
      'Translating to Deutsch…',
      'Translating to 日本語…',
      'Translating to Português…',
      'Translating to Suomi…',
      'Translating back to English (approximately)…',
      "Uploading to Gary's garage…",
    ],
    captions: ['Translation accuracy: 12%', 'Your post is now international ✨', 'Approved by Linda (moderator)', 'GOLD members get the same translation, but gold'],
    render: (fd) => {
      const name = String(fd.get('name') || 'Anonymous').slice(0, 40);
      const msg = String(fd.get('msg') || '').slice(0, 200);
      return `<p class="small">Ur entry, after 5 languages:</p>
        <p><b>${esc(name)}</b> wrote: “${esc(mangle(msg))}”</p>`;
    },
    onResult: (out) => {
      const fd = new FormData(form);
      const text = out.querySelector('p:nth-of-type(2)')?.textContent.replace(/^.*?wrote: /, '') || '';
      const li = el(`<li class="gb-entry-new"><b>${esc(String(fd.get('name')).slice(0, 40))}</b> <span class="when">just now</span><p>${esc(text)}</p><small class="tr-note">translated from English through 5 languages</small></li>`);
      $('#gb-list').prepend(li);
      setTimeout(() => {
        li.appendChild(el(`<div class="reply">↳ ${esc(pick(LINDA_REPLIES))}</div>`));
      }, 1800);
      form.reset();
      if ($('#credits').textContent.startsWith('0')) {
        setTimeout(() => {
          modal({
            title: 'Out of posts!',
            html: '<p>U used ur 3 free guestbook posts.</p><p><b>Upgrade to GOLD</b> for 3 guestbook posts. But gold.</p><p class="small">Or wait 47h. Or both.</p>',
            buttons: ['Go GOLD', 'I will wait 47h'],
          }).then((v) => v === 0 && goGold());
        }, 2500);
      }
    },
  });

  /* ---------- welcome (after the visitor has clicked once, so it is not instant) ---------- */
  afterClick(() =>
    setTimeout(() => toast('👴 Welcome to my homepage! This message is from Me (Dennis). —Dennis'), 1500),
  );
})();
