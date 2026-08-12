const ideas = [
  ['Leadership', 'The decision I stopped making for my team—and what happened next'],
  ['Career growth', 'A skill that quietly changed the trajectory of my career'],
  ['Hot take', 'Why the best leaders ask more questions than they answer'],
  ['Building', 'What shipping before I felt ready taught me about momentum'],
  ['Teams', 'The simplest ritual that made our remote team feel connected'],
  ['Reflection', 'A piece of career advice I misunderstood for years'],
  ['Learning', 'Three signs you are growing—even when it does not feel like it'],
  ['Perspective', 'The hidden cost of always being the expert in the room'],
  ['Conversation', 'What is one belief about work you have changed your mind on?']
];

const promptInput = document.querySelector('#promptInput');
const postBody = document.querySelector('#postBody');
const generateBtn = document.querySelector('#generateBtn');
const toast = document.querySelector('#toast');
let tone = 'Thoughtful';
let goal = 'Build authority';
let ideaOffset = 0;

function makePost(topic, variation = 0) {
  const clean = topic.trim().replace(/[.!]+$/, '') || 'the lesson I learned this week';
  const openings = {
    Thoughtful: [`I used to think great leaders had the best answers.\n\nNow I think they have the best questions.`, `Here is something I have been thinking about lately:\n\n${capitalize(clean)}.`],
    Bold: [`The most overlooked advantage in leadership isn't confidence.\n\nIt's curiosity.`, `Unpopular opinion:\n\n${capitalize(clean)}.`],
    Conversational: [`Can I share something I wish I had learned earlier?\n\n${capitalize(clean)}.`, `A quick thought on ${clean.toLowerCase()}:`],
    Educational: [`Three things experience taught me about ${clean.toLowerCase()}:`, `A practical framework for thinking about ${clean.toLowerCase()}:`]
  };
  const hook = openings[tone][variation % 2];
  const middle = goal === 'Spark conversation'
    ? `\n\nCuriosity changes the room. It replaces the pressure to perform with permission to explore.\n\nThe leaders who made the biggest difference in my career did three things:\n\n→ They asked before they assumed\n→ They listened without preparing a response\n→ They made it safe to say “I don't know”`
    : `\n\nCuriosity is not indecision. It is the discipline to pause long enough to see what everyone else missed.\n\nThe leaders I admire most consistently:\n\n→ Ask before they assume\n→ Listen to understand, not respond\n→ Stay open to being wrong`;
  const endings = {
    'Build authority': `\n\nExpertise earns attention. Curiosity earns trust.\n\nAnd trust is where the best work begins.\n\nWhat question has helped you become a better leader?`,
    'Spark conversation': `\n\nThe quality of a team's thinking often mirrors the quality of its leader's questions.\n\nWhat is one question you wish more leaders would ask?`,
    'Share a lesson': `\n\nMy takeaway: you do not need to know everything to lead well. You need to create the conditions where the best answer can emerge.`,
    'Grow my network': `\n\nI would love to learn from other leaders here: how do you keep curiosity alive when the stakes are high?`
  };
  return `${hook}${middle}${endings[goal]}\n\n#Leadership #GrowthMindset #FutureOfWork`;
}

function capitalize(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

function renderIdeas() {
  const set = [0,1,2].map(i => ideas[(ideaOffset + i) % ideas.length]);
  document.querySelector('#ideaGrid').innerHTML = set.map(([tag, text]) => `<article class="idea-card" tabindex="0" data-idea="${text}"><span>${tag}</span><p>${text}</p><button aria-label="Use this idea">↗</button></article>`).join('');
  document.querySelectorAll('.idea-card').forEach(card => {
    const use = () => { promptInput.value = card.dataset.idea; updateCount(); promptInput.focus(); window.scrollTo({top: 0, behavior: 'smooth'}); };
    card.addEventListener('click', use);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') use(); });
  });
}

function updateCount() { document.querySelector('#charCount').textContent = `${promptInput.value.length} / 600`; }
function showToast(title = 'Copied to clipboard', subtitle = 'Your post is ready to share.') {
  toast.querySelector('strong').textContent = title; toast.querySelector('small').textContent = subtitle;
  toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2400);
}

function bindDropdown(triggerId, menuId, attr, callback) {
  const trigger = document.querySelector(triggerId), menu = document.querySelector(menuId);
  trigger.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { callback(btn.dataset[attr]); trigger.querySelector('b').textContent = btn.dataset[attr]; menu.classList.remove('open'); }));
}

async function requestPost() {
  const response = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ topic:promptInput.value, tone, goal }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Generation failed');
  return data;
}

generateBtn.addEventListener('click', async () => {
  if (!promptInput.value.trim()) { promptInput.focus(); showToast('Add a topic first', 'Tell LinkedLM what you want to write about.'); return; }
  generateBtn.classList.add('loading'); generateBtn.innerHTML = '<span>◌</span> Thinking…';
  try {
    const result = await requestPost();
    postBody.textContent = result.post;
    postBody.classList.remove('expanded');
    document.querySelector('#scoreValue').textContent = 90 + Math.floor(Math.random() * 7);
    showToast('New post generated', result.mode === 'live' ? 'Created with OpenAI.' : 'Created in local demo mode.');
  } catch (error) {
    postBody.textContent = makePost(promptInput.value);
    showToast('Offline draft created', error.message);
  } finally { generateBtn.classList.remove('loading'); generateBtn.innerHTML = '<span>✦</span> Generate post'; }
});

document.querySelector('#regenerateBtn').addEventListener('click', () => { postBody.textContent = makePost(promptInput.value, 1); showToast('Fresh version created', 'We tried a new hook for you.'); });
document.querySelector('#copyBtn').addEventListener('click', async () => { try { await navigator.clipboard.writeText(postBody.textContent); } catch { /* preview environments may block clipboard */ } showToast(); });
document.querySelector('#readMore').addEventListener('click', e => { postBody.classList.toggle('expanded'); e.target.textContent = postBody.classList.contains('expanded') ? 'show less' : '…more'; });
document.querySelector('#shuffleBtn').addEventListener('click', () => { ideaOffset = (ideaOffset + 3) % ideas.length; renderIdeas(); });
document.querySelector('#newPostBtn').addEventListener('click', () => { promptInput.value = ''; postBody.textContent = 'Your next great post starts with a single idea. Add a topic and let LinkedLM shape it into something worth sharing.'; updateCount(); promptInput.focus(); });
document.querySelector('.mobile-menu').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active')); btn.classList.add('active'); if (btn.dataset.view !== 'create') showToast(`${capitalize(btn.dataset.view)} is ready`, 'This demo keeps you in the creation studio.'); }));
document.querySelector('#upgradeBtn').addEventListener('click', () => showToast('You’re on the Creator plan', 'Plan management would open here.'));
promptInput.addEventListener('input', updateCount);
bindDropdown('#toneSelect', '#toneMenu', 'tone', v => tone = v);
bindDropdown('#goalSelect', '#goalMenu', 'goal', v => goal = v);

postBody.textContent = makePost(promptInput.value);
updateCount();
renderIdeas();
