export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, model, systemPrompt, agents } = req.body;

    const GEMINI_KEY = process.env.GEMINI_KEY;
    const OPENAI_KEY = process.env.OPENAI_KEY;

    async function callGemini(prompt) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const d = await r.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro';
    }

    async function callOpenAI(prompt) {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 600 })
      });
      const d = await r.json();
      return d.choices?.[0]?.message?.content || 'Erro';
    }

    const agentResults = [];
    for (const agent of agents || []) {
      const prompt = `${agent.role}\n\nPergunta: ${message}`;
      const output = agent.model === 'aso-mini'? await callGemini(prompt) : await callOpenAI(prompt);
      agentResults.push({ name: agent.name, output });
    }

    const context = agentResults.map(a => `${a.name}: ${a.output}`).join('\n\n');
    const finalPrompt = `${systemPrompt}\n\n${context}\n\nResponda: ${message}`;

    const finalAnswer = model === 'aso-mini'? await callGemini(finalPrompt) : await callOpenAI(finalPrompt);

    res.status(200).json({ answer: finalAnswer, agents: agentResults });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
