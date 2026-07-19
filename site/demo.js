/* ==========================================================================
   Mathom — static demo runtime. No backend, no network. All state lives in
   memory and resets on reload. Mirrors the real app's Library / Detail /
   Timeline / Templates / Collections views.
   ========================================================================== */
(function () {
  'use strict';

  // ----- tiny helpers -------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const main = $('#main');
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtDuration = (s) => {
    if (s == null) return '';
    const t = Math.round(s), m = Math.floor(t / 60), r = t % 60;
    return m > 0 ? `${m} min ${r} s` : `${r} s`;
  };
  const clock = (s) => {
    if (!s) return '0:00';
    const t = Math.round(s);
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  };
  let uid = 1000;
  const nextId = () => ++uid;

  function toast(msg) {
    const wrap = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  // ----- seed data ----------------------------------------------------------
  const STATUS_LABEL = {
    pending: 'Pending', transcribing: 'Transcribing', summarizing: 'Summarizing',
    ready: 'Ready', error: 'Error',
  };

  const templates = [
    { id: 1, slug: 'tldr', name: 'TL;DR', description: 'A two-sentence gist of the whole recording.' },
    { id: 2, slug: 'meeting-minutes', name: 'Meeting Minutes', description: 'Structured minutes: attendees, decisions, next steps.' },
    { id: 3, slug: 'action-items', name: 'Action Items', description: 'A checklist of every commitment made.' },
    { id: 4, slug: 'email-draft', name: 'Email Draft', description: 'A ready-to-send recap email.' },
    { id: 5, slug: 'github-issue', name: 'GitHub Issue', description: 'A well-formed issue with context and acceptance criteria.' },
    { id: 6, slug: 'exec-brief', name: 'Executive Brief', description: 'The high-level story for a busy stakeholder.' },
  ];

  const collections = [
    { id: 1, name: 'Product', description: 'Roadmap and planning conversations.' },
    { id: 2, name: 'Personal', description: 'Notes to future me.' },
  ];

  function mkMathom(o) {
    return Object.assign(
      { favorite: false, archived: false, summaries: [], chat_messages: [], collections: [], tags: [], language: 'en', duration_seconds: 0 },
      o
    );
  }

  const mathoms = [
    mkMathom({
      id: 1, title: 'Kitchen renovation ideas', status: 'ready',
      duration_seconds: 214, created_at: '2026-07-15T18:22:00',
      original_filename: 'voice-memo-071526.m4a', favorite: true,
      tags: [{ id: 1, name: 'home' }, { id: 2, name: 'ideas' }],
      collections: [{ id: 2, name: 'Personal' }],
      transcript:
        "Okay, thinking out loud about the kitchen. The main thing is the counter space — it's just too cramped near the stove. I'd like to move the island a bit to the left so there's a proper prep zone. Warm oak for the cabinets, not the grey everyone does. Open shelving on the far wall for the nice bowls. Budget-wise, let's cap it at eight thousand and do it in two phases: cabinets first, then the island. Ask Dana whether her contractor is free in September.",
      summaries: [
        { id: 1, template_slug: 'tldr', template_name: 'TL;DR', model: 'llama3.2',
          content: 'A plan to reconfigure the kitchen for more prep space — move the island left, warm oak cabinets, open shelving — capped at $8k across two phases. Next step: check contractor availability with Dana for September.' },
      ],
      chat_messages: [
        { id: 1, role: 'user', content: 'What was the budget again?' },
        { id: 2, role: 'assistant', content: 'You set a cap of $8,000, split across two phases: cabinets first, then the island.' },
      ],
    }),
    mkMathom({
      id: 2, title: 'Team standup — Thursday', status: 'ready',
      duration_seconds: 372, created_at: '2026-07-16T09:05:00',
      original_filename: 'standup-thu.mp3',
      tags: [{ id: 3, name: 'work' }, { id: 4, name: 'standup' }],
      collections: [{ id: 1, name: 'Product' }],
      transcript:
        "Morning everyone. Priya, you're wrapping the search indexing work — anything blocking? No, just needs review. Marco, the onboarding redesign is behind because the copy isn't final; we'll pull that forward. Decision: we ship the FTS5 search behind a flag on Friday and turn it on Monday after we watch the logs over the weekend. Action items: Priya opens the PR by end of day, Marco chases the copy, and I'll update the release notes. Next standup Monday, same time.",
      summaries: [
        { id: 2, template_slug: 'meeting-minutes', template_name: 'Meeting Minutes', model: 'llama3.2',
          content: 'Attendees: Priya, Marco, host.\n\nDecisions:\n• Ship FTS5 search behind a flag Friday; enable Monday after weekend log review.\n\nAction items:\n• Priya — open the search PR by EOD.\n• Marco — finalize onboarding copy.\n• Host — update the release notes.\n\nNext: Monday standup, same time.' },
      ],
    }),
    mkMathom({
      id: 3, title: 'Podcast idea: local-first tools', status: 'ready',
      duration_seconds: 168, created_at: '2026-07-17T21:40:00',
      original_filename: 'idea-dump.wav',
      tags: [{ id: 2, name: 'ideas' }],
      transcript:
        "Idea for an episode: why local-first software is having a moment. Angle — people are tired of subscriptions and of their data walking out the door. Interview someone who self-hosts everything. Cover the trade-offs honestly: you own your data but you also own the backups. Working title, 'The house always wins.' Could tie it back to how a personal archive changes what you bother to keep.",
      summaries: [],
    }),
    mkMathom({
      id: 4, title: 'Call with the accountant', status: 'ready',
      duration_seconds: 641, created_at: '2026-07-18T14:12:00',
      original_filename: 'accountant-q3.m4a',
      tags: [{ id: 3, name: 'work' }, { id: 5, name: 'finance' }],
      collections: [],
      transcript:
        "Quick recap of the Q3 call. Estimated taxes are due the 15th — set that reminder. She suggested moving the home-office deduction to the simplified method this year, less paperwork. We should keep receipts for the new laptop and the desk. One open question: whether the conference travel counts if it was partly a holiday. She'll email a checklist by Friday.",
      summaries: [
        { id: 3, template_slug: 'action-items', template_name: 'Action Items', model: 'llama3.2',
          content: '☐ Pay estimated taxes by the 15th (set a reminder).\n☐ Switch home-office deduction to the simplified method.\n☐ Keep receipts for the laptop and desk.\n☐ Confirm whether partly-holiday conference travel is deductible.\n☐ Watch for the accountant’s checklist email (Friday).' },
      ],
      favorite: true,
    }),
    mkMathom({
      id: 5, title: 'Garden planning for spring', status: 'ready',
      duration_seconds: 132, created_at: '2026-06-28T11:30:00',
      original_filename: 'garden.m4a', archived: true,
      tags: [{ id: 1, name: 'home' }],
      transcript:
        "Spring garden notes. Tomatoes did badly in the shady bed last year, move them to the south fence. Try three types of basil this time. Build the raised bed before April. Order seeds in January so they don't sell out. Compost is nearly ready — turn it one more time.",
      summaries: [],
    }),
    mkMathom({
      id: 6, title: 'Book club: chapter thoughts', status: 'ready',
      duration_seconds: 205, created_at: '2026-06-20T20:15:00',
      original_filename: 'bookclub.mp3',
      tags: [{ id: 6, name: 'reading' }],
      transcript:
        "Thoughts before book club. The middle section drags but the ending earns it. I want to bring up how the house itself is almost a character — everything the family refuses to throw away ends up defining them. Question for the group: is keeping everything a kind of love or a kind of fear? Bring the sticky-noted copy.",
      summaries: [],
    }),
  ];

  // ----- fake "AI" generators (canned, deterministic) -----------------------
  function generateSummary(mathom, slug) {
    const t = mathom.transcript || '';
    const first = t.split('. ')[0] + '.';
    const byTemplate = {
      tldr: () =>
        `${first} The recording centers on “${mathom.title.toLowerCase()}”, with a clear next step to follow up on.`,
      'meeting-minutes': () =>
        `Topic: ${mathom.title}\n\nKey points:\n• ${first}\n• Follow-ups were captured for the group.\n\nDecision: proceed as discussed.\nNext: revisit at the following session.`,
      'action-items': () =>
        `☐ ${first.replace(/\.$/, '')}\n☐ Follow up on the open question raised.\n☐ Share a short recap with anyone affected.`,
      'email-draft': () =>
        `Subject: Recap — ${mathom.title}\n\nHi,\n\nQuick summary of the notes: ${first} I’ll follow up on the open items and circle back.\n\nBest,\nMe`,
      'github-issue': () =>
        `### Context\n${first}\n\n### Proposal\nCapture the idea from “${mathom.title}” as a tracked task.\n\n### Acceptance criteria\n- [ ] Decision recorded\n- [ ] Owner assigned\n- [ ] Follow-up scheduled`,
      'exec-brief': () =>
        `In one line: ${mathom.title}. ${first} No blockers; the next step is owner follow-through. Flagging only if timelines slip.`,
    };
    const fn = byTemplate[slug] || byTemplate.tldr;
    return fn();
  }

  function chatReply(mathom, question) {
    const q = question.toLowerCase();
    const t = mathom.transcript || '';
    if (/budget|cost|price|\$|money/.test(q) && /\$|budget|thousand|cap/.test(t)) {
      return 'Based on the recording, the budget is capped at $8,000, done in two phases — cabinets first, then the island.';
    }
    if (/who|attend|people/.test(q)) {
      return 'From the transcript, the people mentioned are the ones named in the recording — I’m grounded only in what was said, so I won’t invent others.';
    }
    if (/when|date|deadline|due/.test(q)) {
      return 'The recording mentions a follow-up timeframe; the clearest dated item is the deadline noted in the transcript. Check the highlighted line above for specifics.';
    }
    if (/next|action|todo|do/.test(q)) {
      return 'The main next step captured here is the follow-up mentioned at the end of the recording. Generate the “Action Items” summary for the full checklist.';
    }
    // generic grounded answer
    const sentence = t.split('. ').find((s) => q.split(/\W+/).some((w) => w.length > 3 && s.toLowerCase().includes(w)));
    return sentence
      ? `Here’s the relevant part: “${sentence.trim().replace(/\.$/, '')}.”`
      : 'I can only answer from this recording’s transcript, and I don’t see that covered. Try rephrasing, or ask about something mentioned above.';
  }

  // ----- view state ---------------------------------------------------------
  const state = { view: 'library', currentId: null, shelf: 'all', tag: null, query: '' };

  function setView(view) {
    state.view = view;
    $$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
    render();
  }
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  // ----- renderers ----------------------------------------------------------
  function badge(status) {
    return `<span class="badge ${status}">${STATUS_LABEL[status]}</span>`;
  }

  function renderLibrary() {
    let list = mathoms.filter((m) => (state.shelf === 'archived' ? m.archived : !m.archived));
    if (state.shelf === 'favorites') list = list.filter((m) => m.favorite);
    if (state.tag) list = list.filter((m) => m.tags.some((t) => t.name === state.tag));

    const q = state.query.trim().toLowerCase();
    const searching = q.length > 0;
    let hits = [];
    if (searching) {
      hits = mathoms
        .filter((m) => !m.archived)
        .map((m) => {
          const hay = [m.title, m.transcript || '', m.tags.map((t) => t.name).join(' '), m.summaries.map((s) => s.content).join(' ')].join(' ');
          const idx = hay.toLowerCase().indexOf(q);
          if (idx === -1) return null;
          const start = Math.max(0, idx - 30);
          const raw = hay.slice(start, idx + q.length + 40);
          const snippet = (start > 0 ? '…' : '') +
            esc(raw).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>') + '…';
          return { mathom: m, snippet };
        })
        .filter(Boolean);
    }

    const allTags = Array.from(new Set(mathoms.flatMap((m) => m.tags.map((t) => t.name))));

    const shelves = ['all', 'favorites', 'archived'];
    const shelfBtns = shelves
      .map((s) => `<button class="pill ${state.shelf === s ? 'active-shelf' : ''}" data-shelf="${s}">${s[0].toUpperCase() + s.slice(1)}</button>`)
      .join('');
    const tagBtns = allTags
      .map((name) => `<button class="pill tag ${state.tag === name ? 'active-tag' : ''}" data-tag="${esc(name)}">#${esc(name)}</button>`)
      .join('');

    const card = (m, snippet) => `
      <button class="card mathom-card" data-open="${m.id}">
        <div class="top">
          <h3>${m.favorite ? '★ ' : ''}${esc(m.title)}</h3>
          ${badge(m.status)}
        </div>
        <p class="meta">${fmtDate(m.created_at)}${m.duration_seconds ? ' · ' + fmtDuration(m.duration_seconds) : ''}${m.language ? ' · ' + m.language : ''}</p>
        ${m.tags.length ? `<div class="tags">${m.tags.map((t) => `<span class="chip">${esc(t.name)}</span>`).join('')}</div>` : ''}
      </button>
      ${snippet ? `<p class="snippet">${snippet}</p>` : ''}`;

    let body;
    if (searching) {
      body = `<p class="muted" style="margin-top:1rem">${hits.length} result${hits.length === 1 ? '' : 's'} for “${esc(state.query)}”</p>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem">${hits.map((h) => `<div>${card(h.mathom, h.snippet)}</div>`).join('') || '<p class="muted">No matches.</p>'}</div>`;
    } else if (list.length === 0) {
      body = `<div class="card" style="margin-top:2rem;text-align:center"><p class="font-display" style="font-size:1.1rem;margin:0">Nothing on this shelf yet</p><p class="muted" style="margin-top:0.25rem">Bring a recording home to start your archive.</p></div>`;
    } else {
      body = `<div class="grid">${list.map((m) => card(m)).join('')}</div>`;
    }

    main.innerHTML = `
      <div class="page-head">
        <h2 class="font-display">Library</h2>
        <button class="btn-primary" id="new-mathom">+ New Mathom</button>
      </div>
      <input class="input" id="search" type="search" placeholder="Search your Mathom-house…" value="${esc(state.query)}" style="margin-top:1rem" />
      ${!searching ? `<div class="filter-row">${shelfBtns}${tagBtns}</div>` : ''}
      ${body}`;

    const search = $('#search');
    search.addEventListener('input', (e) => {
      state.query = e.target.value;
      const pos = e.target.selectionStart;
      renderLibrary();
      const s2 = $('#search');
      s2.focus();
      try { s2.setSelectionRange(pos, pos); } catch (_) {}
    });
  }

  function renderDetail() {
    const m = mathoms.find((x) => x.id === state.currentId);
    if (!m) return setView('library');

    const exportLinks = ['md', 'txt', 'json']
      .map((f) => `<a data-export="${f}">Export ${f.toUpperCase()}</a>`)
      .join('');

    const collectionBtns = collections
      .map((c) => {
        const inC = m.collections.some((x) => x.id === c.id);
        return `<button class="pill ${inC ? 'active-shelf' : ''}" data-collection="${c.id}">🗂️ ${esc(c.name)}</button>`;
      })
      .join('');

    const templateOpts = templates.map((t) => `<option value="${t.slug}">${esc(t.name)}</option>`).join('');

    main.innerHTML = `
      <div class="detail">
        <div>
          <a class="back-link" id="back">← Library</a>
          <div class="detail-titlebar">
            <input class="detail-title" id="title" value="${esc(m.title)}" aria-label="Title" />
            <div class="detail-actions">
              ${badge(m.status)}
              <button class="btn-ghost" data-fav>${m.favorite ? '★ Favorited' : '☆ Favorite'}</button>
              <button class="btn-ghost" data-archive>${m.archived ? 'Unarchive' : 'Archive'}</button>
              <button class="btn-ghost danger" data-delete>Delete</button>
            </div>
          </div>
          <p class="detail-meta">${new Date(m.created_at).toLocaleString()}${m.duration_seconds ? ' · ' + fmtDuration(m.duration_seconds) : ''}${m.language ? ' · ' + m.language : ''}${m.original_filename ? ' · ' + esc(m.original_filename) : ''}</p>
        </div>

        <div class="audio-mock">
          <button data-play title="Play (demo)">▶</button>
          <div class="audio-track"><span></span></div>
          <span class="audio-time">0:00 / ${clock(m.duration_seconds)}</span>
        </div>

        <section class="card">
          <div class="card-head">
            <h3 class="section-title">Tags &amp; collections</h3>
            <div class="export-links">${exportLinks}</div>
          </div>
          <div style="margin-top:0.75rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center">
            ${m.tags.map((t) => `<button class="chip" data-remove-tag="${t.id}" title="Remove tag" style="cursor:pointer">#${esc(t.name)} ×</button>`).join('')}
            <input class="input" id="tag-input" placeholder="+ tag" style="width:8rem;padding:0.3rem 0.6rem;font-size:0.8rem" />
          </div>
          <div style="margin-top:0.75rem;display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center">
            ${collectionBtns || '<span class="muted">No collections yet.</span>'}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h3 class="section-title">Summaries</h3>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <select class="select" id="tmpl">${templateOpts}</select>
              <button class="btn-primary" id="gen"${m.transcript ? '' : ' disabled'}>Generate</button>
            </div>
          </div>
          <div id="summaries">
            ${m.summaries.length === 0
              ? '<p class="muted" style="margin-top:0.75rem">No summaries yet. Pick a template and generate one.</p>'
              : m.summaries.map((s) => `
                <div class="summary-block">
                  <p class="kicker">${esc(s.template_name)} · ${esc(s.model)}</p>
                  <p class="body">${esc(s.content)}</p>
                </div>`).join('')}
          </div>
        </section>

        <section class="card">
          <h3 class="section-title">Transcript</h3>
          ${m.transcript ? `<p class="transcript">${esc(m.transcript)}</p>` : '<p class="muted" style="margin-top:0.75rem">Transcript is being prepared…</p>'}
        </section>

        <section class="card">
          <div class="card-head">
            <h3 class="section-title">Ask this Mathom</h3>
            ${m.chat_messages.length ? '<button class="btn-ghost" id="clear-chat">Clear</button>' : ''}
          </div>
          <div class="chat-log" id="chat-log">
            ${m.chat_messages.map((c) => `<div class="bubble ${c.role}">${esc(c.content)}</div>`).join('')}
          </div>
          <form class="chat-form" id="chat-form">
            <input class="input" id="chat-input" placeholder="${m.transcript ? 'Ask a question about this recording…' : 'Waiting for the transcript…'}"${m.transcript ? '' : ' disabled'} />
            <button class="btn-primary" type="submit"${m.transcript ? '' : ' disabled'}>Ask</button>
          </form>
        </section>
      </div>`;
  }

  function renderTimeline() {
    const buckets = {};
    mathoms.forEach((m) => {
      const key = m.created_at.slice(0, 7);
      buckets[key] = (buckets[key] || 0) + 1;
    });
    const rows = Object.entries(buckets).sort((a, b) => b[0].localeCompare(a[0]));
    const max = Math.max(1, ...rows.map((r) => r[1]));
    const label = (k) => {
      const [y, mo] = k.split('-').map(Number);
      return new Date(y, mo - 1, 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    };
    main.innerHTML = `
      <h2 class="font-display" style="font-size:1.5rem;margin:0">Timeline</h2>
      <p class="muted" style="margin-top:0.25rem">How your Mathom-house has grown, month by month.</p>
      <div style="margin-top:1.5rem">
        ${rows.map(([k, n]) => `
          <div class="timeline-row">
            <span class="label">${label(k)}</span>
            <div class="timeline-bar"><span style="width:${Math.max(8, (n / max) * 100)}%">${n}</span></div>
          </div>`).join('')}
      </div>`;
  }

  function renderTemplates() {
    main.innerHTML = `
      <h2 class="font-display" style="font-size:1.5rem;margin:0">Prompt templates</h2>
      <p class="muted" style="margin-top:0.25rem">Editable in the real app — the database copy is authoritative.</p>
      <div class="list">
        ${templates.map((t) => `
          <div class="card">
            <h3>${esc(t.name)} <span class="slug">${esc(t.slug)}</span></h3>
            <p>${esc(t.description)}</p>
          </div>`).join('')}
      </div>`;
  }

  function renderCollections() {
    main.innerHTML = `
      <h2 class="font-display" style="font-size:1.5rem;margin:0">Collections</h2>
      <p class="muted" style="margin-top:0.25rem">Group related Mathoms into shelves.</p>
      <div class="list">
        ${collections.map((c) => {
          const items = mathoms.filter((m) => m.collections.some((x) => x.id === c.id));
          return `<div class="card">
            <h3>🗂️ ${esc(c.name)}</h3>
            <p>${esc(c.description)}</p>
            <p class="muted" style="margin-top:0.5rem">${items.length} Mathom${items.length === 1 ? '' : 's'}: ${items.map((m) => esc(m.title)).join(', ') || '—'}</p>
          </div>`;
        }).join('')}
      </div>`;
  }

  function render() {
    switch (state.view) {
      case 'library': return renderLibrary();
      case 'timeline': return renderTimeline();
      case 'templates': return renderTemplates();
      case 'collections': return renderCollections();
      default: return renderLibrary();
    }
  }

  // ----- upload simulation --------------------------------------------------
  const SAMPLE_UPLOADS = [
    { title: 'Voice note — grocery plan', transcript: 'Quick note: we’re out of coffee and olive oil. Try that new bakery on the corner. Plan meals around what’s in the freezer this week so we waste less. Pick up a birthday card for Sam.' },
    { title: 'Idea while walking', transcript: 'Had a thought on the walk — what if the archive suggested “on this day” memories, gently, once a week? Not naggy. Just a small doorway back into something you’d forgotten you kept.' },
  ];

  function simulateUpload() {
    const sample = SAMPLE_UPLOADS[Math.floor(Math.random() * SAMPLE_UPLOADS.length)];
    const m = mkMathom({
      id: nextId(), title: sample.title, status: 'pending',
      duration_seconds: 60 + Math.floor(Math.random() * 120),
      created_at: new Date().toISOString(),
      original_filename: 'new-recording.m4a', transcript: null, language: 'en',
    });
    mathoms.unshift(m);
    state.view = 'library'; state.query = ''; state.shelf = 'all'; state.tag = null;
    render();
    toast('Recording added — transcribing…');

    const steps = [
      [900, () => { m.status = 'transcribing'; }],
      [1600, () => { m.status = 'summarizing'; m.transcript = sample.transcript; }],
      [1500, () => {
        m.status = 'ready';
        m.summaries = [{ id: nextId(), template_slug: 'tldr', template_name: 'TL;DR', model: 'llama3.2', content: generateSummary(m, 'tldr') }];
        toast('“' + m.title + '” is ready.');
      }],
    ];
    let delay = 0;
    steps.forEach(([d, fn]) => {
      delay += d;
      setTimeout(() => {
        fn();
        if (state.view === 'library') renderLibrary();
        if (state.view === undefined) {}
      }, delay);
    });
  }

  // ----- global event delegation -------------------------------------------
  document.addEventListener('click', (e) => {
    const nav = e.target.closest('#nav a');
    if (nav) { e.preventDefault(); setView(nav.dataset.view); return; }

    const shelf = e.target.closest('[data-shelf]');
    if (shelf) { state.shelf = shelf.dataset.shelf; renderLibrary(); return; }

    const tag = e.target.closest('[data-tag]');
    if (tag) { state.tag = state.tag === tag.dataset.tag ? null : tag.dataset.tag; renderLibrary(); return; }

    const open = e.target.closest('[data-open]');
    if (open) { state.currentId = Number(open.dataset.open); state.view = 'detail'; $$('#nav a').forEach((a) => a.classList.remove('active')); renderDetail(); return; }

    if (e.target.closest('#new-mathom')) { simulateUpload(); return; }
    if (e.target.closest('#back')) { setView('library'); return; }

    const m = mathoms.find((x) => x.id === state.currentId);
    if (!m) return;

    if (e.target.closest('[data-fav]')) { m.favorite = !m.favorite; renderDetail(); toast(m.favorite ? 'Marked as favorite.' : 'Removed from favorites.'); return; }
    if (e.target.closest('[data-archive]')) { m.archived = !m.archived; renderDetail(); toast(m.archived ? 'Archived.' : 'Unarchived.'); return; }
    if (e.target.closest('[data-delete]')) {
      if (window.confirm('Delete this Mathom? (demo only — reload to restore)')) {
        const i = mathoms.indexOf(m); mathoms.splice(i, 1); setView('library'); toast('Mathom deleted.');
      }
      return;
    }
    if (e.target.closest('[data-play]')) { toast('Audio playback is disabled in the demo.'); return; }

    const exp = e.target.closest('[data-export]');
    if (exp) { toast('Export (' + exp.dataset.export.toUpperCase() + ') is available in the real app.'); return; }

    const rmTag = e.target.closest('[data-remove-tag]');
    if (rmTag) { m.tags = m.tags.filter((t) => t.id !== Number(rmTag.dataset.removeTag)); renderDetail(); return; }

    const col = e.target.closest('[data-collection]');
    if (col) {
      const id = Number(col.dataset.collection);
      const c = collections.find((x) => x.id === id);
      const inC = m.collections.some((x) => x.id === id);
      m.collections = inC ? m.collections.filter((x) => x.id !== id) : [...m.collections, { id: c.id, name: c.name }];
      renderDetail();
      return;
    }

    if (e.target.closest('#gen')) {
      const slug = $('#tmpl').value;
      const tmpl = templates.find((t) => t.slug === slug);
      const btn = $('#gen');
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Thinking…';
      setTimeout(() => {
        m.summaries = [
          { id: nextId(), template_slug: slug, template_name: tmpl.name, model: 'llama3.2', content: generateSummary(m, slug) },
          ...m.summaries.filter((s) => s.template_slug !== slug),
        ];
        renderDetail();
        toast(tmpl.name + ' summary generated.');
      }, 1100);
      return;
    }

    if (e.target.closest('#clear-chat')) { m.chat_messages = []; renderDetail(); return; }
  });

  // change (title edit) + submit (tag add, chat) via delegation
  document.addEventListener('change', (e) => {
    if (e.target.id === 'title') {
      const m = mathoms.find((x) => x.id === state.currentId);
      const v = e.target.value.trim();
      if (m && v) { m.title = v; toast('Title saved.'); }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.id === 'tag-input' && e.key === 'Enter') {
      e.preventDefault();
      const m = mathoms.find((x) => x.id === state.currentId);
      const v = e.target.value.trim();
      if (m && v) { m.tags = [...m.tags, { id: nextId(), name: v.replace(/^#/, '') }]; renderDetail(); }
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'chat-form') {
      e.preventDefault();
      const input = $('#chat-input');
      const q = input.value.trim();
      const m = mathoms.find((x) => x.id === state.currentId);
      if (!q || !m) return;
      m.chat_messages = [...m.chat_messages, { id: nextId(), role: 'user', content: q }];
      renderDetail();
      const log = $('#chat-log'); if (log) log.scrollTop = log.scrollHeight;
      setTimeout(() => {
        m.chat_messages = [...m.chat_messages, { id: nextId(), role: 'assistant', content: chatReply(m, q) }];
        renderDetail();
        const log2 = $('#chat-log'); if (log2) log2.scrollTop = log2.scrollHeight;
      }, 750);
    }
  });

  // ----- boot ---------------------------------------------------------------
  render();
})();
