const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('[supabase] WARNING: SUPABASE_URL or SUPABASE_KEY is not set.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Log a chat message to Supabase
 * This helps the bot "learn" or at least keep a history of queries.
 */
async function logChatMessage(query, answer, sources = []) {
    try {
        if (!supabaseUrl) return;

        const { error } = await supabase
            .from('chat_history')
            .insert([
                { 
                    query, 
                    answer, 
                    sources: JSON.stringify(sources),
                    created_at: new Date()
                }
            ]);

        if (error) throw error;
    } catch (err) {
        console.error('[supabase] Error logging message:', err.message);
    }
}

/**
 * Get context from Supabase "Knowledge Base" table if it exists.
 * This allows adding custom smarter info via Supabase dashboard.
 */
async function getSupabaseContext(query) {
    try {
        if (!supabaseUrl) return null;

        // Simple keyword search in a hypothetical 'knowledge' table
        const { data, error } = await supabase
            .from('knowledge')
            .select('content')
            .textSearch('keywords', query)
            .limit(1);

        if (error || !data || data.length === 0) return null;
        return data[0].content;
    } catch (err) {
        return null;
    }
}

/**
 * Check if we have an exact cached answer for this query in Supabase
 */
async function checkCachedAnswer(query) {
    try {
        if (!supabaseUrl) return null;
        
        const { data, error } = await supabase
            .from('chat_history')
            .select('answer')
            .eq('query', query.toLowerCase().trim())
            .order('created_at', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) return null;
        return data[0].answer;
    } catch (err) {
        return null;
    }
}

module.exports = { supabase, logChatMessage, getSupabaseContext, checkCachedAnswer };
