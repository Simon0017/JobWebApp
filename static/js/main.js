import { get_jobs } from "./fetch_functions.js";

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
const SITES = ['LinkedIn','Indeed','BrighterMonday','JobWebKenya','Fuzu','Pigiame'];
const SITE_CLASSES = {
  LinkedIn:'site-linkedin',Indeed:'site-indeed',BrighterMonday:'site-brightermonday',
  JobWebKenya:'site-jobwebkenya',Fuzu:'site-fuzu',Pigiame:'site-pigiame'
};

let JOBS = [
  // {id:1,title:'Senior Software Engineer',field:'Technology',company:'Safaricom PLC',posted_by:'LinkedIn',location:'Nairobi',type:'Full-time',payment:'KES 180,000–250,000/mo',date_posted:'2025-03-01',application_deadline:'2025-03-31',minimum_requirements:['5+ years software dev experience','Proficiency in Java/Kotlin or Python','Experience with microservices & cloud (AWS/GCP)','Strong knowledge of REST APIs & databases','BSc Computer Science or related field'],responsibilities:['Design and develop scalable backend services','Lead technical design reviews','Mentor junior developers','Collaborate with cross-functional teams','Ensure code quality via testing & CI/CD'],application_method:'Online portal',sites:['LinkedIn','Indeed','BrighterMonday'],skills:['Java','Python','AWS','Microservices','REST API','SQL']},
  // {id:2,title:'Data Analyst',field:'Technology',company:'KCB Bank',posted_by:'BrighterMonday',location:'Nairobi',type:'Full-time',payment:'KES 90,000–130,000/mo',date_posted:'2025-03-03',application_deadline:'2025-03-28',minimum_requirements:['3+ years data analysis experience','Proficiency in SQL, Python or R','Experience with BI tools (Power BI/Tableau)','Strong statistical knowledge','Degree in Statistics, Math or Computer Science'],responsibilities:['Analyze large financial datasets','Build dashboards and reports','Identify trends and actionable insights','Collaborate with business units','Present findings to management'],application_method:'Email CV to hr@kcb.co.ke',sites:['BrighterMonday','LinkedIn','Fuzu'],skills:['SQL','Python','Power BI','Tableau','Statistics','Excel']},
  // {id:3,title:'UX/UI Designer',field:'Design',company:'Cellulant',posted_by:'Fuzu',location:'Remote',type:'Remote',payment:'KES 70,000–110,000/mo',date_posted:'2025-03-04',application_deadline:'2025-04-05',minimum_requirements:['3+ years UI/UX design','Mastery of Figma & Adobe XD','Portfolio of mobile-first designs','Knowledge of design systems','Experience with user research'],responsibilities:['Create wireframes and prototypes','Conduct user research & usability testing','Maintain and evolve design system','Collaborate with engineering teams','Deliver pixel-perfect designs'],application_method:'Portfolio + CV via Fuzu',sites:['Fuzu','LinkedIn'],skills:['Figma','Adobe XD','User Research','Prototyping','CSS','Design Systems']},
  // {id:4,title:'Marketing Manager',field:'Marketing',company:'Equity Bank',posted_by:'JobWebKenya',location:'Nairobi',type:'Full-time',payment:'KES 120,000–160,000/mo',date_posted:'2025-03-02',application_deadline:'2025-03-25',minimum_requirements:['5+ years marketing experience','Digital marketing expertise','Campaign management skills','Budget management experience','MBA preferred'],responsibilities:['Develop and execute marketing strategies','Manage digital and ATL campaigns','Track and report KPIs','Manage marketing budget','Build brand partnerships'],application_method:'Online application',sites:['JobWebKenya','Indeed','BrighterMonday','Pigiame'],skills:['Digital Marketing','SEO','Campaign Management','Brand Strategy','Analytics','Social Media']},
  // {id:5,title:'Financial Analyst',field:'Finance',company:'Stanbic Bank',posted_by:'Indeed',location:'Nairobi',type:'Full-time',payment:'KES 100,000–150,000/mo',date_posted:'2025-03-05',application_deadline:'2025-04-10',minimum_requirements:['CPA or ACCA certified','3+ years financial analysis','Advanced Excel skills','Experience with financial modeling','BSc Finance or Accounting'],responsibilities:['Prepare financial models and forecasts','Analyze financial statements','Support investment decisions','Monthly reporting and variance analysis','Risk assessment and management'],application_method:'CV via portal',sites:['Indeed','LinkedIn'],skills:['Financial Modeling','Excel','CPA','ACCA','Risk Analysis','SQL']},
  // {id:6,title:'DevOps Engineer',field:'Technology',company:'M-KOPA',posted_by:'LinkedIn',location:'Nairobi',type:'Full-time',payment:'KES 160,000–220,000/mo',date_posted:'2025-03-06',application_deadline:'2025-04-02',minimum_requirements:['4+ years DevOps experience','Kubernetes & Docker expertise','CI/CD pipeline management','Cloud platforms (AWS/Azure)','Infrastructure as Code (Terraform)'],responsibilities:['Maintain and improve CI/CD pipelines','Manage cloud infrastructure','Ensure system reliability & uptime','Implement security best practices','Automate deployment workflows'],application_method:'LinkedIn Apply',sites:['LinkedIn','BrighterMonday','Indeed'],skills:['Kubernetes','Docker','AWS','Terraform','CI/CD','Python']},
  // {id:7,title:'Nurse — ICU Specialist',field:'Healthcare',company:'Nairobi Hospital',posted_by:'Pigiame',location:'Nairobi',type:'Full-time',payment:'KES 60,000–90,000/mo',date_posted:'2025-03-01',application_deadline:'2025-03-22',minimum_requirements:['Registered Nurse (NCLEX)','2+ years ICU experience','BLS & ACLS certified','Experience with ventilators','Team player'],responsibilities:['Provide critical patient care','Monitor and assess patient vitals','Administer medications per physician orders','Document patient progress','Collaborate with medical team'],application_method:'Email applications to hr@nbi-hospital.co.ke',sites:['Pigiame','JobWebKenya'],skills:['ICU Care','ACLS','BLS','Patient Assessment','Medical Documentation']},
  // {id:8,title:'Product Manager',field:'Technology',company:'Twiga Foods',posted_by:'LinkedIn',location:'Nairobi',type:'Full-time',payment:'KES 140,000–190,000/mo',date_posted:'2025-03-07',application_deadline:'2025-04-15',minimum_requirements:['4+ years product management','Agile/Scrum experience','Data-driven decision making','Excellent communication skills','BSc + MBA preferred'],responsibilities:['Define product vision and roadmap','Prioritize features with engineering','Conduct market and user research','Track product metrics and OKRs','Coordinate cross-functional teams'],application_method:'LinkedIn Apply',sites:['LinkedIn','Fuzu','BrighterMonday'],skills:['Product Management','Agile','Scrum','Data Analysis','Roadmapping','User Research']},
  // {id:9,title:'Sales Executive — B2B',field:'Sales',company:'Safaricom Business',posted_by:'BrighterMonday',location:'Nairobi',type:'Full-time',payment:'KES 60,000 + Commission',date_posted:'2025-03-02',application_deadline:'2025-03-20',minimum_requirements:['2+ years B2B sales experience','Strong negotiation skills','CRM knowledge (Salesforce)','Self-motivated with proven track record','Diploma or Degree in Business'],responsibilities:['Acquire new business accounts','Meet monthly and quarterly targets','Manage client relationships','Prepare sales proposals and pitches','Report sales activity in CRM'],application_method:'Online',sites:['BrighterMonday','Indeed','Pigiame','JobWebKenya'],skills:['B2B Sales','Salesforce','Negotiation','Account Management','CRM']},
  // {id:10,title:'React Developer',field:'Technology',company:'Andela Kenya',posted_by:'LinkedIn',location:'Remote',type:'Remote',payment:'USD 2,000–4,000/mo',date_posted:'2025-03-06',application_deadline:'2025-04-20',minimum_requirements:['3+ years React.js','TypeScript proficiency','State management (Redux/Zustand)','Testing (Jest/React Testing Library)','Git and collaborative workflow'],responsibilities:['Build and maintain React applications','Write clean, tested code','Participate in code reviews','Improve frontend performance','Collaborate with global teams'],application_method:'Andela platform',sites:['LinkedIn','Indeed','Fuzu'],skills:['React','TypeScript','Redux','Jest','CSS','Node.js']},
  // {id:11,title:'Civil Engineer — Roads',field:'Engineering',company:'Kenya National Highways',posted_by:'JobWebKenya',location:'Nationwide',type:'Contract',payment:'KES 100,000–140,000/mo',date_posted:'2025-03-03',application_deadline:'2025-04-01',minimum_requirements:['BSc Civil Engineering','EBK registered','3+ years roads/infrastructure','AutoCAD & Civil 3D','Project management experience'],responsibilities:['Design and supervise road projects','Prepare engineering drawings','Manage contractors on-site','Ensure compliance with specifications','Prepare progress reports'],application_method:'Physical application to KeNHA offices',sites:['JobWebKenya','BrighterMonday'],skills:['AutoCAD','Civil 3D','Project Management','Road Design','EBK','Surveying']},
  // {id:12,title:'Cybersecurity Analyst',field:'Technology',company:'I&M Bank',posted_by:'LinkedIn',location:'Nairobi',type:'Full-time',payment:'KES 120,000–170,000/mo',date_posted:'2025-03-05',application_deadline:'2025-04-08',minimum_requirements:['CEH or CISSP certified','3+ years security experience','SIEM tools knowledge','Vulnerability assessment skills','BSc IT or Computer Science'],responsibilities:['Monitor security events and incidents','Conduct vulnerability assessments','Implement security policies','Respond to security incidents','Prepare security reports'],application_method:'LinkedIn Apply',sites:['LinkedIn','Indeed'],skills:['Cybersecurity','SIEM','CEH','CISSP','Network Security','Penetration Testing']},
];

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let currentPage = 1;
const JOBS_PER_PAGE = 6;
let filteredJobs = [...JOBS];
let suitSkills = [];
let currentView = 'grid';
let chartsInitialized = {};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const m = document.getElementById('mainContent');
  s.classList.toggle('collapsed');
  m.classList.toggle('expanded');
}

