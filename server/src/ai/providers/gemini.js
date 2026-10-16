/**
 * Gemini provider — talks to the Gemini REST API directly (no SDK needed).
 *
 * Env vars:
 *   GEMINI_API_KEY      required to enable the LLM (get one free at https://aistudio.google.com/apikey)
 *   GEMINI_MODEL        optional, defaults to "gemini-flash-latest"
 *   GEMINI_GROUNDING    optional, set to "false" to disable Google Search grounding
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-flash-latest';

function isGeminiConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
}

/** Convert widget history ({ role: 'user'|'assistant', content }) to Gemini `contents`. */
function toGeminiContents(history, query) {
    const contents = [];
    for (const msg of history) {
        const role = msg.role === 'user' ? 'user' : 'model';
        // Gemini conversations should start with a user turn
        if (contents.length === 0 && role === 'model') continue;
        const last = contents[contents.length - 1];
        if (last && last.role === role) {
            last.parts[0].text += `\n\n${msg.content}`;
        } else {
            contents.push({ role, parts: [{ text: msg.content }] });
        }
    }
    const last = contents[contents.length - 1];
    if (last && last.role === 'user') {
        last.parts[0].text += `\n\n${query}`;
    } else {
        contents.push({ role: 'user', parts: [{ text: query }] });
    }
    return contents;
}

function extractSources(candidate) {
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const seen = new Set();
    const sources = [];
    for (const chunk of chunks) {
        const uri = chunk.web?.uri;
        if (!uri || seen.has(uri)) continue;
        seen.add(uri);
        sources.push({ label: chunk.web.title || new URL(uri).hostname, url: uri });
    }
    return sources;
}

async function openStream({ systemPrompt, contents, grounding, signal }) {
    const model = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const body = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 2048 },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    };
    if (grounding) body.tools = [{ google_search: {} }];

    const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
        signal,
    });

    if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => '');
        const err = new Error(`Gemini HTTP ${res.status}: ${detail.slice(0, 300)}`);
        err.status = res.status;
        throw err;
    }
    return res;
}

/**
 * Stream a reply from Gemini.
 * Calls onDelta(text) for each chunk and resolves with { text, sources }.
 * Throws if nothing could be generated (caller falls back to the local brain).
 */
async function streamGemini({ systemPrompt, history, query, onDelta, signal }) {
    const contents = toGeminiContents(history, query);
    const groundingEnabled = process.env.GEMINI_GROUNDING !== 'false';

    let res;
    try {
        res = await openStream({ systemPrompt, contents, grounding: groundingEnabled, signal });
    } catch (err) {
        // Grounding can be unavailable on some models/quotas — retry once without it.
        if (!groundingEnabled || err.name === 'AbortError' || (err.status && err.status < 400)) throw err;
        console.warn('[gemini] Retrying without grounding:', err.message);
        res = await openStream({ systemPrompt, contents, grounding: false, signal });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    const sources = new Map();
    let blockReason = null;

    const processLine = (line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) return;

        let payload;
        try { payload = JSON.parse(trimmed.slice(5).trim()); } catch { return; }

        if (payload.promptFeedback?.blockReason) blockReason = payload.promptFeedback.blockReason;
        const candidate = payload.candidates?.[0];
        if (!candidate) return;

        const delta = (candidate.content?.parts || [])
            .filter(part => typeof part.text === 'string' && !part.thought)
            .map(part => part.text)
            .join('');
        if (delta) {
            text += delta;
            onDelta?.(delta);
        }

        for (const source of extractSources(candidate)) {
            sources.set(source.url, source);
        }
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);
            processLine(line);
        }
    }
    buffer += decoder.decode();
    if (buffer.trim()) processLine(buffer);

    if (!text) {
        if (blockReason) {
            const msg = "Sorry, I can't help with that one. Is there anything else you'd like to know — maybe about Charles' projects or skills?";
            onDelta?.(msg);
            return { text: msg, sources: [] };
        }
        throw new Error('Gemini returned an empty response');
    }

    return { text, sources: Array.from(sources.values()).slice(0, 5) };
}

module.exports = { streamGemini, isGeminiConfigured };
