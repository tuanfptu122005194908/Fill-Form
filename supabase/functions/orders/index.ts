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
    const { action } = body;

    // Helper: load settings from DB
    const loadSettings = async () => {
      const { data: rows } = await supabase.from('system_settings').select('*');
      const settings: Record<string, any> = {};
      (rows || []).forEach((r: any) => { settings[r.key] = r.value; });
      return settings;
    };

    // Public: get settings (no admin needed)
    if (action === 'get_public_settings') {
      const settings = await loadSettings();
      return new Response(JSON.stringify({ settings }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create_order') {
      const { user_id } = body;
      const settings = await loadSettings();
      const bankInfo = settings.bank_info || {};
      const pricing = settings.pricing || {};
      const PRICE_PER_FORM = pricing.price_per_form || 350;
      const BANK_NAME = bankInfo.bank_name || 'MB Bank';
      const BANK_ACCOUNT_NO = bankInfo.account_no || '0354860785';
      const BANK_ACCOUNT_NAME = bankInfo.account_name || 'CAO MINH TUAN';

      // Auto-create user if not exists (bypass RLS for demo)
      const { data: existingUser } = await supabase.from('users').select('*').eq('user_id', user_id).single();
      if (!existingUser) {
        await supabase.from('users').insert({
          user_id,
          email: `user${user_id}@example.com`,
          role: 'USER',
          status: 'active',
          created_at: new Date().toISOString(),
        });
        
        await supabase.from('user_profile').insert({
          user_id,
          full_name: `User ${user_id}`,
          phone: '0123456789',
        });
        
        await supabase.from('user_wallet').insert({
          user_id,
          form_balance: 0,
          total_forms_added: 0,
          total_forms_used: 0,
        });
      }

      const amount_vnd = Math.min(Math.max(Number(body.amount_vnd) || 0, 0), 100000000);
      if (!Number.isFinite(amount_vnd) || amount_vnd <= 0) {
        return new Response(JSON.stringify({ error: 'Số tiền không hợp lệ' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const formsToAdd = Math.floor(amount_vnd / PRICE_PER_FORM);
      if (formsToAdd <= 0) {
        return new Response(JSON.stringify({ error: `Số tiền tối thiểu là ${PRICE_PER_FORM}đ` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const transferContent = `AUTOFILL-U${user_id}-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: orderError } = await supabase.from('orders')
        .insert({ user_id, amount_vnd, forms_to_add: formsToAdd, transfer_content: transferContent, status: 'pending' })
        .select().single();
      if (orderError) throw orderError;

      // Use Sepay dynamic QR instead of VietQR
      const qrUrl = `https://qr.sepay.vn/img?acc=96247PAY05&bank=BIDV&amount=${amount_vnd}&des=${encodeURIComponent(transferContent)}`;
      const { data: payment, error: paymentError } = await supabase.from('payments')
        .insert({
          order_id: order.order_id, bank_name: BANK_NAME, bank_account_no: BANK_ACCOUNT_NO,
          bank_account_name: BANK_ACCOUNT_NAME, amount_vnd, transfer_content: transferContent,
          qr_code_url: qrUrl, method: 'manual', status: 'pending',
        }).select().single();
      if (paymentError) throw paymentError;

      return new Response(JSON.stringify({ order, payment, settings: { bank_info: bankInfo, pricing } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_orders') {
      const { user_id } = body;
      const { data: orders } = await supabase.from('orders')
        .select('*, payments(*)').eq('user_id', user_id).order('created_at', { ascending: false });
      return new Response(JSON.stringify({ orders: orders || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: check role helper
    const checkAdmin = async (admin_id: number) => {
      const { data } = await supabase.from('users').select('role').eq('user_id', admin_id).single();
      return data?.role === 'ADMIN';
    };

    if (action === 'admin_get_orders') {
      const { admin_id, status_filter } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      let query = supabase.from('orders').select('*, payments(*), users!orders_user_id_fkey(email)')
        .order('created_at', { ascending: false });
      if (status_filter && status_filter !== 'all') query = query.eq('status', status_filter);
      const { data: orders } = await query;
      return new Response(JSON.stringify({ orders: orders || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_approve_order') {
      const { admin_id, order_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: order } = await supabase.from('orders').select('*').eq('order_id', order_id).single();
      if (!order || order.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Đơn không hợp lệ' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('orders').update({ status: 'approved' }).eq('order_id', order_id);
      await supabase.from('payments').update({
        status: 'confirmed', confirmed_by: admin_id, confirmed_at: new Date().toISOString(), paid_at: new Date().toISOString(),
      }).eq('order_id', order_id);

      const { data: wallet } = await supabase.from('user_wallet').select('*').eq('user_id', order.user_id).single();
      if (wallet) {
        await supabase.from('user_wallet').update({
          form_balance: wallet.form_balance + order.forms_to_add,
          total_forms_added: wallet.total_forms_added + order.forms_to_add,
          last_updated: new Date().toISOString(),
        }).eq('user_id', order.user_id);
        await supabase.from('transactions').insert({
          user_id: order.user_id, order_id: order.order_id, type: 'credit',
          amount: order.forms_to_add, balance_before: wallet.form_balance,
          balance_after: wallet.form_balance + order.forms_to_add,
          description: `Nạp ${order.forms_to_add} lượt từ đơn #${order.order_id}`,
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_reject_order') {
      const { admin_id, order_id, note } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('orders').update({ status: 'rejected', note: note || 'Bị từ chối' }).eq('order_id', order_id);
      await supabase.from('payments').update({ status: 'failed' }).eq('order_id', order_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: Edit order
    if (action === 'admin_edit_order') {
      const { admin_id, order_id, amount_vnd, forms_to_add, status: newStatus, note } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updateData: any = { updated_at: new Date().toISOString() };
      if (amount_vnd !== undefined) updateData.amount_vnd = amount_vnd;
      if (forms_to_add !== undefined) updateData.forms_to_add = forms_to_add;
      if (newStatus) updateData.status = newStatus;
      if (note !== undefined) updateData.note = note;
      await supabase.from('orders').update(updateData).eq('order_id', order_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: Delete order
    if (action === 'admin_delete_order') {
      const { admin_id, order_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('payments').delete().eq('order_id', order_id);
      await supabase.from('transactions').delete().eq('order_id', order_id);
      await supabase.from('orders').delete().eq('order_id', order_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Admin: Create order manually
    if (action === 'admin_create_order') {
      const { admin_id, target_user_id, amount_vnd, forms_to_add, status: orderStatus, note } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const transferContent = `ADMIN-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error } = await supabase.from('orders').insert({
        user_id: target_user_id, amount_vnd: amount_vnd || 0,
        forms_to_add: forms_to_add || 0, transfer_content: transferContent,
        status: orderStatus || 'approved', note: note || 'Admin tạo thủ công',
      }).select().single();
      if (error) throw error;

      // If approved, add credits
      if ((orderStatus || 'approved') === 'approved' && forms_to_add > 0) {
        const { data: wallet } = await supabase.from('user_wallet').select('*').eq('user_id', target_user_id).single();
        if (wallet) {
          await supabase.from('user_wallet').update({
            form_balance: wallet.form_balance + forms_to_add,
            total_forms_added: wallet.total_forms_added + forms_to_add,
            last_updated: new Date().toISOString(),
          }).eq('user_id', target_user_id);
          await supabase.from('transactions').insert({
            user_id: target_user_id, order_id: order.order_id, type: 'credit',
            amount: forms_to_add, balance_before: wallet.form_balance,
            balance_after: wallet.form_balance + forms_to_add,
            description: `[Admin] Tạo đơn thủ công +${forms_to_add} lượt`,
          });
        }
      }
      return new Response(JSON.stringify({ success: true, order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_get_users') {
      const { admin_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: users } = await supabase.from('users')
        .select('user_id, email, role, status, created_at, user_profile(full_name, phone), user_wallet(form_balance, total_forms_added, total_forms_used)')
        .order('created_at', { ascending: false });
      return new Response(JSON.stringify({ users: users || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_toggle_user_status') {
      const { admin_id, target_user_id, new_status } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('users').update({ status: new_status }).eq('user_id', target_user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_get_transactions') {
      const { admin_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: transactions } = await supabase.from('transactions')
        .select('*, users!transactions_user_id_fkey(email)')
        .order('created_at', { ascending: false }).limit(500);
      return new Response(JSON.stringify({ transactions: transactions || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_adjust_credit') {
      const { admin_id, target_user_id, amount, type, description } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const adjustAmount = Math.min(Math.max(Number(amount) || 0, 0), 100000);
      if (adjustAmount <= 0) {
        return new Response(JSON.stringify({ error: 'Số lượng không hợp lệ' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: wallet } = await supabase.from('user_wallet').select('*').eq('user_id', target_user_id).single();
      if (!wallet) {
        return new Response(JSON.stringify({ error: 'Không tìm thấy ví' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const newBalance = type === 'credit' ? wallet.form_balance + adjustAmount : wallet.form_balance - adjustAmount;
      if (newBalance < 0) {
        return new Response(JSON.stringify({ error: 'Số dư không đủ để trừ' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('user_wallet').update({
        form_balance: newBalance,
        ...(type === 'credit' ? { total_forms_added: wallet.total_forms_added + adjustAmount } : { total_forms_used: wallet.total_forms_used + adjustAmount }),
        last_updated: new Date().toISOString(),
      }).eq('user_id', target_user_id);
      await supabase.from('transactions').insert({
        user_id: target_user_id, type, amount: adjustAmount,
        balance_before: wallet.form_balance, balance_after: newBalance,
        description: `[Admin] ${description || (type === 'credit' ? 'Cộng credit' : 'Trừ credit')}`,
      });
      return new Response(JSON.stringify({ success: true, new_balance: newBalance }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_get_form_history') {
      const { admin_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: history } = await supabase.from('form_history')
        .select('*, users!form_history_user_id_fkey(email)')
        .order('ran_at', { ascending: false }).limit(500);
      return new Response(JSON.stringify({ history: history || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_get_settings') {
      const { admin_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const settings = await loadSettings();
      return new Response(JSON.stringify({ settings }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_save_settings') {
      const { admin_id, settings } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from('system_settings').upsert({
          key, value, updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_delete_user') {
      const { admin_id, target_user_id } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (admin_id === target_user_id) {
        return new Response(JSON.stringify({ error: 'Không thể xoá chính mình' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await supabase.from('form_history').delete().eq('user_id', target_user_id);
      await supabase.from('transactions').delete().eq('user_id', target_user_id);
      const { data: userOrders } = await supabase.from('orders').select('order_id').eq('user_id', target_user_id);
      if (userOrders?.length) {
        const orderIds = userOrders.map((o: any) => o.order_id);
        await supabase.from('payments').delete().in('order_id', orderIds);
      }
      await supabase.from('orders').delete().eq('user_id', target_user_id);
      await supabase.from('user_wallet').delete().eq('user_id', target_user_id);
      await supabase.from('user_profile').delete().eq('user_id', target_user_id);
      await supabase.from('users').delete().eq('user_id', target_user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'admin_update_user') {
      const { admin_id, target_user_id, role, email: newEmail } = body;
      if (!await checkAdmin(admin_id)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updateData: any = { updated_at: new Date().toISOString() };
      if (role) updateData.role = role;
      if (newEmail) updateData.email = newEmail;
      await supabase.from('users').update(updateData).eq('user_id', target_user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'check_order_status') {
      const { order_id, user_id } = body;
      if (!order_id || !user_id) {
        return new Response(JSON.stringify({ error: 'Missing order_id or user_id' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: order } = await supabase.from('orders')
        .select('order_id, status, forms_to_add, amount_vnd, note')
        .eq('order_id', order_id).eq('user_id', user_id).single();
      if (!order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Orders error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