// ═══════════════════════════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════════════════════════
const TAB_META = {
  directory: { title: 'Jobs Directory', sub: 'Aggregated from 6 platforms · Updated 2h ago' },
  evaluation: { title: 'Job Evaluation', sub: 'Deep-dive job analysis & comparison' },
  analysis: { title: 'Market Analysis', sub: 'Platform & category insights' },
  suitability: { title: 'Job Suitability', sub: 'Find jobs matching your profile' },
};

async function switchTab(tab, navEl) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (navEl) navEl.classList.add('active');
  const meta = TAB_META[tab];
  document.getElementById('pageTitle').textContent = meta.title;
  document.getElementById('pageSubtitle').textContent = meta.sub;
  if (tab === 'directory') {
    JOBS = await get_jobs(currentPage);
    filteredJobs = [...JOBS];
    filterJobs()
  }
  if (tab === 'analysis') initAnalysisCharts();
  if (tab === 'evaluation') initEvaluation();
}

// ═══════════════════════════════════════════════════════════════
// JOBS DIRECTORY
// ═══════════════════════════════════════════════════════════════
function filterJobs() {
  const q = document.getElementById('dirSearch').value.toLowerCase();
  const field = document.getElementById('filterField').value;
  const type = document.getElementById('filterType').value;
  const site = document.getElementById('filterSite').value;
  const sort = document.getElementById('filterSort').value;

  filteredJobs = JOBS.filter(j => {
    const matchQ = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    const matchField = !field || j.field === field;
    const matchType = !type || j.type === type;
    const matchSite = !site || j.sites.includes(site);
    return matchQ && matchField && matchType && matchSite;
  });

  if (sort === 'deadline') filteredJobs.sort((a,b) => new Date(a.application_deadline) - new Date(b.application_deadline));
  else if (sort === 'sites') filteredJobs.sort((a,b) => b.sites.length - a.sites.length);
  else if (sort === 'salary') filteredJobs.sort((a,b) => b.payment.localeCompare(a.payment));
  else filteredJobs.sort((a,b) => new Date(b.date_posted) - new Date(a.date_posted));

  currentPage = 1;
  renderJobs();
}

