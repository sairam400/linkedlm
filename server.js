import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const envFile = join(root, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}
const port = Number(process.env.PORT || 4173);
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
  res.end(JSON.stringify(body));
}

async function body(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 25_000) throw new Error('Request too large'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString() || '{}');
}

function fallbackPost(topic, tone, goal) {
  const subject = String(topic || 'a lesson from this week').trim().replace(/[.!]+$/, '');
  const hooks = { Bold:`Most people underestimate ${subject.toLowerCase()}.\n\nThat is a mistake.`, Conversational:`Can I share something I wish I had learned earlier?\n\n${subject}.`, Educational:`Three practical lessons about ${subject.toLowerCase()}:`, Thoughtful:`Here is something I have been thinking about lately:\n\n${subject}.` };
  const close = goal === 'Spark conversation' ? 'What has your experience taught you?' : goal === 'Grow my network' ? 'I would love to hear how others approach this.' : 'The lesson: expertise earns attention, but curiosity earns trust.';
  return `${hooks[tone] || hooks.Thoughtful}\n\nCuriosity is not indecision. It is the discipline to pause long enough to notice what everyone else missed.\n\nThe strongest leaders I know consistently:\n\n→ Ask before they assume\n→ Listen to understand, not respond\n→ Stay open to being wrong\n\n${close}\n\n#Leadership #GrowthMindset #FutureOfWork`;
}

async function generate(payload) {
  const topic = String(payload.topic || '').trim().slice(0, 600);
  const tone = String(payload.tone || 'Thoughtful').slice(0, 40);
  const goal = String(payload.goal || 'Build authority').slice(0, 60);
  if (!topic) throw new Error('Please enter a topic first.');
  if (!process.env.OPENAI_API_KEY) return { post:fallbackPost(topic, tone, goal), mode:'demo' };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${process.env.OPENAI_API_KEY}` },
    body:JSON.stringify({
      model:process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions:'You write insightful, authentic LinkedIn posts. Return only the finished post, no preamble. Use short paragraphs, one strong hook, concrete insight, and at most 3 relevant hashtags. Never invent personal facts, metrics, or experiences.',
      input:`Topic: ${topic}\nTone: ${tone}\nGoal: ${goal}\nLength: 130-220 words`,
      reasoning:{ effort:'low' },
      text:{ verbosity:'low' }
    })
  });
  if (!response.ok) throw new Error(`AI service returned ${response.status}`);
  const data = await response.json();
  const post = data.output?.flatMap(item => item.content || []).find(item => item.type === 'output_text')?.text;
  if (!post) throw new Error('The AI service returned an empty response.');
  return { post, mode:'live' };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok:true, ai:process.env.OPENAI_API_KEY ? 'live' : 'demo' });
    if (req.method === 'POST' && url.pathname === '/api/generate') return json(res, 200, await generate(await body(req)));
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error:'Method not allowed' });
    let requested = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    requested = normalize(requested).replace(/^(\.\.(\\|\/|$))+/, '');
    const file = join(root, requested);
    if (!file.startsWith(root)) return json(res, 403, { error:'Forbidden' });
    const info = await stat(file).catch(() => null);
    if (!info?.isFile()) return json(res, 404, { error:'Not found' });
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type':mime[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options':'nosniff', 'Cache-Control':requested === 'index.html' ? 'no-cache' : 'public, max-age=3600' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) { json(res, 400, { error:error.message || 'Something went wrong' }); }
});

server.listen(port, '127.0.0.1', () => console.log(`LinkedLM running at http://localhost:${port}`));
