import { get_jobs,get_job_evaluation,get_market_analysis,fetch_job_recommendations,search_jobs } from "./fetch_functions.js";

// ═══════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════
const SITES = ['LinkedIn','Indeed','BrighterMonday','JobWebKenya','Fuzu','Pigiame'];
const SITE_CLASSES = {
  LinkedIn:'site-linkedin',Indeed:'site-indeed',BrighterMonday:'site-brightermonday',
  JobWebKenya:'site-jobwebkenya',Fuzu:'site-fuzu',Pigiame:'site-pigiame'
};

let JOBS = [];
let JOBS_ACC = [];


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
async function search_jobs_data(){
  const q = document.getElementById('dirSearch').value.toLowerCase();

  const data = await search_jobs(q);

  filteredJobs = [...data.results];
  
  
  renderJobs();
}


function filterJobs() {
  const q = document.getElementById('dirSearch').value.toLowerCase();
  const field = document.getElementById('filterField').value;
  const type = document.getElementById('filterType').value;
  const site = document.getElementById('filterSite').value;
  const sort = document.getElementById('filterSort').value;

  filteredJobs = JOBS.filter(j => {
    const matchQ = !q || j.title.toLowerCase().includes(q);// || j.company.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
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
  const pageJobs = filteredJobs;//const pageJobs = filteredJobs.slice(start, start + JOBS_PER_PAGE);

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

// event delegation
const grid = document.getElementById('jobGrid');

grid.addEventListener('click', function(e) {
    // Find the closest job-card ancestor of the clicked element
    const card = e.target.closest('.job-card');
    if (!card || !grid.contains(card)) return;

    const jobId = card.dataset.id;
    if (jobId) {
        openJobEval(jobId); // call your function with the job ID
    }
});

function jobCardHTML(j) {
  const featured = j.sites.length >= 3;
  const days = daysUntil(j.application_deadline);
  const urgency = days <= 5 ? 'text-danger' : days <= 14 ? '' : 'text-muted';
  return `
  <div class="job-card${featured?' featured':''}" data-id="${j.id}">
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
      <span class="meta-tag salary">💰 ${j.payment?.length > 22 ? j.payment.slice(0,22)+'…' : j.payment}</span>
      <span class="meta-tag deadline ${urgency}">⏰ ${days <= 0 ? 'Expired' : days + 'd left'}</span>
    </div>
    <div class="job-sites-row">
      <span style="font-size:0.7rem;color:var(--text-muted);">Listed on:</span>
      ${j.sites?.map(s => `<span class="site-badge ${SITE_CLASSES[s]}">${s}</span>`).join('')}
      <span class="sites-count">${j.sites?.length} platform${j.sites?.length>1?'s':''}</span>
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
  sel.innerHTML = "";
  if (!sel.options.length) {
    JOBS.forEach(j => {
      const o = document.createElement('option');
      o.value = j.id; o.textContent = `${j.title} — ${j.company || ""}`;
      sel.appendChild(o);
    });
  }
  loadEvaluation();
}

function openJobEval(id) {
  initEvaluation()
  switchTab('evaluation', document.querySelectorAll('.nav-item')[1]);
  setTimeout(() => {
    document.getElementById('evalJobSelect').value = id;
    loadEvaluation();
  }, 50);
}

async function loadEvaluation() {
  const id = parseInt(document.getElementById('evalJobSelect').value);
  const j = JOBS.find(x => x.id === id) || JOBS[0];
  
  const data = await get_job_evaluation(Number(id));
  console.log(data);
  

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
    { icon: '📅', label: 'Posted', val: j.date_posted || 'Unavailable'},
    { icon: '🏢', label: 'Posted By', val: j.posted_by || "Unavailable"},
    { icon: '📨', label: 'Apply Via', val: j.application_method?.slice(0,30) || 'Unavailable' },
    { icon: '🏷', label: 'Field', val: j.field ||"Unavailable" },
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
  document.getElementById('evalReferrals').innerHTML = `
    <button class="btn btn-outline" style="justify-content:space-between;width:100%;">
      <span><span class="site-badge ${SITE_CLASSES[0]}" style="margin-right:8px;">${j.url}</span> Apply Now</span>
      <span>↗</span>
    </button>`;

  // Ring (demand based on sites)
  const demand = Number(data.demand);
  const offset = 282.7 - (282.7 * demand / 100);
  document.getElementById('evalRingFill').setAttribute('stroke-dashoffset', offset);
  document.getElementById('evalRingVal').textContent = demand + '%';

  // Knowledge graph
  drawKnowledgeGraph(j.kgraph);

  // Similar jobs
  // const similar = JOBS.filter(x => x.id !== j.id && (x.field === j.field || x.type === j.type)).slice(0, 4);
  document.getElementById('similarJobs').innerHTML = data.similar_jobs.length
    ? data.similar_jobs.map(s => `
      <div class="job-card" onclick="document.getElementById('evalJobSelect').value=${s.id};loadEvaluation();" style="padding:14px;">
        <div class="job-title" style="font-size:0.9rem;">${s.title}</div>
        <div class="job-company">${s.company}</div>
        <div class="job-meta" style="margin-top:8px;">
          <span class="meta-tag type">${s.type}</span>
          
        </div>
      </div>`).join('')
    : '<div class="text-muted text-sm">No similar jobs found.</div>';

  // Platform chart
  drawEvalPlatformChart(j);
}

function drawKnowledgeGraph(j) {
   if (!j) { // null or undefined
    console.warn("No graph data to draw");
    return;
  }

  let graphData;
  try {
    graphData = typeof j === "string" ? JSON.parse(j) : j; // parse if string
  } catch (err) {
    console.error("Failed to parse JSON:", err, j);
    return;
  }

  const nodes = graphData.nodes.map(d => ({ id: d.id, type: d.type }));
  const links = graphData.edges.map(l => ({ source: l.source, target: l.target }));

  const container = document.getElementById("knowledgeGraph");
  container.innerHTML = "";

  const width = container.clientWidth;
  const height = container.clientHeight;

  const svg = d3.select("#knowledgeGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(120))
    .force("charge", d3.forceManyBody().strength(-250))
    .force("center", d3.forceCenter(width / 2, height / 2));

  // Draw edges
  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6);

  // Draw nodes
  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", d => d.type === "job" ? 20 : 10)
    .attr("fill", d => d.type === "job" ? "#ff6b6b" : "#6c8cff")
    .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  // Labels
  const labels = svg.append("g")
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .text(d => d.id)
    .attr("font-size", "11px")
    .attr("dx", 12)
    .attr("dy", ".35em");

  simulation.on("tick", () => {

      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
  });

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

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
function generateColors(n) {
  const colors = [];

  for (let i = 0; i < n; i++) {
    const color = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    colors.push(color);
  }

  return colors;
}


async function initAnalysisCharts() {
  if (chartsInitialized.analysis) return;
  chartsInitialized.analysis = true;

  const data = await get_market_analysis();
  setMarketanalysisData(data);

  // Platform bar
  const platforms = Object.keys(data.job_per_platform);
  const platCounts = Object.values(data.job_per_platform);
  new Chart(document.getElementById('platformBarChart'), {
    type: 'bar',
    data: {
      labels: platforms,
      datasets: [{
        label: 'Jobs Listed',
        data: platCounts,
        backgroundColor: generateColors(Number(platCounts.length)),
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: chartOpts('bar')
  });

  // Field doughnut
  const fields = Object.keys(data.jobs_per_fields);
  const fieldCounts = Object.values(data.jobs_per_fields);
  new Chart(document.getElementById('fieldDoughnut'), {
    type: 'doughnut',
    data: {
      labels: fields,
      datasets: [{
        data: fieldCounts,
        backgroundColor: generateColors(Number(fieldCounts.length)),
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
  const jobTypes = Object.keys(data.job_types_distr);
  const typeCounts = Object.values(data.job_types_distr);
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
  const topSkills = Object.entries(data.top_skills)
    .sort((a,b) => b[1] - a[1]);
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

function setMarketanalysisData(data) {
  document.getElementById('activ-stat').innerHTML = data.active_jobs;
  document.getElementById("plat-stat").innerHTML = data.platforms_tracked;
  document.getElementById("multi-val").innerHTML = data.multi_listed;
  document.getElementById("avg-dl").innerHTML = data.avg_deadline; 
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
      <span class="chip-remove" data-skill="${s}">✕</span>
    </div>
  `).join('');
}


// event delegation
document.getElementById("suitSkillsList").addEventListener("click", function(e) {

  if (e.target.classList.contains("chip-remove")) {

    const skill = e.target.dataset.skill;
    removeSuitSkill(skill);

  }
});

async function run_job_recommendations() {
  let ed_level = document.getElementById("ed-level").value;
  let experience_years = document.getElementById('suitExp').value;
  let job_type = document.getElementById("job-type").value;
  let location = document.getElementById('suitLocation').value;

  if (!suitSkills.length) {
    showToast('⚠ Please add at least one skill');
    return;
  }

  const candidate_data = {
      skill:suitSkills,
      experience:experience_years || null,
      job_type:job_type || null,
      location:location || null,
      education_level:ed_level || null
  }

  const data_recv = await fetch_job_recommendations(candidate_data);

  runSuitability(data_recv.recommendations);
  
}

function runSuitability(data) {
  if (!suitSkills.length) {
    showToast('⚠ Please add at least one skill');
    return;
  }

  const results = data;

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
  <div class="card" style="border-left:3px solid ${color};" data-id="${j.id}">
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
    </div>
  </div>`;
}

// event_delegation
const sutabilityCont = document.getElementById('suitResults');

sutabilityCont.addEventListener('click', function(e) {
    // Find the closest job-card ancestor of the clicked element
    const card = e.target.closest('.card');
    if (!card || !sutabilityCont.contains(card)) return;

    const jobId = card.dataset.id;
    if (jobId) {
        openJobEval(jobId);
    }
});


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
  document.getElementById('dirSearch').addEventListener('keydown', async(event) => {
      if (event.key === 'Enter') await search_jobs_data();
    }
  );
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
    .addEventListener('click', run_job_recommendations);
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