function renderJobs() {
  const grid = document.getElementById('jobGrid');
  const label = document.getElementById('jobCountLabel');
  const total = filteredJobs.length;
  const totalPages = Math.ceil(total / JOBS_PER_PAGE);
  const start = (currentPage - 1) * JOBS_PER_PAGE;
  const pageJobs = filteredJobs.slice(start, start + JOBS_PER_PAGE);

  label.innerHTML = `Showing <strong style="color:var(--c2-light)">${total}</strong> jobs`;
  grid.className = currentView === 'list' ? '' : 'grid-auto';
  if (currentView === 'list') grid.style.display = 'flex', grid.style.flexDirection = 'column', grid.style.gap = '12px';

  if (!pageJobs.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🔍</div><div class="empty-title">No jobs found</div><div class="empty-text">Try adjusting your filters</div></div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  grid.innerHTML = pageJobs.map(j => jobCardHTML(j)).join('');
  renderPagination();
}

function jobCardHTML(j) {
  const featured = j.sites.length >= 3;
  const days = daysUntil(j.application_deadline);
  const urgency = days <= 5 ? 'text-danger' : days <= 14 ? '' : 'text-muted';
  return `
  <div class="job-card${featured?' featured':''}" onclick="openJobEval(${j.id})">
    <div class="job-card-header">
      <div>
        <div class="job-title">${j.title}</div>
        <div class="job-company">🏢 ${j.company}</div>
      </div>
      ${featured ? '<span style="font-size:0.65rem;background:rgba(245,146,146,0.15);color:var(--c4);padding:3px 8px;border-radius:4px;border:1px solid rgba(245,146,146,0.3);white-space:nowrap;">🔥 Hot</span>' : ''}
    </div>
    <div class="job-meta">
      <span class="meta-tag type">⚡ ${j.type}</span>
      <span class="meta-tag location">📍 ${j.location}</span>
      <span class="meta-tag salary">💰 ${j.payment.length > 22 ? j.payment.slice(0,22)+'…' : j.payment}</span>
      <span class="meta-tag deadline ${urgency}">⏰ ${days <= 0 ? 'Expired' : days + 'd left'}</span>
    </div>
    <div class="job-sites-row">
      <span style="font-size:0.7rem;color:var(--text-muted);">Listed on:</span>
      ${j.sites.map(s => `<span class="site-badge ${SITE_CLASSES[s]}">${s}</span>`).join('')}
      <span class="sites-count">${j.sites.length} platform${j.sites.length>1?'s':''}</span>
    </div>
  </div>`;
}

function renderPagination() {
  const p = document.getElementById('pagination');
  let html = `<button class="page-btn" data-page="prev" }>‹</button>`;
  html += `<button class="page-btn" data-page="next"}>›</button>`;
  p.innerHTML = html;
}

// Event delegation
document.getElementById('pagination').addEventListener('click', (e) => {
  const btn = e.target.closest('.page-btn');
  if (!btn) return; 

  let page = btn.dataset.page;

  if (page === 'prev'){
    if (currentPage <= 0) {
      currentPage -= 1;
    }
  }
  else if (page === 'next') {
    currentPage += 1;
  }
  else page = Number(currentPage);

  goPage(currentPage);
});

async function goPage(n) {
  JOBS = await get_jobs(n);
  filteredJobs = [...JOBS];
  filterJobs();
  currentPage = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setView(v) {
  currentView = v;
  renderJobs();
}

// ═══════════════════════════════════════════════════════════════
// JOB EVALUATION
// ═══════════════════════════════════════════════════════════════
function initEvaluation() {
  const sel = document.getElementById('evalJobSelect');
  if (!sel.options.length) {
    JOBS.forEach(j => {
      const o = document.createElement('option');
      o.value = j.id; o.textContent = `${j.title} — ${j.company}`;
      sel.appendChild(o);
    });
  }
  loadEvaluation();
}

function openJobEval(id) {
  switchTab('evaluation', document.querySelectorAll('.nav-item')[1]);
  setTimeout(() => {
    document.getElementById('evalJobSelect').value = id;
    loadEvaluation();
  }, 50);
}

function loadEvaluation() {
  const id = parseInt(document.getElementById('evalJobSelect').value);
  const j = JOBS.find(x => x.id === id) || JOBS[0];

  document.getElementById('evalTitle').textContent = j.title;
  document.getElementById('evalCompany').textContent = j.company;

  // Info row
  document.getElementById('evalInfoRow').innerHTML = [
    `<span class="info-chip">⚡ ${j.type}</span>`,
    `<span class="info-chip">📍 ${j.location}</span>`,
    `<span class="info-chip">💰 ${j.payment}</span>`,
    `<span class="info-chip">🏭 ${j.field}</span>`,
  ].join('');

  // Sites badges
  document.getElementById('evalSitesBadges').innerHTML = j.sites.map(s =>
    `<span class="site-badge ${SITE_CLASSES[s]}">${s}</span>`).join('');
  document.getElementById('evalSitesCount').textContent = `Listed on ${j.sites.length} platform${j.sites.length>1?'s':''}`;

  // Requirements & Responsibilities
  document.getElementById('evalRequirements').innerHTML = j.minimum_requirements.map(r => `<li>${r}</li>`).join('');
  document.getElementById('evalResponsibilities').innerHTML = j.responsibilities.map(r => `<li>${r}</li>`).join('');

  // Quick facts
  document.getElementById('evalQuickFacts').innerHTML = [
    { icon: '📅', label: 'Posted', val: j.date_posted },
    { icon: '🏢', label: 'Posted By', val: j.posted_by },
    { icon: '📨', label: 'Apply Via', val: j.application_method.slice(0,30) },
    { icon: '🏷', label: 'Field', val: j.field },
  ].map(f => `
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:16px;">${f.icon}</span>
      <div>
        <div style="font-size:0.68rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">${f.label}</div>
        <div style="font-size:0.82rem;color:var(--c3);font-weight:500;">${f.val}</div>
      </div>
    </div>`).join('');

  // Deadline
  document.getElementById('evalDeadline').textContent = new Date(j.application_deadline).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  const d = daysUntil(j.application_deadline);
  document.getElementById('evalDaysLeft').textContent = d <= 0 ? '⚠ Deadline passed' : `${d} day${d>1?'s':''} remaining`;

  // Referral links
  document.getElementById('evalReferrals').innerHTML = j.sites.map(s => `
    <button class="btn btn-outline" style="justify-content:space-between;width:100%;" onclick="showToast('Redirecting to ${s}...')">
      <span><span class="site-badge ${SITE_CLASSES[s]}" style="margin-right:8px;">${s}</span> Apply Now</span>
      <span>↗</span>
    </button>`).join('');

  // Ring (demand based on sites)
  const demand = Math.round((j.sites.length / 6) * 100);
  const offset = 282.7 - (282.7 * demand / 100);
  document.getElementById('evalRingFill').setAttribute('stroke-dashoffset', offset);
  document.getElementById('evalRingVal').textContent = demand + '%';

  // Knowledge graph
  drawKnowledgeGraph(j);

  // Similar jobs
  const similar = JOBS.filter(x => x.id !== j.id && (x.field === j.field || x.type === j.type)).slice(0, 4);
  document.getElementById('similarJobs').innerHTML = similar.length
    ? similar.map(s => `
      <div class="job-card" onclick="document.getElementById('evalJobSelect').value=${s.id};loadEvaluation();" style="padding:14px;">
        <div class="job-title" style="font-size:0.9rem;">${s.title}</div>
        <div class="job-company">${s.company}</div>
        <div class="job-meta" style="margin-top:8px;">
          <span class="meta-tag type">${s.type}</span>
          <span class="sites-count">${s.sites.length} platform${s.sites.length>1?'s':''}</span>
        </div>
      </div>`).join('')
    : '<div class="text-muted text-sm">No similar jobs found.</div>';

  // Platform chart
  drawEvalPlatformChart(j);
}

function drawKnowledgeGraph(j) {
  const container = document.getElementById('knowledgeGraph');
  container.innerHTML = '';

  const nodes = [
    { label: j.title.split(' ').slice(0,2).join(' '), x: 50, y: 50, size: 64, color: 'var(--c1)', textColor: '#fff' },
    ...j.sites.slice(0,3).map((s, i) => ({ label: s, x: 18 + i * 28, y: 78, size: 44, color: 'var(--dark3)', textColor: 'var(--c2-light)', border: '1px solid var(--c1)' })),
    ...j.skills.slice(0,5).map((sk, i) => ({ label: sk, x: 10 + i * 20, y: 20, size: 38, color: 'rgba(245,146,146,0.18)', textColor: 'var(--c4)', border: '1px solid rgba(245,146,146,0.35)' })),
    { label: j.field, x: 80, y: 70, size: 50, color: 'rgba(131,142,217,0.2)', textColor: 'var(--c2-light)', border: '1px solid var(--c2)' },
  ];

  nodes.forEach((n, i) => {
    const el = document.createElement('div');
    el.className = 'graph-node';
    el.style.cssText = `left:${n.x}%;top:${n.y}%;width:${n.size}px;height:${n.size}px;background:${n.color};color:${n.textColor};border:${n.border||'none'};transform:translate(-50%,-50%);font-size:${n.size>50?'0.65rem':'0.58rem'};`;
    el.textContent = n.label;
    el.title = n.label;
    container.appendChild(el);
  });

  // Draw some edges (SVG overlay)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  const defs = `<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="rgba(131,142,217,0.4)"/></marker></defs>`;
  let lines = '';
  [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7]].forEach(([a,b]) => {
    if (!nodes[a] || !nodes[b]) return;
    lines += `<line x1="${nodes[a].x}%" y1="${nodes[a].y}%" x2="${nodes[b].x}%" y2="${nodes[b].y}%" stroke="rgba(131,142,217,0.25)" stroke-width="1" stroke-dasharray="4,4" marker-end="url(#arr)"/>`;
  });
  svg.innerHTML = defs + lines;
  container.appendChild(svg);
}

let evalChartInst = null;
function drawEvalPlatformChart(j) {
  const ctx = document.getElementById('evalPlatformChart');
  if (!ctx) return;
  if (evalChartInst) evalChartInst.destroy();
  const counts = SITES.map(s => j.sites.includes(s) ? Math.floor(Math.random()*40)+10 : 0);
  evalChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: SITES,
      datasets: [{
        label: 'Applications via Platform',
        data: counts,
        backgroundColor: SITES.map(s => j.sites.includes(s) ? 'rgba(101,125,196,0.7)' : 'rgba(101,125,196,0.12)'),
        borderColor: SITES.map(s => j.sites.includes(s) ? '#838ed9' : 'transparent'),
        borderWidth: 1, borderRadius: 6,
      }]
    },
    options: chartOpts('bar')
  });
}

