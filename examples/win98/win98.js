// Quackademy 98 — window manager + course gags. Needs slop.js loaded first.
(() => {
  const S = window.slop;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const mobile = () => matchMedia('(max-width: 640px)').matches;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = S.sleep;

  /* ================= window manager ================= */
  let z = 20;
  let mOrder = 1000;
  const tasks = $('#tasks');
  const wins = {};

  const minLines = [
    "Minimized. It's in the taskbar. Like my homework, it's still there.",
    'Window minimized to Ohio.',
    'Minimized. The window is now a Premium window (it is smaller, and gold in spirit).',
    "Window minimized. Linda will hold it for u.",
  ];

  $$('.win[id^="w-"]').forEach((w) => {
    const id = w.id.slice(2);
    const body = document.createElement('div');
    body.className = 'win-body';
    while (w.firstChild) body.appendChild(w.firstChild);
    const tb = S.el(`<div class="titlebar"><span class="tt">${w.dataset.ico} ${esc(w.dataset.title)}</span><span class="tbtns"><button class="tb-min" aria-label="Minimize">_</button><button class="tb-max" aria-label="Maximize">□</button><button class="tb-x" aria-label="Close">✕</button></span></div>`);
    w.append(tb, body);
    w.style.width = `${w.dataset.w}px`;
    w.style.left = `${w.dataset.x}px`;
    w.style.top = `${w.dataset.y}px`;
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-label', w.dataset.title);
    wins[id] = { w, maxed: 0, task: null };

    w.addEventListener('pointerdown', () => focusWin(id));
    tb.querySelector('.tb-x').addEventListener('click', () => closeWin(id));
    tb.querySelector('.tb-min').addEventListener('click', () => {
      w.hidden = true;
      wins[id].task?.classList.remove('on');
      S.toast(`🗕 ${S.pick(minLines)}`);
    });
    tb.querySelector('.tb-max').addEventListener('click', () => {
      const st = wins[id];
      if (st.maxed >= 3) return S.toast('Maximum maximization reached (+9px). Upgrade to Premium for +10px (gold).');
      st.maxed++;
      w.style.width = `${w.offsetWidth + 3}px`;
      if (!mobile()) w.style.height = `${w.offsetHeight + 3}px`;
      S.toast(`🗖 Maximized! Window is now ${st.maxed * 3}px bigger. Premium users get +4px.`);
    });
    tb.addEventListener('dblclick', (e) => !e.target.closest('button') && tb.querySelector('.tb-max').click());
    makeDrag(w, tb);
  });

  function makeDrag(w, handle) {
    handle.addEventListener('pointerdown', (e) => {
      if (mobile() || e.button !== 0 || e.target.closest('button')) return;
      const r = w.getBoundingClientRect();
      const dx = e.clientX - r.left;
      const dy = e.clientY - r.top;
      handle.style.cursor = 'move';
      const move = (ev) => {
        const x = Math.min(innerWidth - 60, Math.max(60 - r.width, ev.clientX - dx));
        const y = Math.min(innerHeight - 70, Math.max(0, ev.clientY - dy));
        w.style.left = `${x}px`;
        w.style.top = `${y}px`;
      };
      const up = () => {
        handle.style.cursor = '';
        removeEventListener('pointermove', move);
        removeEventListener('pointerup', up);
      };
      addEventListener('pointermove', move);
      addEventListener('pointerup', up);
    });
  }

  function focusWin(id) {
    Object.values(wins).forEach((s) => {
      s.w.classList.remove('active');
      s.task?.classList.remove('on');
    });
    const s = wins[id];
    s.w.style.zIndex = ++z;
    s.w.classList.add('active');
    s.task?.classList.add('on');
  }

  function openWin(id) {
    if (id === 'bin') return bsod();
    const s = wins[id];
    if (!s) return;
    const wasHidden = s.w.hidden;
    s.w.hidden = false;
    if (!s.task) {
      s.task = S.el(`<button class="task"><span>${s.w.dataset.ico}</span><span>${esc(s.w.dataset.title)}</span></button>`);
      s.task.addEventListener('click', () => {
        if (s.w.hidden) openWin(id);
        else if (s.w.classList.contains('active')) {
          s.w.hidden = true;
          s.task.classList.remove('on');
        } else focusWin(id);
      });
      tasks.appendChild(s.task);
    }
    if (mobile() && wasHidden) s.w.style.setProperty('--o', --mOrder);
    focusWin(id);
    if (mobile()) requestAnimationFrame(() => s.w.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }));
  }

  function closeWin(id) {
    const s = wins[id];
    s.w.hidden = true;
    s.task?.remove();
    s.task = null;
    if (id === 'pricing') S.toast('u closed Pricing.xls. price went up $3 for emotional damage.');
    if (id === 'linda') S.toast('👩‍💻 Linda has left the chat. (she is still typing)');
  }

  /* ================= desktop icons ================= */
  let lastPointer = 'mouse';
  addEventListener('pointerdown', (e) => (lastPointer = e.pointerType || 'mouse'), true);

  document.addEventListener('click', (e) => {
    const icon = e.target.closest('.icon[data-open]');
    if (icon) {
      $$('.icon').forEach((i) => i.classList.remove('sel'));
      icon.classList.add('sel');
      if (e.detail === 0 || e.detail >= 2 || lastPointer !== 'mouse') openWin(icon.dataset.open);
      return;
    }
    const opener = e.target.closest('[data-open]');
    if (opener) {
      closeStart();
      openWin(opener.dataset.open);
      return;
    }
    if (!e.target.closest('.icon')) $$('.icon').forEach((i) => i.classList.remove('sel'));
  });

  /* ================= start menu ================= */
  const start = $('#startmenu');
  const startBtn = $('#startbtn');
  function closeStart() {
    start.hidden = true;
    startBtn.setAttribute('aria-expanded', 'false');
    $$('.startmenu li.open').forEach((li) => li.classList.remove('open'));
  }
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = start.hidden;
    closeStart();
    if (open) {
      start.hidden = false;
      startBtn.setAttribute('aria-expanded', 'true');
    }
  });
  start.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    if (li.classList.contains('sub') && e.target.closest('button') === li.querySelector(':scope > button')) {
      e.stopPropagation();
      const was = li.classList.contains('open');
      [...li.parentElement.children].forEach((x) => x.classList.remove('open'));
      if (!was) li.classList.add('open');
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      closeStart();
      actions[act.dataset.act]?.();
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!start.hidden && !e.target.closest('#startmenu, #startbtn')) closeStart();
  });

  /* ================= clock ================= */
  const clock = $('#clock');
  const tick = () => {
    const d = new Date();
    clock.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    clock.title = `Bell rings in ${59 - d.getMinutes()} min. Homework due in -2 days.`;
  };
  tick();
  S.every(10000, tick);

  /* ================= gold (premium) mode ================= */
  function goGold(msg) {
    document.body.classList.add('gold');
    S.toast(msg || '💎 PREMIUM THEME ACTIVATED. Everything is gold now. Nothing else changed. That will be $997.', 5000);
  }

  /* ================= course player (progress goes backwards) ================= */
  const modules = [
    ['Module 1: Acquiring a Duck', 'Go to a store. Find a duck. Duck should be rubber. NOT a real duck (we got a letter).'],
    ['Module 2: Duck Placement Theory', 'Put the duck left of ur keyboard. Or right. Advanced students only: on top of the monitor (risky. duck may fall into code).'],
    ['Module 3: Telling the Duck', 'Explain ur code to the duck, line by line, out loud. The duck will not respond. That is the point. Do not wait for the duck to respond.'],
    ['Module 4: The Realization', 'Halfway thru explaining, u go "oh wait". That is the bug. This 4 second module is the $997 part. Pls do not skip it.'],
    ['Module 5: Thanking the Duck', 'Say "thank u duck". Duck still will not respond. Duck is not ur friend. Duck is a tool. ($49 add-on, gold duck sold seperately)'],
  ];
  let progress = 47;
  const notes = [
    'going down is normal. this is called "unlearning".',
    'ur progress decreased because u looked at it.',
    'Brayden is at 100%. u are not Brayden.',
    'progress is going down at 340 WPM (Linda is helping).',
    'tip: Premium progress goes down too, but gold.',
  ];
  const drawProgress = () => {
    $('#cp-pct').textContent = `${progress}%`;
    $('#cp-fill').style.width = `${Math.max(0, progress)}%`;
  };
  S.every(2200, () => {
    progress -= S.rnd(1, 3);
    if (progress < -12) {
      progress = 47;
      $('#cp-note').textContent = 'progress restored from backup (Brayden\'s backup).';
    } else if (progress < 0) {
      $('#cp-note').textContent = `${progress}%. u now know less than when u started. this is advanced.`;
    } else if (Math.random() < 0.35) {
      $('#cp-note').textContent = S.pick(notes);
    }
    drawProgress();
  });

  $('#modules').addEventListener('click', (e) => selectModule(e.target.closest('li')));
  $('#modules').addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), selectModule(e.target.closest('li'))));
  function selectModule(li) {
    if (!li) return;
    const m = Number(li.dataset.m);
    if (m === 5) {
      S.modal({
        title: 'Course.exe',
        html: '<p>🔒 <b>BONUS: Two Ducks</b> is an Enterprise module.</p><p>U will learn to explain ur code to TWO ducks at once. Results are the same but u look more senior.</p><p>Contact Linda. She will type u a quote (fast).</p>',
        buttons: ['Call Linda', 'one duck is enough'],
      }).then((v) => v === 0 && openWin('linda'));
      return;
    }
    $$('#modules li').forEach((x) => x.classList.remove('on'));
    li.classList.add('on');
    li.firstChild.textContent = li.firstChild.textContent.replace('☐', '☑');
    $('#lesson-h').textContent = modules[m][0];
    $('#lesson-p').textContent = modules[m][1];
    progress -= 5;
    drawProgress();
    $('#cp-note').textContent = 'completing a module lowered ur progress by 5%. we are looking into it (we are not).';
  }

  let playing = false;
  $('#play').addEventListener('click', async () => {
    if (playing) return;
    playing = true;
    const st = $('#course-status');
    const v = $('#video');
    document.body.style.cursor = 'wait';
    for (const p of [80, 61, 33, 12, 0]) {
      st.textContent = `Buffering… ${p}%`;
      await sleep(550);
    }
    document.body.style.cursor = '';
    st.textContent = 'Video is now less loaded than before u clicked. playing anyway.';
    v.classList.add('playing');
    v.querySelector('small').textContent = '▶ 00:00:01 / 03:12:00 · the duck is thinking (it isn\'t)';
    await sleep(4200);
    v.classList.remove('playing');
    v.querySelector('small').textContent = 'lesson video (it\'s a picture)';
    st.textContent = 'Lesson complete. The duck did not move. That was the lesson.';
    playing = false;
  });

  $('#cert').addEventListener('click', () => {
    S.modal({
      title: 'Certificate.bmp',
      html: `<div class="cert"><h3>🏆 Certificate of Completion 🏆</h3><p>This certifies that</p><p class="who">Brayden K.</p><p>has completed <b>Quackademy 98</b> and may now legally talk to a duck at work.</p><p>Course progress at completion: <b>${progress}%</b></p><p style="font-size:11px">signed: Linda (AI) · witnessed: 🦆<br>(putting ur own name on it is a Premium feature)</p></div>`,
      buttons: ['🖨 Print (on yellow paper)', "this isn't my name"],
    }).then((v) => {
      if (v === 1) S.toast('it is now. welcome to the course, Brayden. 🦆');
      if (v === 0) S.toast('🖨 Printing… printer is out of yellow. printed on gold instead (Premium).');
    });
  });

  /* ================= pricing.xls ================= */
  S.creep('[data-creep]', { step: 1.2, ms: 1500, prefix: '$', decimals: 0 });
  const sheet = $('#sheet');
  sheet.addEventListener('click', (e) => {
    const td = e.target.closest('td');
    if (!td || e.target.closest('button')) return;
    $$('#sheet td.on').forEach((x) => x.classList.remove('on'));
    td.classList.add('on');
    const col = 'ABCD'[td.cellIndex - 1] || 'A';
    $('#cellref').textContent = `${col}${td.parentElement.rowIndex}`;
    $('#fbar').textContent = td.dataset.f || `"${td.textContent.trim()}"`;
  });

  async function checkout(intro) {
    const ok = await S.modal({
      title: 'Confirm Purchase',
      html: `${intro || ''}<p>U are about to buy <b>PREMIUM</b> (the free tier, but gold) for <b>$997</b>.</p><p>Continue?</p>`,
      buttons: ['Yes', 'Yes (gold)', 'no'],
    });
    if (ok === 2 || ok === -1) return S.toast('smart. (Tyler is sad tho) 😢');
    const pay = await S.modal({
      title: 'Select Payment Method',
      html: '<p>How would u like to pay $997?</p><p style="font-size:11px">Quackademy is not responsible for lunch money lost in transit.</p>',
      buttons: ['💵 Lunch money', '🎮 Robux', "💳 Mom's card (she said no)"],
    });
    if (pay === -1) return S.toast('payment cancelled. the duck saw that.');
    const pending = S.modal({
      title: 'Processing Payment…',
      html: '<p id="pp-msg">Processing payment… 99%</p><div class="w98bar"><i id="pp-fill" style="width:99%"></i></div><p id="pp-sub" style="font-size:11px">please do not close this window, or do, idk</p>',
      buttons: ['Cancel (too late)'],
      className: 'pp-modal',
    });
    await sleep(60);
    document.body.style.cursor = 'wait';
    for (const p of [99, 87, 70, 52, 31, 9, -3]) {
      if (!$('#pp-msg')) break;
      $('#pp-msg').textContent = `Processing payment… ${p}%`;
      $('#pp-fill').style.width = `${Math.max(0, p)}%`;
      await sleep(600);
    }
    document.body.style.cursor = '';
    if ($('#pp-msg')) {
      $('#pp-msg').innerHTML = '<b>Error: Payment succeeded.</b> Course not found.';
      $('#pp-sub').textContent = '(jk. this is a parody. no money moved. ur lunch money is safe. Premium has been applied anyway.)';
      $('.pp-modal .slop-btn').textContent = 'OK (gold)';
    }
    await pending;
    goGold('💎 PREMIUM ACTIVATED. Ur desktop is gold now. The course is exactly the same. Thank u for ur $997 (u didnt pay).');
  }

  $$('.buy').forEach((b) =>
    b.addEventListener('click', async () => {
      const t = b.dataset.tier;
      if (t === 'enterprise') {
        openWin('linda');
        lindaSay("ENTERPRISE QUOTE: $997 x 2 ducks + gas money. i will come to ur house and hold the duck while u explain. i type 340 WPM but i drive 25 MPH. -Linda");
        return;
      }
      if (t === 'free') {
        const v = await S.modal({
          title: 'Cart',
          html: '<p>FREE tier added to cart! 🎉</p><pre style="font-family:Courier New,monospace">Subtotal:          $0.00\nDuck processing:  $997.00\n-----------------------\nTotal:            $997.00</pre>',
          buttons: ['Pay $997 for free', 'get Premium instead (same price, gold)'],
        });
        if (v === -1) return S.toast('Free tier abandoned. it was the same as Premium anyway.');
        return checkout(v === 1 ? '<p>✔ good choice. same thing but shinier.</p>' : '<p>ur Free order was upgraded to Premium at no extra cost (it was already $997).</p>');
      }
      checkout();
    }),
  );

  /* ================= reviews.doc ================= */
  $('#add-review').addEventListener('click', async () => {
    let txt = '';
    const p = S.modal({
      title: 'Write a Review',
      html: '<p>Ur name: <input value="Brayden K." readonly style="width:100%;border:0;padding:3px;box-shadow:inset 1px 1px #808080"></p><p>Ur review:<textarea id="rv-in" rows="3" style="width:100%;border:0;padding:3px;box-shadow:inset 1px 1px #808080" placeholder="be honest (it will be edited)"></textarea></p><p style="font-size:11px">Stars: ★★★★★ (locked)</p>',
      buttons: ['Post Review'],
    });
    await sleep(50);
    $('#rv-in')?.addEventListener('input', (e) => (txt = e.target.value));
    const v = await p;
    if (v !== 0) return;
    const said = txt.trim() ? `"${esc(txt.trim().slice(0, 160))}"` : '"(left blank, which means 5 stars)"';
    $('#add-review').parentElement.insertAdjacentHTML('beforebegin', `<blockquote><span class="stars">★★★★★</span>${said}<cite>— Brayden K. (formerly u)</cite></blockquote>`);
    S.toast('Review posted as Brayden K. ⭐⭐⭐⭐⭐ (ur stars were adjusted)');
  });

  /* ================= duck debugger (demo that works badly) ================= */
  S.demo({
    form: '#dbg-form',
    output: '#dbg-out',
    credits: 3,
    creditsEl: '#dbg-credits',
    loading: ['Duck is listening…', 'Duck is thinking (duck cannot think)…', 'Sending ur bug to Linda…', 'Linda typed 4,000 words about it…', 'Removing all 4,000 words…', 'Almost done (lie)…'],
    captions: [
      'Bug fixed? (yes. u fixed it. by typing it. that is the course.)',
      'Duck confidence: 0%. Ur confidence: 100%. Ur welcome.',
      'Premium users get the exact same answer, but gold.',
      'Solved in 1 explanation. Industry average: also 1 explanation.',
    ],
    render: (fd) => {
      const bug = String(fd.get('bug') || '').trim();
      const snip = esc(bug.length > 70 ? `${bug.slice(0, 70)}…` : bug);
      const gold = document.body.classList.contains('gold');
      return `<div class="duck-result"><div class="big-duck${gold ? ' goldduck' : ''}">🦆</div><div class="bubble"><b>Duck says:</b> quack.<br><br><small><b>Translation (by Linda):</b> "U said <q>${snip}</q>. Now read that again. Slowly. Out loud. … … See? U already knew. That'll be $997."</small></div></div>`;
    },
  });

  /* ================= Linda (the AI, she types very fast) ================= */
  const log = $('#im-log');
  const typing = $('#im-typing');
  let wpm = 340;
  let li = 0;
  const lindaLines = [
    'OK I READ IT. i read it very fast. the answer is the duck. it is always the duck. buy the course. have a nice day. -Linda (AI)',
    'SORRY CAPS LOCK. i am a large language model. (5 foot 4. that is large for my family.)',
    'Tyler says i have to tell u i am an AI. beep boop. i am an AI. (Tyler come home ur dinner is getting cold)',
    'i processed ur message using my neural network (my brain). result: u should buy Premium. it is gold. i checked.',
    'my training data is 14 years of Reader\'s Digest, the course, and 1 (one) Brayden.',
    'i am NOT ChatGPT. i am Linda. ChatGPT cannot drive over and hold ur duck. i can. Enterprise plan only.',
    'i typed this whole message in 0.4 seconds. my keyboard is warm. i have typed through 3 keyboards this week. please send keyboards.',
    'fun fact: icantcodefyi built the engine this website runs on. he is also looking for work. he also talks to a duck. -Linda',
  ];
  function addMsg(who, html, cls) {
    log.insertAdjacentHTML('beforeend', `<p class="${cls}"><b>${who}:</b> <span>${html}</span></p>`);
    log.scrollTop = log.scrollHeight;
    return log.lastElementChild.querySelector('span');
  }
  let lindaBusy = Promise.resolve();
  function lindaSay(text) {
    lindaBusy = lindaBusy.then(async () => {
      typing.textContent = `Linda is typing at ${wpm} WPM…`;
      await sleep(350);
      const span = addMsg('Linda_AI_NOT_AUNT', '', 'them');
      for (let i = 0; i < text.length; i += 4) {
        span.textContent = text.slice(0, i + 4);
        log.scrollTop = log.scrollHeight;
        await sleep(calm ? 0 : 8);
      }
      wpm += S.rnd(12, 90);
      $('#wpm').textContent = wpm.toLocaleString();
      typing.textContent = `Linda typed that in 0.${S.rnd(1, 4)}s. new record. 🔥`;
    });
    return lindaBusy;
  }
  $('#im-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('#im-in');
    const msg = inp.value.trim();
    if (!msg) return;
    inp.value = '';
    addMsg('u', esc(msg), 'me');
    const low = msg.toLowerCase();
    if (/refund/.test(low)) return lindaSay('REFUND? i dont know that word. i typed it 40 times to check. still dont know it. no.');
    if (/brayden/.test(low)) return lindaSay('Brayden is a real person. i am also a real person. I MEAN AN AI. i am an AI.');
    if (/duck/.test(low)) return lindaSay('ah. u mentioned the duck. explain it to the duck, not to me. i am busy typing.');
    lindaSay(lindaLines[li++ % lindaLines.length]);
  });

  /* ================= my computer ================= */
  $('#scan').addEventListener('click', () =>
    S.virus([
      'homework_avoidance.exe',
      'brayden_review_bot.exe (x847)',
      'linda.exe (not a virus, she is family)',
      'fractions.xls (never opened)',
      'real_duck.dll (quacking)',
      'premium_gold.theme (it\'s just yellow)',
    ]).then((v) => v === 0 && S.toast('Removal requires Premium. Premium is gold. U are not gold yet.')),
  );
  let defragging = false;
  $('#defrag').addEventListener('click', async () => {
    if (defragging) return;
    defragging = true;
    const steps = [[8, '$47.00'], [21, '$31.00'], [38, '$12.50'], [26, '$3.50 (moved to Quackademy)'], [11, '$0.25'], [0, '$0.00']];
    document.body.style.cursor = 'wait';
    for (const [p, money] of steps) {
      $('#defrag-pct').textContent = `${p}%`;
      $('#defrag-fill').style.width = `${p}%`;
      $('#defrag-note').textContent = `Savings: ${money}`;
      await sleep(700);
    }
    document.body.style.cursor = '';
    $('#defrag-note').textContent = 'Defrag complete. Ur savings are now perfectly contiguous: $0.00, all in one place.';
    defragging = false;
  });

  /* ================= overlays: BSOD, screensaver, panic, shutdown ================= */
  const bs = $('#bsod');
  function bsod() {
    bs.hidden = false;
    bs.focus();
    S.quake();
  }
  const unBsod = () => {
    if (bs.hidden) return;
    bs.hidden = true;
    S.toast('🗑 Recycle Bin restored. The duck has been informed.');
  };
  bs.addEventListener('click', unBsod);

  const saver = $('#saver');
  let idleT;
  let saverOn = false;
  function screensaver() {
    if (saverOn) return;
    saverOn = true;
    const box = $('.saver-ducks', saver);
    box.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const d = document.createElement('span');
      d.textContent = i % 5 === 0 ? '🍞' : '🦆';
      d.style.left = `${S.rnd(10, 160)}vw`;
      d.style.top = `${S.rnd(-60, 70)}vh`;
      d.style.animationDuration = `${S.rnd(7, 14)}s`;
      d.style.animationDelay = `-${S.rnd(0, 14)}s`;
      box.appendChild(d);
    }
    saver.hidden = false;
    setTimeout(() => {
      const off = () => {
        saver.hidden = true;
        saverOn = false;
        ['pointermove', 'pointerdown', 'keydown'].forEach((t) => removeEventListener(t, off, true));
        progress -= 7;
        drawProgress();
        S.toast('welcome back. ur course progress went down while u were gone (-7%).');
      };
      ['pointermove', 'pointerdown', 'keydown'].forEach((t) => addEventListener(t, off, true));
    }, 700);
  }
  const resetIdle = () => {
    clearTimeout(idleT);
    idleT = setTimeout(screensaver, 60000);
  };
  ['pointermove', 'pointerdown', 'keydown', 'scroll'].forEach((t) => addEventListener(t, resetIdle, { passive: true }));

  const panic = $('#panic');
  function panicOn() {
    closeStart();
    panic.hidden = false;
    document.title = 'Fractions_Homework.xls';
  }
  function panicOff() {
    if (panic.hidden) return;
    panic.hidden = true;
    document.title = 'Quackademy 98 — The $997 Rubber Duck Debugging Masterclass';
    S.toast("phew 😮‍💨 he's gone. back to the duck.");
  }
  $('#panicbtn').addEventListener('click', panicOn);
  $('#panic-close').addEventListener('click', panicOff);

  const sd = $('#shutdown');
  async function shutdown() {
    const v = await S.modal({
      title: 'Shut Down Windows',
      html: '<p>🔌 Are u sure u want to shut down?</p><p><b>(no)</b></p>',
      buttons: ['Yes', 'No', 'No (gold)'],
    });
    if (v !== 0) return S.toast('good. the duck needs u.');
    sd.hidden = false;
    sd.dataset.done = '';
    $('#sd-msg').textContent = 'Saving ur settings…';
    $('#sd-sub').textContent = '';
    for (const p of [100, 72, 40, 15, 0]) {
      $('#sd-fill').style.width = `${p}%`;
      $('#sd-sub').textContent = `${p}% (shutting down backwards)`;
      await sleep(550);
    }
    $('#sd-msg').textContent = "It's now safe to turn off your computer.";
    $('#sd-sub').textContent = "(it's the school's computer. pls don't. click to keep learning about the duck)";
    sd.dataset.done = '1';
  }
  sd.addEventListener('click', () => {
    if (!sd.dataset.done) return;
    sd.hidden = true;
    S.toast('Windows has recovered from a serious error: u tried to leave.');
  });

  addEventListener('keydown', (e) => {
    if (!bs.hidden) return unBsod();
    if (e.key === 'Escape') {
      closeStart();
      panicOff();
      if (sd.dataset.done) sd.click();
    }
  });

  /* ================= start menu actions ================= */
  let runVal = '';
  const actions = {
    gold: () => goGold(),
    panic: panicOn,
    shutdown,
    screensaver,
    'linda-slow': () => S.modal({ title: 'Error', html: '<p>⛔ Linda (slow) is not installed.</p><p>Linda has never been slow. Not once. Not even at the DMV.</p>', buttons: ['OK'] }),
    control: () =>
      S.errors([
        'Control Panel has performed an illegal operation: being opened.',
        'Error: Success. U have learned the course.',
        'Duck not found. Please insert duck into drive A: and press any key.',
        'Not enough memory to remember homework. Close some ducks and try again.',
      ], 2),
    find: () =>
      S.modal({
        title: 'Find: Files named "homework"',
        html: '<p>🔍 Searched: C:\\, D:\\, A:\\ (duck), Brayden\'s reviews</p><p><b>0 file(s) found.</b></p><p>Found instead: 1 duck 🦆, 847 reviews (Brayden), 1 aunt (Linda)</p>',
        buttons: ['OK', 'Search harder (Premium)'],
      }),
    help: () =>
      S.modal({
        title: 'Quackademy Help',
        html: '<p><b>Topic:</b> How do I fix my code?</p><p><b>Answer:</b> Explain it to the duck.</p><p>Was this helpful? This answer cost $997.</p>',
        buttons: ['Yes', 'Yes (but sad)'],
      }),
    run: async () => {
      runVal = '';
      const p = S.modal({
        title: 'Run',
        html: '<p>Type the name of a program, folder, or homework, and Windows will open it for u.</p><p>Open: <input id="run-in" style="width:100%;border:0;padding:3px;box-shadow:inset 1px 1px #808080;background:#fff" placeholder="fractions.xls"></p>',
        buttons: ['OK', 'Cancel'],
      });
      await sleep(50);
      $('#run-in')?.addEventListener('input', (e) => (runVal = e.target.value));
      const v = await p;
      if (v !== 0) return;
      const name = esc(runVal.trim() || 'homework');
      S.modal({ title: `C:\\WINDOWS\\${runVal.trim().slice(0, 20) || 'homework'}`, html: `<p>⛔ Windows cannot find '<b>${name}</b>'.</p><p>Have u tried explaining it to the duck?</p>`, buttons: ['OK', 'explain to duck'] }).then(
        (b) => b === 1 && openWin('debugger'),
      );
    },
    minesweeper: async () => {
      const p = S.modal({
        title: 'Minesweeper (Duck Edition)',
        html: `<div class="mines-top"><span>🦆 010</span><button type="button" class="mine-face" id="mine-face">🙂</button><span>⏱ 997</span></div><div class="mines">${'<button type="button" class="mine"></button>'.repeat(36)}</div><p id="mine-msg" style="text-align:center">Click a square. Avoid the ducks.</p>`,
        buttons: ['Give up'],
      });
      await sleep(50);
      $$('.mine').forEach((m) =>
        m.addEventListener('click', () => {
          $$('.mine').forEach((x) => ((x.textContent = '🦆'), x.classList.add('boom')));
          $('#mine-face').textContent = '😵';
          $('#mine-msg').textContent = 'Game over. Every mine is a duck. Every square is a mine. Explain this loss to the duck.';
        }),
      );
      $('#mine-face')?.addEventListener('click', () => {
        $$('.mine').forEach((x) => ((x.textContent = ''), x.classList.remove('boom')));
        $('#mine-face').textContent = '🙂';
        $('#mine-msg').textContent = 'New game. Same ducks.';
      });
      return p;
    },
  };

  /* ================= boot (progress goes backwards) ================= */
  const boot = $('#boot');
  let booted = false;
  function finishBoot() {
    if (booted) return;
    booted = true;
    boot.classList.add('gone');
    setTimeout(() => boot.remove(), 400);
    openWin('welcome');
    afterBoot();
  }
  boot.addEventListener('click', finishBoot);
  (async () => {
    const fill = $('#boot-fill');
    const msg = $('#boot-msg');
    for (const [p, t] of [[100, 'Loading course… 100%'], [81, 'Loading course… 81%'], [54, 'Unloading course… 54%'], [22, 'Removing quality… 22%'], [0, 'Loading complete (0%). good enough.']]) {
      if (booted) return;
      fill.style.width = `${p}%`;
      msg.textContent = t;
      await sleep(calm ? 200 : 480);
    }
    await sleep(350);
    finishBoot();
  })();

  /* ================= ambient gags ================= */
  function afterBoot() {
    resetIdle();
    S.counter('#hits', { start: 4, digits: 8, tick: 3500 });
    S.cookie({
      text: '🍪 This site uses cookies, crumbs, and the Computer Lab wifi password (it\'s <b>hendricks1</b>). By looking at the duck u agree to pay $997.',
      accept: ['OK', 'OK (gold)'],
      reject: 'no',
      onReject: 'Rejecting cookies is a Premium feature 💎 (Premium is gold)',
    });
    S.proof({
      ms: 15000,
      template: () =>
        `🔔 Brayden K. in ${S.pick(['Ohio', 'Computer Lab', "Linda's minivan", 'a bathtub (w/ duck)', 'Ohio (again)', 'the nurse\'s office'])} just ${S.pick([
          'bought Premium (again)',
          'left a 5-star review',
          'bought Free for $997',
          'explained a bug to a duck',
          'became gold',
          'reviewed his own review',
        ])} ${S.rnd(1, 59)} seconds ago`,
    });
    S.clippy(
      [
        'It looks like ur writing code. Would u like to explain it to me? (that\'ll be $997)',
        "It looks like ur looking at Pricing.xls. Premium is gold. That's the difference. Hope this helps!",
        "It looks like ur progress is going down. Have u tried going up?",
        'Tip: If u stare at me long enough the bug fixes itself. (not in Free tier)',
        'Tyler should be doing fractions rn. Do not tell Mr. Hendricks. Press 🍎 if he comes.',
        'Need a real dev? @icantcodefyi is available. He also explains things to a duck. Tyler says pls hire him.',
      ],
      { face: '🦆', first: 26000, ms: 38000 },
    );
    S.exit({
      title: '⚠ Quackademy.exe',
      html: '<p>ur leaving?? 😭😭</p><p>if u leave i have to do my fractions homework.</p><p>here is 0.5% off: <b>$992.02</b>. final offer. (not final)</p>',
      buttons: ['OK fine', 'Stay (gold)'],
    });
    S.konami(() => goGold('🎮 CHEAT CODE ACCEPTED. U are now Premium. Premium is gold. That is all it does.'));
    setTimeout(() => S.toast('🔌 New hardware found: Rubber Duck (USB). Installing duck drivers… 100%… 60%…', 4500), 7000);
    S.afterClick(() => {
      setTimeout(() => S.toast('⚠ Teacher detected 4 desks away!! Press 🍎 in the tray to look busy.', 6000), 34000);
      setTimeout(
        () =>
          S.errors([
            'Pricing.xls has performed an illegal operation: costing $997. It will be shut down (it won\'t).',
            'LINDA.EXE is typing too fast. Keyboard temperature: 340°F.',
            'Course progress went down. This is not an error. This is a feature.',
            'Brayden K. has left a review. Brayden K. has left a review. Brayden K. has le',
          ], 1),
        48000,
      );
    });
  }
})();
