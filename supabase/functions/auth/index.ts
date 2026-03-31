import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'autofill_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

    if (action === 'register') {
      const { email, password, name, phone } = body;
      const { data: existing } = await supabase.from('users').select('user_id').eq('email', email).single();
      if (existing) {
        return new Response(JSON.stringify({ error: 'Email đã được đăng ký' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const passwordHash = await hashPassword(password);
      const { data: newUser, error: userError } = await supabase
        .from('users').insert({ email, password_hash: passwordHash })
        .select('user_id, email, role, status').single();
      if (userError) throw userError;

      await supabase.from('user_profile').insert({
        user_id: newUser.user_id, full_name: name || email.split('@')[0], phone: phone || null,
      });
      await supabase.from('user_wallet').insert({
        user_id: newUser.user_id, form_balance: 5, total_forms_added: 5,
      });

      return new Response(JSON.stringify({ user: newUser, message: 'Đăng ký thành công!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'login') {
      const { email, password } = body;
      const passwordHash = await hashPassword(password);
      const { data: user, error } = await supabase
        .from('users').select('user_id, email, role, status')
        .eq('email', email).eq('password_hash', passwordHash).single();

      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Email hoặc mật khẩu không đúng' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (user.status === 'blocked') {
        return new Response(JSON.stringify({ error: 'Tài khoản đã bị khóa' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: profile } = await supabase.from('user_profile')
        .select('full_name, phone, avatar_url').eq('user_id', user.user_id).single();
      const { data: wallet } = await supabase.from('user_wallet')
        .select('form_balance, total_forms_added, total_forms_used').eq('user_id', user.user_id).single();

      return new Response(JSON.stringify({ user, profile, wallet }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_profile') {
      const { user_id, full_name, phone } = body;
      const { error } = await supabase.from('user_profile')
        .update({ full_name, phone, updated_at: new Date().toISOString() })
        .eq('user_id', user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'change_password') {
      const { user_id, current_password, new_password } = body;
      const currentHash = await hashPassword(current_password);
      const { data: user } = await supabase.from('users')
        .select('user_id').eq('user_id', user_id).eq('password_hash', currentHash).single();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Mật khẩu hiện tại không đúng' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const newHash = await hashPassword(new_password);
      await supabase.from('users').update({ password_hash: newHash }).eq('user_id', user_id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
