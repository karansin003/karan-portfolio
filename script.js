// ============================================================
// Theme toggle
// ============================================================
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

const savedTheme = localStorage.getItem('kk-theme');
root.setAttribute('data-theme', savedTheme || 'dark');

themeToggle.addEventListener('click', () => {
  const next =
    root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';

  root.setAttribute('data-theme', next);
  localStorage.setItem('kk-theme', next);
});


// ============================================================
// Mobile navigation
// ============================================================
const navLinks = document.getElementById('navLinks');
const navMobileToggle = document.getElementById('navMobileToggle');

navMobileToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});


// ============================================================
// Scroll reveal
// ============================================================
const revealEls = document.querySelectorAll('.reveal');

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15
  }
);

revealEls.forEach((el) => io.observe(el));


// ============================================================
// Scroll cue
// ============================================================
document.getElementById('scrollCue').addEventListener('click', () => {
  document.getElementById('about').scrollIntoView({
    behavior: 'smooth'
  });
});


// ============================================================
// Helper: CSS variables
// ============================================================
function getVar(name) {
  return getComputedStyle(root)
    .getPropertyValue(name)
    .trim();
}


// ============================================================
// Hero graph visualizer
// ============================================================
const canvas = document.getElementById('graph-canvas');
const ctx = canvas.getContext('2d');

let W;
let H;
let nodes = [];
let edges = [];

function resizeCanvas() {
  W = canvas.width = canvas.offsetWidth * devicePixelRatio;
  H = canvas.height = canvas.offsetHeight * devicePixelRatio;

  ctx.setTransform(
    devicePixelRatio,
    0,
    0,
    devicePixelRatio,
    0,
    0
  );
}

function initGraph() {
  const area = W * H;

  const count = Math.max(
    24,
    Math.min(70, Math.round(area / 55000))
  );

  nodes = [];

  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.8 + 1.4,
      pulse: Math.random() * Math.PI * 2
    });
  }

  buildEdges();
}

function buildEdges() {
  const neighborCount = 3;
  const edgeSet = new Set();

  edges = [];

  nodes.forEach((node, i) => {
    const distances = nodes
      .map((other, j) => ({
        j,
        d:
          i === j
            ? Infinity
            : Math.hypot(
                node.x - other.x,
                node.y - other.y
              )
      }))
      .sort((a, b) => a.d - b.d)
      .slice(0, neighborCount);

    distances.forEach(({ j }) => {
      const key =
        i < j ? `${i}-${j}` : `${j}-${i}`;

      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push([i, j]);
      }
    });
  });
}

let activeEdge = 0;
let edgeTimer = 0;
let recomputeTimer = 0;

