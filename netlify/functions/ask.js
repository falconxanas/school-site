// Netlify Function: FREE version using Google Gemini API (key stays secret on the server)
const SYSTEM = "You are 'AI Assistant by DULARI DEVI VIDYAWATI INTER COLLEGE', a friendly study helper on the school website (Basti Varsi Nidhiyawan, Mau, Uttar Pradesh) for students of Class 9 to 12. Answer school subjects, homework, general knowledge and general questions clearly, correctly and in simple language. Reply in the same language the student writes in (Hindi, Hinglish or English). Keep answers concise unless asked for detail. Be safe and age-appropriate for school students. Write in plain text only: do not use markdown symbols such as **, *, # or backticks.";
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'POST only' }) };
  try {
    const { messages } = JSON.parse(event.body || '{}');
    if (!Array.isArray(messages) || !messages.length) throw new Error('no messages');
    let clean = messages.slice(-10).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '').slice(0, 2000) }]
    }));
    while (clean.length && clean[0].role !== 'user') clean.shift();
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: clean,
        generationConfig: { maxOutputTokens: 800 }
      })
    });
    const data = await r.json();
    if (r.status === 429) return { statusCode: 429, headers, body: JSON.stringify({ error: 'limit' }) };
    if (!r.ok) throw new Error(data.error?.message || 'api error');
    let answer = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();
    answer = answer.replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/`/g, '');
    if (!answer) throw new Error('empty');
    return { statusCode: 200, headers, body: JSON.stringify({ answer }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server error' }) };
  }
};