// ═══════════════════════════════════════════════════════════════
// ANALYSIS CHARTS
// ═══════════════════════════════════════════════════════════════
function initAnalysisCharts() {
  if (chartsInitialized.analysis) return;
  chartsInitialized.analysis = true;

  // Platform bar
  const platforms = SITES;
  const platCounts = SITES.map(s => JOBS.filter(j => j.sites.includes(s)).length);
  new Chart(document.getElementById('platformBarChart'), {
    type: 'bar',
    data: {
      labels: platforms,
      datasets: [{
        label: 'Jobs Listed',
        data: platCounts,
        backgroundColor: ['#657dc4','#838ed9','#e84545','#22a86a','#ff6b35','#7b2d8b'],
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: chartOpts('bar')
  });

  // Field doughnut
  const fields = [...new Set(JOBS.map(j => j.field))];
  const fieldCounts = fields.map(f => JOBS.filter(j => j.field === f).length);
  new Chart(document.getElementById('fieldDoughnut'), {
    type: 'doughnut',
    data: {
      labels: fields,
      datasets: [{
        data: fieldCounts,
        backgroundColor: ['#657dc4','#838ed9','#f59292','#ece8e5','#22a86a','#ff6b35','#7b2d8b'],
        borderColor: 'var(--dark2)', borderWidth: 2,
      }]
    },
    options: { ...chartOpts('doughnut'), cutout: '65%' }
  });

  // Trend line
  const days = Array.from({length:30}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (29-i));
    return d.toLocaleDateString('en-GB', {day:'numeric',month:'short'});
  });
  const trendData = days.map((_,i) => Math.floor(3 + Math.sin(i/3)*2 + Math.random()*3));
  new Chart(document.getElementById('trendLineChart'), {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'New Postings',
        data: trendData,
        borderColor: '#838ed9',
        backgroundColor: 'rgba(131,142,217,0.1)',
        fill: true,
        tension: 0.4, pointRadius: 2, pointBackgroundColor: '#657dc4',
      }]
    },
    options: chartOpts('line')
  });

  // Type radar
  const jobTypes = ['Full-time','Part-time','Contract','Remote','Internship'];
  const typeCounts = jobTypes.map(t => JOBS.filter(j => j.type === t).length);
  new Chart(document.getElementById('typeRadarChart'), {
    type: 'radar',
    data: {
      labels: jobTypes,
      datasets: [{
        label: 'Jobs Count',
        data: typeCounts,
        backgroundColor: 'rgba(101,125,196,0.2)',
        borderColor: '#838ed9',
        pointBackgroundColor: '#657dc4',
        borderWidth: 2,
      }]
    },
    options: { ...chartOpts('radar'), scales: { r: { ticks: { color: '#8b8fa8', font: { size: 10 } }, grid: { color: 'rgba(101,125,196,0.15)' }, pointLabels: { color: '#ece8e5', font: { size: 11 } } } } }
  });

  // Top skills
  const allSkills = JOBS.flatMap(j => j.skills || []);
  const skillCount = {};
  allSkills.forEach(s => skillCount[s] = (skillCount[s]||0)+1);
  const topSkills = Object.entries(skillCount).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxCount = topSkills[0]?.[1] || 1;
  document.getElementById('topSkillsBars').innerHTML = topSkills.map(([skill, count]) => `
    <div class="progress-wrap">
      <div class="progress-label-row">
        <span class="progress-label">${skill}</span>
        <span class="progress-val">${count} jobs</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${(count/maxCount*100).toFixed(0)}%"></div>
      </div>
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// SUITABILITY
// ═══════════════════════════════════════════════════════════════
function addSuitSkill(e) {
  if (e.key !== 'Enter') return;
  const inp = document.getElementById('suitSkillInput');
  const val = inp.value.trim();
  if (!val || suitSkills.includes(val)) { inp.value=''; return; }
  suitSkills.push(val);
  inp.value = '';
  renderSuitSkills();
}

function removeSuitSkill(s) {
  suitSkills = suitSkills.filter(x => x !== s);
  renderSuitSkills();
}

function renderSuitSkills() {
  document.getElementById('suitSkillsList').innerHTML = suitSkills.map(s => `
    <div class="skill-chip">
      <span>${s}</span>
      <span class="chip-remove" onclick="removeSuitSkill('${s}')">✕</span>
    </div>`).join('');
}

function runSuitability() {
  if (!suitSkills.length) {
    showToast('⚠ Please add at least one skill');
    return;
  }

  const results = JOBS.map(j => {
    const jobSkills = j.skills || [];
    const matched = suitSkills.filter(s => jobSkills.some(js => js.toLowerCase().includes(s.toLowerCase())));
    const compat = Math.round((matched.length / Math.max(suitSkills.length, 1)) * 100);
    return { ...j, matched, compat };
  }).filter(j => j.compat > 0).sort((a,b) => b.compat - a.compat);

  const cont = document.getElementById('suitResults');
  if (!results.length) {
    cont.innerHTML = `<div class="empty-state"><div class="empty-icon">😕</div><div class="empty-title">No matches found</div><div class="empty-text">Try adding more or different skills</div></div>`;
    return;
  }

  cont.innerHTML = `
    <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;">
      <span class="text-sm text-muted">Found <strong style="color:var(--c2-light)">${results.length}</strong> matching jobs</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;">
      ${results.map(j => suitabilityCardHTML(j)).join('')}
    </div>`;
}

function suitabilityCardHTML(j) {
  const color = j.compat >= 70 ? 'var(--c2-light)' : j.compat >= 40 ? 'var(--c4)' : 'var(--text-muted)';
  const emoji = j.compat >= 70 ? '🟢' : j.compat >= 40 ? '🟡' : '🔴';
  return `
  <div class="card" style="border-left:3px solid ${color};">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">
      <div style="flex:1">
        <div class="job-title" style="font-size:0.95rem;cursor:pointer;" onclick="openJobEval(${j.id})">${j.title}</div>
        <div class="job-company">${j.company} · ${j.location}</div>
      </div>
      <div style="text-align:center;flex-shrink:0;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:1.4rem;font-weight:700;color:${color};">${j.compat}%</div>
        <div style="font-size:0.65rem;color:var(--text-muted);">${emoji} Compat.</div>
      </div>
    </div>
    <div class="progress-wrap mt-2">
      <div class="progress-bar"><div class="progress-fill${j.compat<40?' accent':''}" style="width:${j.compat}%"></div></div>
    </div>
    <div style="margin-top:10px;">
      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:6px;">Matched skills:</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">
        ${j.matched.map(s => `<span class="skill-chip" style="font-size:0.65rem;padding:2px 8px;">${s}</span>`).join('')}
      </div>
    </div>
    <div class="job-meta" style="margin-top:10px;">
      <span class="meta-tag type">${j.type}</span>
      <span class="meta-tag salary">${j.payment.slice(0,22)}</span>
      <span class="sites-count">${j.sites.length} platform${j.sites.length>1?'s':''}</span>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000*60*60*24));
}