function drawGraph() {
  ctx.clearRect(0, 0, W, H);

  const accent = getVar('--accent');
  const edgeColor = getVar('--edge');

  nodes.forEach((node) => {
    node.x += node.vx;
    node.y += node.vy;
    node.pulse += 0.02;

    if (node.x < 0 || node.x > W) {
      node.vx *= -1;
    }

    if (node.y < 0 || node.y > H) {
      node.vy *= -1;
    }
  });

  edges.forEach((edge, index) => {
    const a = nodes[edge[0]];
    const b = nodes[edge[1]];

    const isActive = index === activeEdge;

    ctx.strokeStyle = isActive
      ? accent
      : edgeColor;

    ctx.globalAlpha = isActive ? 0.95 : 0.4;
    ctx.lineWidth = isActive ? 1.6 : 0.7;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;

  nodes.forEach((node) => {
    const glow =
      1 + Math.sin(node.pulse) * 0.4;

    ctx.beginPath();
    ctx.fillStyle = edgeColor;

    ctx.arc(
      node.x,
      node.y,
      node.r * glow,
      0,
      Math.PI * 2
    );

    ctx.fill();
  });

  edgeTimer++;

  if (edgeTimer > 40 && edges.length > 0) {
    edgeTimer = 0;
    activeEdge =
      Math.floor(Math.random() * edges.length);
  }

  recomputeTimer++;

  if (recomputeTimer > 90) {
    recomputeTimer = 0;
    buildEdges();
  }

  requestAnimationFrame(drawGraph);
}

function setupCanvas() {
  resizeCanvas();
  initGraph();
}

window.addEventListener('resize', setupCanvas);

setupCanvas();
requestAnimationFrame(drawGraph);


// ============================================================
// Project decorative canvases
// ============================================================
document
  .querySelectorAll('.proj-canvas')
  .forEach((c) => {
    const pctx = c.getContext('2d');

    function resize() {
      c.width = c.offsetWidth * devicePixelRatio;
      c.height = c.offsetHeight * devicePixelRatio;
    }

    resize();

    window.addEventListener('resize', resize);

    const variant = c.dataset.variant;

    let t = 0;

    function render() {
      const w = c.width;
      const h = c.height;

      pctx.clearRect(0, 0, w, h);

      const accent = getVar('--accent');
      const edge = getVar('--edge');

      t += 0.01;

      if (variant === 'grid') {
        const cols = 6;
        const rows = 4;

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const val =
              (Math.sin(
                t + i * 0.5 + j * 0.7
              ) +
                1) /
              2;

            pctx.globalAlpha =
              0.15 + val * 0.55;

            pctx.fillStyle =
              val > 0.7 ? accent : edge;

            pctx.fillRect(
              w * 0.1 +
                i * (w * 0.8 / cols),
              h * 0.1 +
                j * (h * 0.8 / rows),
              w * 0.8 / cols - 6,
              h * 0.8 / rows - 6
            );
          }
        }

        pctx.globalAlpha = 1;
      }

      if (variant === 'table') {
        const rows = 6;

        for (let i = 0; i < rows; i++) {
          const y =
            h * 0.15 +
            i * (h * 0.7 / rows);

          pctx.globalAlpha =
            i === 2 ? 0.9 : 0.28;

          pctx.strokeStyle =
            i === 2 ? accent : edge;

          pctx.lineWidth =
            i === 2 ? 1.6 : 0.8;

          pctx.beginPath();
          pctx.moveTo(w * 0.1, y);
          pctx.lineTo(w * 0.9, y);
          pctx.stroke();
        }

        pctx.globalAlpha = 1;
      }

      requestAnimationFrame(render);
    }

    render();
  });


// ============================================================
// Live LeetCode data
// ============================================================
const API_BASE = window.location.origin;

const countEl =
  document.getElementById('leetcodeCount');

const sourceEl =
  document.getElementById('dataSourceTag');

async function loadStats() {
  try {
    const res = await fetch(
      `${API_BASE}/api/leetcode-stats`,
      {
        cache: 'no-store'
      }
    );

    if (!res.ok) {
      throw new Error('Backend not reachable');
    }

    const data = await res.json();

    animateCount(
      countEl,
      data.totalSolved ?? 243
    );

    if (data.source === 'live') {
      sourceEl.textContent =
        'source: live (leetcode.com)';

      sourceEl.classList.add('live');
    } else {
      sourceEl.textContent =
        'source: fallback — backend reachable but LeetCode call failed';
    }
  } catch (error) {
    console.error('LeetCode stats error:', error);

    animateCount(countEl, 243);

    sourceEl.textContent =
      'source: static fallback — backend not running';
  }
}

function animateCount(element, target) {
  let current = 0;

  const step = Math.max(
    1,
    Math.ceil(target / 60)
  );

  const interval = setInterval(() => {
    current += step;

    if (current >= target) {
      current = target;
      clearInterval(interval);
    }

    element.textContent = current;
  }, 20);
}

loadStats();


// ============================================================
// LeetCode Topics
// ============================================================
async function loadTopics() {
  const container =
    document.getElementById('topicBubbles');

  try {
    const res = await fetch(
      `${API_BASE}/api/leetcode-topics`,
      {
        cache: 'no-store'
      }
    );

    if (!res.ok) {
      throw new Error(
        'Backend not reachable'
      );
    }

    const data = await res.json();

    if (
      !data.topics ||
      data.topics.length === 0
    ) {
      throw new Error(
        'No topic data available'
      );
    }

    renderBubbles(
      container,
      data.topics
    );
  } catch (error) {
    console.error(
      'LeetCode topics error:',
      error
    );

    // Keep the fallback message already present in HTML.
  }
}


