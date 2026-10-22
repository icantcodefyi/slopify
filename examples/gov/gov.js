// gov.js: Dept. of Traffic Cone Innovation. Gags wired on top of slop.js.
(() => {
  const { $, el, pick, rnd, sleep, toast, modal } = slop;
  const notice = (m) => toast(`NOTICE: ${m}`, 3200);
  const $$ = (s) => document.querySelectorAll(s);

  // ---------- engine gags, re-skinned as bureaucracy ----------
  slop.cookie({
    text: '<b>PRIVACY NOTICE per Act 1997-B:</b> This Department collects cookies, your IP address, and the name of your favorite teacher. Data is stored in Gary\'s garage, next to the paint.',
    accept: ['I Acknowledge', 'I Acknowledge Formally'],
    reject: 'decline (requires Form 9)',
    onReject: 'NOTICE: Declining requires Form 9, which is currently being printed. Est. 6-8 weeks.',
  });

  slop.counter('#hits', { start: 4, digits: 6, tick: 15000 });
  slop.creep('#queue', { step: 40, ms: 1400, prefix: '#', decimals: 0 });

  slop.proof({
    template: () =>
      `📋 NOTICE: A citizen in ${pick(['Ohio', "Gary's driveway", 'Period 4', 'a Home Depot parking lot', "the nurse's office", 'Florida (again)'])} just ${pick([
        'registered a cone',
        'was placed in line',
        'filed Form 27-B/6 (denied)',
        'invested $1 (withdrew $1)',
        'read the Terms of Service (is concerned)',
        'asked if this is real (it is patent pending)',
      ])} ${rnd(2, 59)} minutes ago.`,
    ms: 14000,
  });

  slop.clippy(
    [
      'Hello. I am Officer Conrad, Compliance Cone. It appears you are reading. Reading requires Form 12-R.',
      'Have you tried filing the form again? Filing it again also requires a form.',
      'I am a cone. I cannot help you. (patent pending)',
      'Reminder: the Terms of Service are legally binding and also kind of sad. Please read them.',
      'pls dont tell my teacher about this website',
      'Gary says the data center is "making a noise." This is normal.',
    ],
    { face: '🚧', first: 22000, ms: 30000 },
  );

  slop.exit({
    title: 'NOTICE OF DEPARTURE (Form EX-1)',
    html: '<p>Citizens leaving the portal must first complete Form EX-1 (Notice of Intent to Leave).</p><p>Form EX-1 is located on this portal. Please do not leave to look for it.</p><p><i>pls dont go this is the only thing i finished this year</i></p>',
    buttons: ['File Form EX-1', 'Stay (out of respect)'],
  });

  // "Session timed out" after 3 s, once, only after first interaction.
  const errLines = [
    'Session timed out. Your session lasted 3 seconds, which exceeds the allotted 2.',
    'Error 27-B/6: A form is required to close this error.',
    'gary_garage.exe has stopped responding. (Gary is asleep.)',
    'Cone not found. Please place cone and press any key.',
    'Task failed successfully. (patent pending)',
  ];
  slop.afterClick(() => setTimeout(() => slop.errors(errLines, 1), 3000));

  // ---------- federal clock (runs on Gary's microwave time, 7 min fast) ----------
  const clock = () => {
    const d = new Date(Date.now() + 7 * 60000);
    $('#fedtime').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (per Gary\'s microwave)';
  };
  clock();
  slop.every(30000, clock);

  // ---------- running gag: progress bars go backwards ----------
  // Funding round: $27 of $40, decreasing. When empty, the round restarts.
  let raised = 27;
  const reasons = ['Gary withdrew $1 for gas', 'Founder bought a Gatorade', 'Brutus ate a $1 bill', 'refund issued to Gary (again)', 'lunch money audit', 'HDMI cable price went up'];
  const drawFund = () => {
    const pct = Math.max(0, Math.round((raised / 40) * 100));
    $('#fundbar').style.width = pct + '%';
    $('#fundpct').textContent = pct + '%';
    $('#raised').textContent = '$' + Math.max(0, raised).toFixed(2);
  };
  drawFund();
  slop.every(2600, () => {
    raised -= Math.random() * 0.9 + 0.1;
    if (raised <= 0) {
      raised = 27;
      notice("Pre-seed round restarted. Gary found $27 in his other jacket.");
    } else if (Math.random() < 0.18) {
      $('#raisedNote').textContent = `(${pick(reasons)})`;
    }
    drawFund();
  });

  // Application status: 99% and falling. It says "Almost done!" the whole time.
  let status = 99;
  const statusMsgs = ['Almost done!', 'Almost done!!', 'Reticulating cones...', 'Waiting on Gary...', 'Almost done! (again)', 'Rewinding...'];
  slop.every(1800, () => {
    status -= rnd(1, 4);
    if (status < 3) {
      status = 99;
      notice('Your application has been processed and returned to the beginning of the line.');
    }
    $('#statusbar').style.width = status + '%';
    $('#statuspct').textContent = status + '%';
    $('#statusmsg').textContent = pick(statusMsgs);
  });
  $('#statusbar').style.width = '99%';

  // ---------- running gag: Terms of Service (a cry for help) ----------
  const tosHtml = `<div class="tos" style="height:180px">${$('.tos').innerHTML}</div>`;
  const showTos = async () => {
    const v = await modal({ title: 'Terms of Service (patent pending)', html: tosHtml, buttons: ['I Agree', 'I Agree (and will tell an adult)'] });
    if (v === 1) notice('Thank you. Please tell them it was a business project.');
    else if (v === 0) notice('Agreement recorded. Agreement renews when you blink.');
  };
  $('#tos-link').addEventListener('click', (e) => (e.preventDefault(), showTos()));
  $('#tos-check').addEventListener('change', (e) => {
    if (e.target.checked && !showTos.seen) {
      showTos.seen = true;
      e.target.checked = false;
      notice('The Department noticed you did not read them.');
      showTos().then(() => ($('#tos-check').checked = true));
    }
  });

  // ---------- utility links, left nav, publications ----------
  const utils = {
    text: () => notice('The Text Only version is available via Form 27-B/6 (PDF, 1.2 GB).'),
    map: () => modal({ title: 'Site Map', html: '<ul><li>Home<ul><li>Home (again)<ul><li>This page</li></ul></li></ul></li></ul><p class="small">Site Map last mapped 03/14/2001.</p>', buttons: ['Close Map'] }),
    a11y: () => notice('Accessibility Office hours: Tues 10:00-10:05. Office is on the 2nd floor. There is no elevator.'),
    es: () => notice('Disponible en 2003. (patente pendiente)'),
    org: () => modal({ title: 'Organizational Chart', html: '<pre style="font:12px/1.4 Courier New,monospace">  [ FOUNDER / CEO / CTO / CFO ]\n        (Dylan, Grade 8)\n               |\n               |\n   [ GARY, Head of Infrastructure ]\n     (owns the garage, 54, neighbor)\n               |\n   [ BRUTUS, Head of Security ]\n          (dog)</pre>', buttons: ['Acknowledge Hierarchy'] }),
    board: () => notice('The Board of Directors is a skateboard. It is currently in Gary\'s garage. It has voted yes on everything.'),
    contact: () => modal({ title: 'Contact the Department', html: '<p>The Department accepts correspondence by <b>fax only</b>.</p><p>Fax: (555) 014-2000 (this is also Gary\'s phone. If Gary answers, please hang up and try again.)</p><p>Email is not monitored. It is my mom\'s.</p>', buttons: ['Fax Gary', 'Close'] }).then((v) => v === 0 && fax('Contact Request')),
    privacy: () => notice('Your privacy is important to us. It is stored in Gary\'s garage, next to the paint.'),
  };
  $$('[data-util]').forEach((a) => a.addEventListener('click', (e) => (e.preventDefault(), utils[a.dataset.util]?.())));

  // Form 1A requires 1B; 1B requires 1A. A loop, as intended.
  $$('[data-form]').forEach((a) =>
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const f = a.dataset.form;
      if (f === '27') return notice('Form 27-B/6 is the application to apply for this application. Please apply.');
      const other = f === '1a' ? '1B' : '1A';
      const v = await modal({
        title: `Form ${f.toUpperCase()}`,
        html: `<p>Form ${f.toUpperCase()} cannot be issued until Form ${other} has been submitted.</p><p class="small">Form ${other} cannot be issued until Form ${f.toUpperCase()} has been submitted.</p>`,
        buttons: [`Go to Form ${other}`, 'Give Up (recommended)'],
      });
      if (v === 0) document.querySelector(`[data-form="${other.toLowerCase()}"]`).click();
    }),
  );

  $$('[data-pdf]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      notice(pick([
        'Download will begin in 3 business decades.',
        'This publication is available by fax only. Please fax a request to Gary.',
        'Adobe Acrobat Reader 4.0 is required. Please install from the CD in Gary\'s garage.',
        'File is 488 MB. Estimated time on 56k: 19 hours. Gary\'s internet: never.',
      ]));
    }),
  );

  $('#investbtn').addEventListener('click', async () => {
    const v = await modal({
      title: 'Investment Intake (Form INV-1)',
      html: '<p>Thank you for your interest in SmartCone&trade; (patent pending).</p><p>Investments are accepted by fax, or in cash given to Gary, who will give it to me (he says).</p><p class="small">Min. $1.00. Max. $40.00 (we do not know what we would do with more).</p>',
      buttons: ['Fax Investment to Gary', 'Give Cash to Gary', 'Cancel'],
    });
    if (v === 0) fax('Investment Commitment');
    if (v === 1) {
      raised += 5;
      drawFund();
      notice('Gary received $5. Gary has withdrawn $5 for gas.');
      setTimeout(() => ((raised -= 5), drawFund()), 2500);
    }
  });

  // ---------- custom gag: fax to Gary (modem log + backwards transmission bar) ----------
  async function fax(what = 'Document') {
    const p = modal({ title: 'FaxMaster 98 - Sending to Gary', html: `<div class="fax-log"></div>`, buttons: ['Cancel Fax (Gary prefers this)'], className: 'gov-fax' });
    await sleep(50);
    const log = document.querySelector('.gov-fax .fax-log');
    const lines = [
      `Preparing: ${what} (1 page)`,
      'ATDT 555-014-2000...',
      'EEEEEEEEEEE—KSSSHHHHHHHHHH—BWONG BWONG',
      'Gary picked up. Gary said "hello?"',
      'Gary said "is this the fax thing again"',
      'Gary hung up.',
      'Transmission: 100%',
      'Transmission: 61%',
      'Transmission: 12%',
      'Transmission: 0%',
      'FAX SENT SUCCESSFULLY (0 of 1 pages).',
    ];
    for (const l of lines) {
      if (!log.isConnected) break;
      log.textContent += l + '\n';
      await sleep(rnd(450, 900));
    }
    return p;
  }

  // ---------- demo that works badly: Form SC-1 ----------
  const form = $('#scform');
  const out = $('#formout');
  let credits = 3;
  slop.captcha(form, {
    prompt: 'FEDERAL VERIFICATION: Select all squares containing a traffic cone.',
    tiles: ['🚧', '🍦', '🚧', '🎉', '🚧', '🧙', '🚧', '🦄', '🚧'],
    fail: 'NOTICE: Incorrect. The wizard hat is also a cone. Please try again or fax Gary.',
  });
  const placements = [
    "Gary's garage (again)",
    'the middle of the school cafeteria',
    'on top of another cone (stack mode)',
    'Mrs. Patterson\'s desk (do not tell her)',
    'your driveway, but in 2009',
    'a pothole 4 states away',
    'on Brutus (he did not consent)',
  ];
  const captions = [
    'Cone confidence: 12%. Cone orange-ness: 100%.',
    'Shape: cone (patent pending).',
    'Your cone will arrive in 3 business decades.',
    'Gary has been notified. Gary is not happy.',
  ];
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (credits <= 0) return notice('You have used all 3 cone requests for fiscal year 2001. Please return in fiscal year 2001.');
    const fd = new FormData(form);
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    out.hidden = false;
    out.innerHTML = '<div class="proc"><p id="procmsg"></p><div class="pbar"><div class="pfill" id="procbar" style="width:12%"></div><span id="procpct">12%</span></div></div>';
    const steps = [
      [12, 'Receiving form via fax emulation...'],
      [46, 'Stamping form (1 of 3 stamps)...'],
      [88, 'Uploading to data center (Gary\'s garage)...'],
      [71, 'Gary opened the garage door. Re-uploading...'],
      [40, 'Waiting for Brutus to move off the server...'],
      [9, 'Processing complete. Rewinding to be safe...'],
    ];
    for (const [pct, msg] of steps) {
      $('#procmsg').textContent = msg;
      $('#procbar').style.width = pct + '%';
      $('#procpct').textContent = pct + '%';
      await sleep(rnd(700, 1200));
    }
    credits--;
    $('#credits').textContent = credits > 0 ? credits : '0 (see you in FY2001)';
    btn.disabled = false;
    const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const loc = esc(fd.get('loc')) || 'unspecified';
    out.innerHTML = `<div class="cert">
        <h4>CERTIFICATE OF CONE DEPLOYMENT</h4>
        <div class="big-cone">🚧</div>
        <table>
          <tr><td>Request No.</td><td>SC-${rnd(1000, 9999)}-B/6</td></tr>
          <tr><td>Location requested</td><td>${loc}</td></tr>
          <tr><td>Location assigned</td><td><b>${pick(placements)}</b></td></tr>
          <tr><td>Reason</td><td>${esc(fd.get('reason'))}</td></tr>
          <tr><td>Cone's mother</td><td>${esc(fd.get('mmn'))} (verified by Gary)</td></tr>
          <tr><td>Reason for existing</td><td>${esc(fd.get('why')) || '<i>none given (noted)</i>'}</td></tr>
        </table>
        <div class="stamp">APPROVED-ISH</div>
        <p style="margin:4px 0">Please <b>print, sign, and fax</b> this certificate to Gary within 2 minutes or it becomes void.</p>
        <button class="govbtn" type="button" id="faxbtn">Print, Sign &amp; Fax to Gary</button>
      </div>
      <p class="cert-cap">${pick(captions)}</p>`;
    $('#faxbtn').addEventListener('click', () => fax('Certificate of Cone Deployment'));
    slop.quake();
  });
  form.addEventListener('reset', () => notice('Form reset. Your place in line has also been reset (to further back).'));

  // ---------- custom gag: Panic Button / Homework Mode (boss key) ----------
  const hw = $('#homework');
  const openHw = (e) => {
    e?.preventDefault();
    hw.hidden = false;
    $('#hw-close').focus();
  };
  const closeHw = () => {
    hw.hidden = true;
    notice('Homework Mode deactivated. Worksheet progress: 0% (going down).');
  };
  $('#panic').addEventListener('click', openHw);
  $('#hw-close').addEventListener('click', closeHw);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !hw.hidden) closeHw();
  });

  slop.konami(() => {
    openHw();
    notice('Konami code detected. Teacher is coming. Act natural.');
  });
})();
