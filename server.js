import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.static(__dirname));

const USERNAME = 'karansin8672';
const LEETCODE_GQL = 'https://leetcode.com/graphql';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — avoid hammering LeetCode

let statsCache = { data: null, ts: 0 };
let topicsCache = { data: null, ts: 0 };

async function queryLeetCode(query, variables) {
  const res = await fetch(LEETCODE_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://leetcode.com',
      'User-Agent': 'Mozilla/5.0 (compatible; PortfolioBot/1.0)'
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`LeetCode responded with ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// ------------------------------------------------------------------
// GET /api/leetcode-stats -> { totalSolved, easySolved, mediumSolved, hardSolved, source }
// ------------------------------------------------------------------
app.get('/api/leetcode-stats', async (req, res) => {
  try {
    if (statsCache.data && Date.now() - statsCache.ts < CACHE_TTL_MS) {
      return res.json(statsCache.data);
    }
    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          submitStatsGlobal {
            acSubmissionNum { difficulty count }
          }
        }
      }`;
    const data = await queryLeetCode(query, { username: USERNAME });
    if (!data.matchedUser) throw new Error('username not found on LeetCode');
    const nums = data.matchedUser.submitStatsGlobal.acSubmissionNum;
    const result = {
      totalSolved: nums.find(n => n.difficulty === 'All')?.count ?? 0,
      easySolved: nums.find(n => n.difficulty === 'Easy')?.count ?? 0,
      mediumSolved: nums.find(n => n.difficulty === 'Medium')?.count ?? 0,
      hardSolved: nums.find(n => n.difficulty === 'Hard')?.count ?? 0,
      source: 'live'
    };
    statsCache = { data: result, ts: Date.now() };
    res.json(result);
  } catch (err) {
    console.error('[leetcode-stats] falling back:', err.message);
    // Honest fallback — last known real number, clearly labelled as not live.
    res.json({
      totalSolved: 243,
      easySolved: null,
      mediumSolved: null,
      hardSolved: null,
      source: 'fallback',
      error: err.message
    });
  }
});

// ------------------------------------------------------------------
// GET /api/leetcode-topics -> { topics: [{ tagName, tagSlug, problemsSolved }], source }
// Note: LeetCode's public API gives solved-count per tag, not a
// reliable "total problems in this tag" figure — so we size bubbles
// by solved count, not by a solved/total ratio. Don't fake the ratio.
// ------------------------------------------------------------------
app.get('/api/leetcode-topics', async (req, res) => {
  try {
    if (topicsCache.data && Date.now() - topicsCache.ts < CACHE_TTL_MS) {
      return res.json(topicsCache.data);
    }
    const query = `
      query skillStats($username: String!) {
        matchedUser(username: $username) {
          tagProblemCounts {
            advanced { tagName tagSlug problemsSolved }
            intermediate { tagName tagSlug problemsSolved }
            fundamental { tagName tagSlug problemsSolved }
          }
        }
      }`;
    const data = await queryLeetCode(query, { username: USERNAME });
    if (!data.matchedUser) throw new Error('username not found on LeetCode');
    const groups = data.matchedUser.tagProblemCounts;
    const topics = [...groups.fundamental, ...groups.intermediate, ...groups.advanced]
      .filter(t => t.problemsSolved > 0)
      .sort((a, b) => b.problemsSolved - a.problemsSolved);
    const result = { topics, source: 'live' };
    topicsCache = { data: result, ts: Date.now() };
    res.json(result);
  } catch (err) {
    console.error('[leetcode-topics] falling back:', err.message);
    res.json({ topics: [], source: 'fallback', error: err.message });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portfolio + backend running on port ${PORT}`);
});