function chartOpts(type) {
  const base = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#ece8e5', font: { family:'DM Sans', size:11 }, boxWidth:12 } },
      tooltip: { backgroundColor:'#252840', titleColor:'#fff', bodyColor:'#ece8e5', borderColor:'rgba(101,125,196,0.3)', borderWidth:1 }
    },
  };
  if (type === 'bar' || type === 'line') {
    base.scales = {
      x: { ticks: { color: '#8b8fa8', font:{size:10} }, grid: { color: 'rgba(101,125,196,0.08)' } },
      y: { ticks: { color: '#8b8fa8', font:{size:10} }, grid: { color: 'rgba(101,125,196,0.08)' } }
    };
  }
  return base;
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ═══════════════════════════════════════════════════════════════
// EVENT LISTENERS (replaces all inline onclicks in HTML)
// ═══════════════════════════════════════════════════════════════
function handleClickEvents() {

  // ── Sidebar nav items ──────────────────────────────────────
  // switchTab('directory'|'evaluation'|'analysis'|'suitability', this)
  document.querySelectorAll('.nav-item[data-tab]').forEach(el => {
    el.addEventListener('click', () => switchTab(el.dataset.tab, el));
  });

  // switchTab for "← Browse Jobs" button inside evaluation tab
  document.querySelector('#tab-evaluation .btn-outline')
    .addEventListener('click', () => switchTab('directory', document.querySelector('.nav-item[data-tab="directory"]')));

  // ── Sidebar: Bookmarks & Alerts ────────────────────────────
  document.querySelector('.nav-item[data-action="bookmarks"]')
    .addEventListener('click', () => showToast('Bookmarks coming soon!'));
  document.querySelector('.nav-item[data-action="alerts"]')
    .addEventListener('click', () => showToast('Alerts coming soon!'));

  // ── Sidebar toggle ─────────────────────────────────────────
  document.querySelector('.sidebar-toggle')
    .addEventListener('click', toggleSidebar);

  // ── Topbar icon buttons ────────────────────────────────────
  const topBtns = document.querySelectorAll('.topbar-right .icon-btn');
  topBtns[0].addEventListener('click', () => showToast('Refreshing job listings...'));
  topBtns[1].addEventListener('click', () => showToast('Export functionality coming soon!'));
  topBtns[2].addEventListener('click', () => showToast('Settings coming soon!'));

  // ── Directory: search + filters ───────────────────────────
  document.getElementById('dirSearch').addEventListener('input', filterJobs);
  document.getElementById('filterField').addEventListener('change', filterJobs);
  document.getElementById('filterType').addEventListener('change', filterJobs);
  document.getElementById('filterSite').addEventListener('change', filterJobs);
  document.getElementById('filterSort').addEventListener('change', filterJobs);

  // ── Directory: grid / list view toggle ────────────────────
  const viewBtns = document.querySelectorAll('#tab-directory .icon-btn');
  viewBtns[0].addEventListener('click', () => setView('grid'));
  viewBtns[1].addEventListener('click', () => setView('list'));

  // ── Evaluation: job select dropdown ───────────────────────
  document.getElementById('evalJobSelect').addEventListener('change', loadEvaluation);

  // ── Suitability: skill input (Enter key) ──────────────────
  document.getElementById('suitSkillInput').addEventListener('keydown', addSuitSkill);

  // ── Suitability: Find Matching Jobs button ─────────────────
  document.querySelector('#tab-suitability .btn-primary')
    .addEventListener('click', runSuitability);
}

// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
async function Init() {
  handleClickEvents();
  JOBS = await get_jobs(currentPage);
  filteredJobs = [...JOBS];
  filterJobs();
}

Init()
