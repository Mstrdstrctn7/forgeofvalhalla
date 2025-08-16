import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('paper_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const insights = data.map((trade) => {
      const result = trade.result_usd || 0;
      const side = trade.side?.toUpperCase();
      return `Trade #${trade.id} - ${side}: ${trade.amount_usd}$ ${side === 'BUY' ? '→' : '⬅️'} Result: ${result}$`;
    });

    // Store in knight_logs
    for (const line of insights) {
      await supabase.from('knight_logs').insert({
        user_email: trade.user_email || 'unknown@valhalla.ai',
        insight: line
      });
    }

    return res.status(200).json({ insights });
  } catch (err) {
    console.error('[knightBrain] Error:', err.message);
    return res.status(500).json({ error: 'KnightBrain failed to process logs' });
  }
}
