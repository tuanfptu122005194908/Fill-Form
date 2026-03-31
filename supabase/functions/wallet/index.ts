import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, user_id, form_url } = body;

    if (action === 'get_balance') {
      const { data: wallet } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', user_id)
        .single();

      return new Response(JSON.stringify({ wallet }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Single form credit deduction (called per-form during submission)
    if (action === 'use_form_single') {
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (walletError || !wallet) {
        return new Response(JSON.stringify({ error: 'Không tìm thấy ví' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (wallet.form_balance <= 0) {
        return new Response(JSON.stringify({ error: 'Bạn đã hết lượt sử dụng. Vui lòng nạp thêm.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Deduct 1 form
      await supabase.from('user_wallet').update({
        form_balance: wallet.form_balance - 1,
        total_forms_used: wallet.total_forms_used + 1,
        last_updated: new Date().toISOString(),
      }).eq('user_id', user_id);

      // Create transaction
      await supabase.from('transactions').insert({
        user_id,
        type: 'debit',
        amount: 1,
        balance_before: wallet.form_balance,
        balance_after: wallet.form_balance - 1,
        description: 'Sử dụng tool autofill',
      });

      return new Response(JSON.stringify({ success: true, balance: wallet.form_balance - 1 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Legacy use_form (kept for compatibility)
    if (action === 'use_form') {
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallet')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (walletError || !wallet) {
        return new Response(JSON.stringify({ error: 'Không tìm thấy ví' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (wallet.form_balance <= 0) {
        return new Response(JSON.stringify({ error: 'Bạn đã hết lượt sử dụng.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('user_wallet').update({
        form_balance: wallet.form_balance - 1,
        total_forms_used: wallet.total_forms_used + 1,
        last_updated: new Date().toISOString(),
      }).eq('user_id', user_id);

      await supabase.from('transactions').insert({
        user_id, type: 'debit', amount: 1,
        balance_before: wallet.form_balance, balance_after: wallet.form_balance - 1,
        description: 'Sử dụng tool autofill',
      });

      return new Response(JSON.stringify({ success: true, balance: wallet.form_balance - 1 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log aggregate batch history (1 record for N forms)
    if (action === 'log_batch_history') {
      const count = Math.max(1, Number(body.count) || 1);
      
      await supabase.from('form_history').insert({
        user_id,
        form_url: form_url || null,
        tool_name: `autofill (${count} forms)`,
        status: 'success',
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_history') {
      const { data: history } = await supabase
        .from('form_history')
        .select('*')
        .eq('user_id', user_id)
        .order('ran_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ history: history || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_transactions') {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      return new Response(JSON.stringify({ transactions: transactions || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Wallet error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
