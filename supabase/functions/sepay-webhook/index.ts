import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sepay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('Webhook called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Sepay webhook received:', JSON.stringify(body));

    const { transferType, transferAmount, content } = body;

    if (transferType !== 'in') {
      return new Response(JSON.stringify({ success: true, message: 'Ignored: not incoming' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!content || !transferAmount) {
      return new Response(JSON.stringify({ success: true, message: 'Ignored: missing data' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const contentUpper = content.toUpperCase().replace(/[^A-Z0-9]/g, ' ').trim();
    console.log('Normalized content:', contentUpper);
    
    // Flexible regex: accept AUTOFILL U1 MNDBX0HU, AUTOFILLU1MNDBX0HU, AUTOFILL-U1-MNDBX0HU etc.
    const autofillMatch = contentUpper.match(/AUTOFILL[\s\-]*U(\d+)[\s\-]*([A-Z0-9]{6,})/);

    if (!autofillMatch) {
      console.log('No AUTOFILL code found in content:', content);
      return new Response(JSON.stringify({ success: true, message: 'No matching code' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = autofillMatch[1];
    const code = autofillMatch[2];
    const matchedCode = `AUTOFILL-U${userId}-${code}`;
    console.log('Matched transfer code:', matchedCode, 'from content:', content);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('transfer_content', matchedCode)
      .eq('status', 'pending')
      .single();

    if (orderError || !order) {
      console.log('No pending order found for code:', matchedCode);
      return new Response(JSON.stringify({ success: true, message: 'No pending order' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountNum = Number(transferAmount);
    const orderAmount = Number(order.amount_vnd);

    if (amountNum < orderAmount) {
      console.log(`Amount mismatch: received ${amountNum}, expected ${orderAmount}`);
      await supabase.from('orders').update({
        note: `Sepay: Nhận ${amountNum}đ, cần ${orderAmount}đ - Thiếu tiền`,
        updated_at: new Date().toISOString(),
      }).eq('order_id', order.order_id);

      return new Response(JSON.stringify({ success: true, message: 'Amount too low' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-approve
    console.log(`Auto-approving order #${order.order_id} for user ${order.user_id}`);

    await supabase.from('orders').update({
      status: 'approved',
      note: `Sepay tự động xác nhận - Nhận ${amountNum}đ`,
      updated_at: new Date().toISOString(),
    }).eq('order_id', order.order_id);

    await supabase.from('payments').update({
      status: 'confirmed',
      paid_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    }).eq('order_id', order.order_id);

    const { data: wallet } = await supabase
      .from('user_wallet')
      .select('*')
      .eq('user_id', order.user_id)
      .single();

    if (wallet) {
      const newBalance = wallet.form_balance + order.forms_to_add;
      await supabase.from('user_wallet').update({
        form_balance: newBalance,
        total_forms_added: wallet.total_forms_added + order.forms_to_add,
        last_updated: new Date().toISOString(),
      }).eq('user_id', order.user_id);

      await supabase.from('transactions').insert({
        user_id: order.user_id,
        order_id: order.order_id,
        type: 'credit',
        amount: order.forms_to_add,
        balance_before: wallet.form_balance,
        balance_after: newBalance,
        description: `[Sepay] Tự động nạp ${order.forms_to_add} lượt từ đơn #${order.order_id}`,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified and credits added',
      order_id: order.order_id,
      credits_added: order.forms_to_add,
      // Sepay verification response
      payment_status: 'verified',
      transaction_id: order.transfer_content,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Sepay webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
