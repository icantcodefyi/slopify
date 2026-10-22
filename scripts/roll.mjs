#!/usr/bin/env node
// Rolls a random slop combo so every site comes out different.
// Usage: node roll.mjs [--seed word] [--era id] [--format id] [--count n]

const ERAS = [
  'geocities-1999', 'win98-desktop', 'myspace-2006', 'web2-beta-2008',
  'y2k-chrome-splash', 'infomercial-funnel', 'crypto-rugpull-2021',
  'gov-portal-2001', 'brainrot-feed', 'linkedin-guru', 'phpbb-forum', 'flash-portal',
];

const FORMATS = {
  'product-parody': 'cheap knockoff of a real SaaS/app landing page',
  'personal-homepage': "someone's homepage about themselves and their 3 hobbies",
  'fan-shrine': 'obsessive fan shrine to a mundane object or minor celebrity',
  'local-business': 'small business site (plumber, kebab shop, dentist, car wash)',
  'startup-launch': 'pre-seed startup launch page for a useless invention',
  'government-service': 'official portal for a made-up bureaucratic service',
  'cult-of-mascot': 'recruitment site for a religion worshipping the mascot',
  'restaurant-menu': 'restaurant with an unhinged menu and booking system',
  'event-invite': 'wedding / birthday / LAN party invitation site',
  'school-project': 'school project report site with a bibliography of 1 source',
  'dating-profile': 'dating site for a very specific niche',
  'online-course': 'guru course that teaches one obvious thing for $997',
};

const MASCOTS = [
  'hotdog 🌭', 'toaster 🍞', 'baguette 🥖', 'traffic cone 🚧', 'rubber duck 🦆',
  'potato 🥔', 'printer 🖨️', 'goose 🪿', 'shrimp 🦐', 'brick 🧱', 'sock 🧦',
  'microwave', 'lobster 🦞', 'cabbage 🥬', 'fax machine 📠', 'pigeon 🐦', 'cheese 🧀',
];

const NARRATORS = [
  'broke freelancer who redesigned it for free and begs to be hired',
  "the owner's nephew who 'knows computers'",
  'a 13-year-old who built it in class instead of doing homework',
  'an AI agent that has clearly gone off the rails',
  'a mid-level manager forced to make it over the weekend',
  'a retired uncle who discovered HTML yesterday',
  'a former crypto bro who has pivoted to this',
  'an intern who is the only remaining employee',
];

const STEVES = [
  'Steve, who does everything by hand in MS Paint',
  'Brenda from accounting, who manually answers every API call',
  "Gary, whose garage is the 'data center'",
  'Dwayne, the night shift, who is a single fax machine',
  'Linda, who is the AI (she types very fast)',
];

const GAGS = [
  'price slowly increases while you read', 'everything is "patent pending"',
  'a countdown that resets when it hits 0', 'the mascot keeps appearing where it should not',
  'a footnote system where footnotes contradict the claims', 'testimonials all from the same person',
  'a progress bar that goes backwards', 'the CTA button runs away from the cursor',
  'the narrator keeps apologizing in the copy', 'a "premium" tier that is just the free tier but gold',
  'a fake award from an organization the narrator made up', 'an FAQ where every answer is "no"',
  'translation errors like it went through 5 languages', 'a terms-of-service that is clearly a cry for help',
];

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') && acc.push([a.slice(2), arr[i + 1]]), acc), []),
);

let seed = [...(args.seed ?? String(Date.now()))].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => rand() - 0.5).slice(0, n);

const count = Number(args.count ?? 1);
const eraPool = pickN(ERAS, ERAS.length);
const formatPool = pickN(Object.keys(FORMATS), Object.keys(FORMATS).length);

for (let i = 0; i < count; i++) {
  const format = args.format ?? formatPool[i % formatPool.length];
  console.log(JSON.stringify({
    era: args.era ?? eraPool[i % eraPool.length],
    format,
    formatBrief: FORMATS[format],
    mascot: pick(MASCOTS),
    narrator: pick(NARRATORS),
    steve: pick(STEVES),
    runningGags: pickN(GAGS, 3),
  }, null, 2));
}