// ============================================================
// Render topic bubbles
// ============================================================
function renderBubbles(
  container,
  topics
) {
  container.innerHTML = '';

  const w = container.clientWidth;
  const h = container.clientHeight;

  const cx = w / 2;
  const cy = h / 2;

  const maxSolved = Math.max(
    ...topics.map(
      (topic) => topic.problemsSolved
    )
  );

  const sorted = [...topics]
    .sort(
      (a, b) =>
        b.problemsSolved -
        a.problemsSolved
    )
    .slice(0, 40);

  const placed = [];

  sorted.forEach((topic) => {
    const r =
      14 +
      Math.sqrt(
        topic.problemsSolved /
          maxSolved
      ) *
        (w < 600 ? 42 : 58);

    const position =
      findSpiralPosition(
        cx,
        cy,
        r,
        placed,
        w,
        h
      );

    placed.push({
      ...position,
      r,
      topic
    });
  });

  const tooltip =
    document.getElementById(
      'bubbleTooltip'
    );

  placed.forEach((item) => {
    const bubble =
      document.createElement('div');

    bubble.className = 'bubble';

    bubble.setAttribute(
      'aria-label',
      `${item.topic.tagName} — ${item.topic.problemsSolved} solved`
    );

    const intensity =
      0.25 +
      (item.topic.problemsSolved /
        maxSolved) *
        0.65;

    bubble.style.width =
      `${item.r * 2}px`;

    bubble.style.height =
      `${item.r * 2}px`;

    bubble.style.left =
      `${item.x - item.r}px`;

    bubble.style.top =
      `${item.y - item.r}px`;

    bubble.style.background =
      `color-mix(in srgb, var(--accent) ${Math.round(
        intensity * 100
      )}%, var(--bg-card))`;

    bubble.style.fontSize =
      `${Math.max(
        9,
        Math.min(
          13,
          item.r / 4
        )
      )}px`;

    bubble.textContent =
      item.r >
      (w < 600 ? 30 : 24)
        ? item.topic.tagName
        : '';

    bubble.addEventListener(
      'mousemove',
      (event) => {
        tooltip.textContent =
          `${item.topic.tagName} — ${item.topic.problemsSolved} solved`;

        const rect =
          container.getBoundingClientRect();

        tooltip.style.left =
          `${event.clientX -
            rect.left +
            14}px`;

        tooltip.style.top =
          `${event.clientY -
            rect.top -
            10}px`;

        tooltip.classList.add('show');
      }
    );

    bubble.addEventListener(
      'mouseleave',
      () => {
        tooltip.classList.remove(
          'show'
        );
      }
    );

    container.appendChild(bubble);
  });
}


// ============================================================
// Spiral positioning for topic bubbles
// ============================================================
function findSpiralPosition(
  cx,
  cy,
  r,
  placed,
  boundW,
  boundH
) {
  if (placed.length === 0) {
    return {
      x: cx,
      y: cy
    };
  }

  let angle = 0;
  let radius = 4;

  const step = 4;

  for (let i = 0; i < 4000; i++) {
    angle += 0.35;

    radius +=
      step / (angle + 1) +
      0.4;

    const x =
      cx +
      radius *
        Math.cos(angle);

    const y =
      cy +
      radius *
        Math.sin(angle) *
        0.72;

    if (
      x - r < 4 ||
      x + r > boundW - 4 ||
      y - r < 4 ||
      y + r > boundH - 4
    ) {
      continue;
    }

    const overlaps =
      placed.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;

        return (
          Math.sqrt(
            dx * dx +
              dy * dy
          ) <
          p.r + r + 3
        );
      });

    if (!overlaps) {
      return {
        x,
        y
      };
    }
  }

  return {
    x: cx,
    y: cy
  };
}

loadTopics();


// ============================================================
// Contact CTA
// ============================================================
const toast =
  document.getElementById('toast');

function showToast(message) {
  toast.textContent = message;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove(
      'show'
    );
  }, 3200);
}

document
  .getElementById('contactCta')
  .addEventListener(
    'click',
    function (event) {
      event.preventDefault();

      const email =
        'karansin8672@gmail.com';

      try {
        window.location.href =
          'mailto:' + email;
      } catch (error) {
        // Ignore mail client errors.
      }

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        navigator.clipboard
          .writeText(email)
          .then(() => {
            showToast(
              `Opening your mail app — email also copied: ${email}`
            );
          })
          .catch(() => {
            showToast(
              `Email: ${email}`
            );
          });
      } else {
        showToast(
          `Email: ${email}`
        );
      }
    }
  );