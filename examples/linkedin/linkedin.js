// SlopedIn: Brayden Kessler's profile. Era gags + engine gags.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal, afterClick, every } = window.slop;
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  /* ---------- "see more" that expands into something unnecessary ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.see-more');
    if (!b) return;
    const body = b.parentElement.querySelector('.see-more-body');
    if (!body) return;
    const open = body.hidden;
    body.hidden = !open;
    b.textContent = open ? '…see less (pls dont)' : '…see more';
  });

  /* ---------- reactions + actions on every post ---------- */
  const commenters = [
    ['🧔', 'Chad V.', 'Great insight Brayden! Agree? Agree.'],
    ['👩‍💼', 'Courtney (Growth)', 'This. 👏 So much this. 👏 Following for more this.'],
    ['🤖', 'AI-Generated Comment', 'Great post! What an insightful perspective on {topic}. 🚀'],
    ['🧑‍💻', 'ex-$CURD holder', 'where is my money brayden'],
    ['📠', 'Dwayne', 'BEEP'],
    ['🦉', 'Kyle, Thought Leader', 'Day 46 of the course. I have no friends now. Worth it. Agree?'],
    ['🧑‍⚖️', 'Definitely Not The SEC', 'interesting. very interesting. no reason.'],
  ];
  const decorate = (post) => {
    const foot = post.querySelector('.post-foot');
    if (!foot || foot.dataset.done) return;
    foot.dataset.done = '1';
    const likes = rnd(84, 2400);
    foot.innerHTML = `<div class="react-sum"><span><span class="emo">👍❤️👏💡🧀</span> <span class="lc">${fmt(likes)}</span></span><span>${rnd(12, 380)} comments · ${rnd(3, 90)} reposts</span></div>
      <div class="actions">
        <button class="act" data-like>👍 <span class="al">Like</span></button>
        <button class="act" data-comment>💬 <span class="al">Comment</span></button>
        <button class="act" data-repost>♻️ <span class="al">Repost</span></button>
        <button class="act" data-send>📤 <span class="al">Send</span></button>
      </div><div class="comments" hidden></div>`;
    foot.dataset.likes = likes;
  };
  $$('.post').forEach(decorate);

  let reposts = 0;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.act');
    if (!a) return;
    const post = a.closest('.post');
    const foot = post.querySelector('.post-foot');
    if (a.matches('[data-like]')) {
      const liked = a.classList.toggle('liked');
      const n = Number(foot.dataset.likes) + (liked ? 1 : -1);
      foot.dataset.likes = n;
      foot.querySelector('.lc').textContent = fmt(n);
      if (liked) toast(pick(['👍 Brayden saw that. Brayden will remember.', '🧀 You reacted with Cheese. (there is no cheese reaction. it chose u.)', '💡 Insightful! That like is worth 0.0001 $CURD']));
    } else if (a.matches('[data-comment]')) {
      const box = foot.querySelector('.comments');
      if (!box.hidden) return (box.hidden = true);
      box.hidden = false;
      const topic = post.querySelector('.post-text p')?.textContent.slice(0, 28) || 'cheese';
      box.innerHTML = [0, 1, 2].map(() => {
        const [av, who, said] = pick(commenters);
        return `<div class="comment"><span class="pav">${av}</span><div class="comment-b"><b>${esc(who)}</b><br>${esc(said.replace('{topic}', topic))}</div></div>`;
      }).join('');
    } else if (a.matches('[data-repost]')) {
      if (reposts >= 8) return toast('♻️ SlopedIn has reached maximum thought leadership. Please touch grass.');
      reposts++;
      const clone = post.cloneNode(true);
      clone.querySelector('.reposted-banner')?.remove();
      clone.querySelector('.comments')?.setAttribute('hidden', '');
      clone.querySelectorAll('.liked').forEach((x) => x.classList.remove('liked'));
      clone.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id'));
      clone.querySelector('.post-foot').removeAttribute('data-done');
      clone.prepend(el(`<div class="reposted-banner">♻️ You reposted this${reposts > 1 ? ` (x${reposts}, ur doing amazing)` : ''} · just now</div>`));
      clone.classList.add('fresh');
      post.after(clone);
      $('#post-count').textContent = $$('.post').length;
      toast(pick(['♻️ Reposted! If you agree, repost. If you disagree, also repost.', '♻️ Reposted. Brayden got 1 (one) aura.', '♻️ Your network has been notified. They are tired.']));
    } else if (a.matches('[data-send]')) {
      toast('📤 Sent to Dwayne. Dwayne will print it at 3am.');
    }
  });

  /* ---------- engagement poll that sums to 140%+ ---------- */
  const poll = $('#poll');
  let pollTotal = 140;
  poll.addEventListener('click', (e) => {
    const opt = e.target.closest('.poll-opt');
    if (!opt) return;
    const first = !poll.classList.contains('voted');
    poll.classList.add('voted');
    opt.classList.add('mine');
    const bump = rnd(9, 23);
    opt.dataset.pct = Number(opt.dataset.pct) + bump;
    pollTotal += bump;
    $$('.poll-opt', poll).forEach((o) => {
      o.querySelector('.poll-pct').textContent = `${o.dataset.pct}%`;
      o.querySelector('.poll-fill').style.width = `${Math.min(100, Number(o.dataset.pct))}%`;
    });
    $('#poll-meta').textContent = `${fmt(1204 + pollTotal - 140)} votes · 3 humans · Total: ${pollTotal}% (${pollTotal > 200 ? 'math is a legacy industry' : 'very engaged'})`;
    toast(first ? `🗳️ Vote counted. Also counted it ${bump} more times. Engagement!` : '🗳️ You can vote again. And again. That\'s democracy (B2B).');
  });

  /* ---------- RUNNING GAG 1: progress bars that go backwards ---------- */
  function backbar(barSel, { from, step = [1, 3], ms = 2200, floor = -40, onTick }) {
    const bar = $(barSel);
    let v = from;
    const draw = () => {
      bar.querySelector('i').style.width = `${Math.max(0, Math.min(100, v))}%`;
      bar.classList.toggle('bad', v < 35);
      onTick?.(v);
    };
    draw();
    const api = { get: () => v, set: (n) => ((v = n), draw()) };
    every(ms, () => {
      if (v > floor) v -= rnd(step[0], step[1]);
      draw();
    });
    return api;
  }

  const strengthLabels = [[70, 'All-Star'], [55, 'Advanced'], [40, 'Intermediate'], [25, 'Beginner'], [10, 'Lurker'], [0, 'Who?'], [-999, 'Owes SlopedIn money']];
  const strength = backbar('#strength-bar', {
    from: 78,
    ms: 2600,
    onTick: (v) => {
      $('#strength-pct').textContent = `${v}%`;
      $('#strength-lbl').textContent = strengthLabels.find(([t]) => v >= t)[1];
    },
  });
  $('#boost-btn').addEventListener('click', async () => {
    strength.set(strength.get() + 6);
    toast('⚡ Boosted! +6%');
    await sleep(1400);
    strength.set(strength.get() - 11);
    toast('📉 Boost wore off. −11%. Boosts are a subscription now.');
  });

  backbar('#raise-bar', {
    from: 34,
    ms: 3000,
    floor: -12,
    onTick: (v) => {
      $('#raise-pct').textContent = `${v}%`;
      $('#raise-usd').textContent = `${v < 0 ? '−' : ''}$${fmt(Math.abs(v) * 20000)}`;
      $('#raise-note').textContent =
        v > 30 ? 'my mom is in (for now)' : v > 22 ? 'my mom has "concerns"' : v > 12 ? 'an angel saw the $CURD tweets' : v > 0 ? 'Dwayne invested 1 sheet of paper' : 'we now owe investors money. visionary.';
    },
  });

  const journey = backbar('#journey-bar', {
    from: 22,
    ms: 2000,
    floor: -30,
    onTick: (v) => {
      const day = Math.round((v / 100) * 47);
      $('#journey-lbl').textContent = day > 0 ? `Day ${day} of 47` : day === 0 ? 'Day 0 (pre-thought)' : `Day ${day} of 47 (u are un-leading)`;
    },
  });

  /* ---------- RUNNING GAG 2: the cheese keeps appearing where it shouldn't ---------- */
  const cheeseLines = ['🧀 how did that get in there', '🧀 sorry. it\'s in the walls now.', '🧀 Dwayne printed that one.', '🧀 Legal says this is fine.', '🧀 removed. another one has been dispatched.', '🧀 that cheese had 4,000 followers. murderer.'];
  const spots = ['.headline', '.about-text', '.features li', '.post-text p', '.skills b', '.tier li', '.pav-list b', '.otw', '.testi', '.side-foot p', '.course-sub', '.meta'];
  let intruders = 0;
  const intrude = () => {
    if (intruders >= 14 || document.hidden) return;
    const targets = $$(spots.join(',')).filter((n) => n.offsetParent !== null);
    if (!targets.length) return;
    const t = pick(targets);
    const c = el('<button class="intruder" aria-label="a cheese that should not be here">🧀</button>');
    const words = t.childNodes;
    const textNodes = [...words].filter((n) => n.nodeType === 3 && n.textContent.trim().length > 6);
    if (textNodes.length) {
      const n = pick(textNodes);
      const parts = n.textContent.split(' ');
      const at = rnd(1, Math.max(1, parts.length - 1));
      const before = document.createTextNode(parts.slice(0, at).join(' ') + ' ');
      const after = document.createTextNode(' ' + parts.slice(at).join(' '));
      n.replaceWith(before, c, after);
    } else {
      t.append(' ', c);
    }
    intruders++;
  };
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.intruder');
    if (!c) return;
    c.remove();
    intruders--;
    toast(pick(cheeseLines));
    setTimeout(intrude, 2500);
  });
  $('.search-cheese').addEventListener('click', () => toast('🧀 the search bar has cheese now. we did not put it there.'));
  afterClick(() => {
    setTimeout(intrude, 4000);
    every(13000, intrude);
  });

  /* ---------- RUNNING GAG 3: GIBBE, an award from an org Brayden made up ---------- */
  const award = () =>
    modal({
      title: '🏆 GIBBE Top Voice in Agentic Cheese 2026',
      className: 'award-modal',
      html: `<div class="big">🏅🧀</div>
        <p><b>Global Institute for B2B Brilliance &amp; Excellence</b></p>
        <p class="tiny muted">"The most prestigious award Brayden has ever founded."</p>
        <table>
          <tr><td>Founded</td><td>March 2026, by Brayden Kessler</td></tr>
          <tr><td>Headquarters</td><td>Brayden's car</td></tr>
          <tr><td>Judging panel</td><td>Brayden, Dwayne (fax), Brayden (alt)</td></tr>
          <tr><td>Nominees</td><td>Brayden</td></tr>
          <tr><td>Previous winners</td><td>Brayden (2026, early access)</td></tr>
          <tr><td>Nomination fee</td><td>$499 (waived for Brayden)</td></tr>
        </table>`,
      buttons: ['Congratulate Brayden 🎉', 'Nominate me ($499)'],
    }).then((v) => {
      if (v === 0) toast('🎉 Brayden has been congratulated. He is now posting about being congratulated.');
      if (v === 1) toast('🏆 Nomination received! Results: you lost. Brayden won. Fee non-refundable.');
    });
  $$('[data-award]').forEach((b) => b.addEventListener('click', award));

  /* ---------- the demo that works badly: delegate a task to CurdPilot (Dwayne) ---------- */
  const demoForm = $('#demo');
  const out = $('#demo-out');
  let credits = 3;
  let busy = false;
  const broetry = (task) => {
    const t = task.trim().replace(/[.!?]+$/, '');
    return [
      `I asked my AI Chief of Staff to ${t.toLowerCase()}.`,
      'It said no.',
      'Then it made a loud screaming noise.',
      'Then it printed one (1) gray page.',
      pick(['That page was blank.', 'That page said "BEEP".', 'That page was a picture of a cheese.', 'That page was my own fax number.']),
      `Most people would call that a failure to ${t.split(' ').slice(0, 3).join(' ').toLowerCase()}.`,
      'I call it a B2B lesson.',
      'Agree? 🧀',
    ];
  };
  demoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const task = $('#task').value.trim();
    if (!task) return;
    if (credits <= 0) return toast('📠 Out of fax paper. Dwayne needs paper. Pro plan includes 1 (one) sheet.');
    busy = true;
    out.hidden = false;
    out.innerHTML = '<p class="load-line"></p><div class="backbar"><i style="width:0"></i></div><p class="tiny muted" style="text-align:center" id="demo-pct">0%</p>';
    const steps = [
      ['Compressing your task into a cheese…', 41],
      ['Printing cheese for transmission…', 63],
      ['Dialing Dwayne (56k)… BEEEEEP…', 52],
      ['Dwayne is warming up (toner)…', 37],
      ['KSHHHHHHHHHHHH…', 19],
      ['Rerouting through my old crypto wallet…', 8],
      ['Done! (−4%)', -4],
    ];
    for (const [line, pct] of steps) {
      out.querySelector('.load-line').textContent = line;
      out.querySelector('.backbar i').style.width = `${Math.max(0, pct)}%`;
      out.querySelector('.backbar').classList.toggle('bad', pct < 35);
      out.querySelector('#demo-pct').textContent = `${pct}%`;
      await sleep(rnd(650, 1150));
    }
    credits--;
    $('#credits').textContent = credits > 0 ? credits : '0 (Dwayne is out of paper)';
    const lines = broetry(task);
    const time = `0${rnd(2, 5)}:${String(rnd(0, 59)).padStart(2, '0')} AM`;
    out.innerHTML = `<div class="fax-page">
        <div class="fax-head">FROM: DWAYNE (NIGHT SHIFT) &nbsp;·&nbsp; TO: YOU &nbsp;·&nbsp; ${time} &nbsp;·&nbsp; PAGE 1 OF ${rnd(2, 40)}<br>RE: ${esc(task.toUpperCase())}</div>
        ${lines.map((l) => `<p>${esc(l)}</p>`).join('')}
        <span class="fax-stamp" aria-hidden="true">🧀</span>
      </div>
      <p class="fax-cap">${esc(pick(['AI confidence: 12%. Dwayne confidence: BEEP.', 'Task completed. The task was not completed.', 'Delivered in 9 hours. Industry-leading (for fax).', 'Auto-posted to your SlopedIn feed. You\'re welcome.']))}</p>`;
    window.slop.quake();
    busy = false;
    // it also posts the result to the feed, obviously
    const post = el(`<article class="card post fresh"><div class="reposted-banner">🤖 Auto-posted by CurdPilot on your behalf · just now</div>
      <header class="post-head"><span class="pav">🫵</span><div><b>You</b> <span class="muted">· Thought Leader (unwilling)</span><br><span class="muted tiny">via CurdPilot 🧀 · now · 🌐</span></div></header>
      <div class="post-text">${lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div><div class="post-foot"></div></article>`);
    $('.feed-head').after(post);
    decorate(post);
    $('#post-count').textContent = $$('.post').length;
    setTimeout(() => toast('📣 CurdPilot posted that to your feed. 3 recruiters have unfollowed you.'), 1500);
  });

  /* ---------- skills endorsements ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-endorse]');
    if (!b) return;
    const s = b.dataset.endorse;
    b.textContent = 'Endorsed ✓';
    b.disabled = true;
    toast(s === 'Blockchain' ? '⚠️ Endorsing Blockchain has notified Brayden\'s lawyers.' : `✅ You endorsed Brayden for ${s}. Dwayne also endorsed him. Dwayne endorses everyone at 3am.`);
  });

  /* ---------- top nav ---------- */
  const notifs = () =>
    modal({
      title: '🔔 Notifications (99+)',
      html: `<ul class="notif-list">
        <li>📠 <b>Dwayne</b> endorsed you for <b>Microsoft Excel</b>. Dwayne cannot open Excel.</li>
        <li>🔍 You appeared in <b>4 searches</b> this week. (all of them were you)</li>
        <li>🏆 <b>GIBBE</b> wants you to know you were <i>almost</i> nominated. Fee: $499.</li>
        <li>🎉 Congratulate Brayden on <b>0 years</b> at CurdPilot!</li>
        <li>📉 Your post is gaining traction: <b>3 impressions</b> (−1 since)</li>
        <li>🧀 A cheese viewed your profile.</li>
      </ul>`,
      buttons: ['Mark all as read (they come back)'],
    }).then(() => ($('.badge').textContent = '99+'));
  const navActions = {
    home: () => scrollTo({ top: 0, behavior: 'smooth' }),
    network: () => toast('👥 You have 0 connections. Brayden has 30,000 (bots).'),
    jobs: () => toast('💼 1 job found: Night Shift Fax Operator. Dwayne already has it.'),
    msg: () => {
      const c = $('.slop-chat');
      if (c) c.classList.add('open');
    },
    notif: notifs,
    me: () => toast('😎 "Me" is Brayden now. Everyone is Brayden on SlopedIn.'),
  };
  document.addEventListener('click', (e) => {
    const n = e.target.closest('[data-nav]');
    if (n && navActions[n.dataset.nav]) navActions[n.dataset.nav]();
  });
  $('#search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('#search-q').value.trim() || 'nothing';
    toast(`🔍 0 results for "${q}". Did you mean: synergy? 🧀`);
  });

  /* ---------- Connect, More, Whale tier, buy funnel ---------- */
  $('#connect-btn').addEventListener('click', (e) => {
    e.currentTarget.textContent = '⏳ Pending (forever)';
    toast('🤝 Request sent. Brayden accepts all requests, then DMs you about a "quick 15".');
  });
  $('#more-btn').addEventListener('click', () => toast('More: Save to PDF · Report · Buy $CURD (disabled by court order)'));
  $$('[data-connect]').forEach((b) => b.addEventListener('click', () => {
    b.textContent = 'Pending';
    toast(pick(['🤝 Pending. It\'s Brayden again. It\'s always Brayden.', '🤝 Request faxed. Dwayne is out of paper.', '🤝 Connected to Brayden (alt). Brayden (main) is jealous.']));
  }));
  $('#fax-btn').addEventListener('click', () =>
    modal({
      title: '📠 Fax Dwayne (Whale tier)',
      html: '<p>Fax your enterprise inquiry to:</p><p style="font:700 18px Courier New,monospace;text-align:center">+1 (555) BEEP-KSHH</p><p class="tiny muted">Dwayne is available 11pm–6am. Dwayne does not answer. Dwayne prints. A human (Brayden) reads the prints sometime in Q3.</p><p class="tiny">Can\'t fax? Ask @icantcodefyi, who also can\'t code, and also built this.</p>',
      buttons: ['I don\'t own a fax', 'I will buy a fax'],
    }).then((v) => v === 1 && toast('📠 Great choice. A fax machine is $89. That\'s the real Whale tier.')),
  );

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-buy]');
    if (!b) return;
    if (b.dataset.buy === 'Lurker') return toast('👀 Lurker activated. Brayden can see you lurking. Brayden is always lurking back.');
    const price = $('#course-price').textContent;
    let v = await modal({ title: 'Checkout · Thought Leader Accelerator™', html: `<p>Total: <b>${price}</b></p><p>Add <b>Cheese Protection Plan</b> for $49/mo? Covers mold, theft, and Dwayne.</p>`, buttons: ['Add protection', 'No (I hate cheese)'] });
    if (v === -1) return toast('🥲 Abandoned cart detected. Brayden is writing a post about you.');
    v = await modal({ title: 'Are you sure?', html: '<p>Real leaders say yes.</p><p>Fake leaders say "let me think about it."</p><p>Which are you? 🤔</p>', buttons: ['Yes (real leader)', 'Yes (also real leader)'] });
    if (v === -1) return toast('🥲 Abandoned cart detected. Brayden is writing a post about you.');
    await modal({ title: 'Payment', html: '<p>Payment processing via my old crypto wallet. It\'s fine. It\'s totally fine.</p><p class="tiny muted">(this is a parody. no money is taken. there is no checkout. there is barely a Brayden.)</p>', buttons: ['Pay with vibes'] });
    toast('🧾 Enrolled! Dwayne will fax your receipt overnight. Course progress: −2%.');
    journey.set(journey.get() - 2);
  });

  /* ---------- engine gags ---------- */
  window.slop.cookie({
    text: '🍪 <b>We value your data.</b> A lot. Like, a weird amount. We use cookies, cheese, and your webcam to personalize your thought leadership.',
    accept: ['Accept', 'Accept & Agree?'],
    reject: 'Manage preferences',
    onReject: '⚙️ Preferences managed. Our preference is that you accept.',
  });

  window.slop.creep('#followers', { step: 4, ms: 1300, prefix: '', decimals: 0 });
  window.slop.creep('#course-price', { step: 0.9, ms: 1500, prefix: '$', decimals: 2 });

  window.slop.proof({
    ms: 11000,
    template: () => `👀 ${pick(['A recruiter at Dwayne Inc.', 'Dwayne (night shift)', 'Someone in Ohio', 'Your ex-co-founder (blocked)', '3 people from a cheese company', 'An SEC investigator (probably fine)', 'Brayden Kessler (alt)', 'A former $CURD holder'])} viewed your profile ${rnd(1, 59)}m ago`,
  });

  window.slop.chat({
    name: 'CurdPilot (online-ish)',
    avatar: '🧀',
    greeting: 'hi!! i am CurdPilot, ur AI Chief of Staff 🧀 what can i delegate to Dwayne for u?',
    replies: ['great question. let\'s circle back.', 'faxing that to Dwayne now 📠 KSHHHH', 'i have scheduled a quick 15. it is 45.', 'that sounds like a job for Agentic Cheese™', 'Dwayne is out of paper. try again after 11pm.', 'Agree? 🧀', 'have u considered the Thought Leader tier ($997, rising)?'],
    placeholder: 'message (Dwayne will print it)',
  });

  window.slop.exit({
    title: 'Leaving so soon? 🥺',
    html: '<p><b>Brayden Kessler</b> would like to add you to his professional network.</p><p class="tiny muted">You were 2% away from Thought Leader. (You are now 4% away. The bar moved.)</p>',
    buttons: ['Connect', 'Connect (sadly)'],
  });

  window.slop.konami(() => {
    toast('🧀🧀🧀 CHEESE MODE: every post is about cheese now (they already were)');
    window.slop.rain(['🧀', '📠', '🏆'], 350);
  });

  // Gated chaos: only after the first click.
  afterClick(() => {
    setTimeout(() => toast('✅ Dwayne endorsed you for Excel.'), 9000);
    setTimeout(() => {
      modal({
        title: '🏆 You\'ve been nominated!',
        html: '<p>Congratulations! The <b>GIBBE</b> (Global Institute for B2B Brilliance &amp; Excellence) has shortlisted you for <b>Most Engaged Profile Visitor 2026</b>.</p><p class="tiny muted">GIBBE is an independent* body. *founded by Brayden, the guy whose profile this is.</p>',
        buttons: ['Accept ($499)', 'Decline (Brayden wins by default)'],
      }).then((v) => toast(v === 0 ? '🏆 Payment pending. Brayden thanks you for your $499 and your service.' : '🏆 Declined. Brayden has accepted the award on your behalf.'));
    }, 22000);
  });
})();
