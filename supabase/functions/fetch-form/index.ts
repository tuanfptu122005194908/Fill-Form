const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || !url.includes('docs.google.com/forms')) {
      return new Response(JSON.stringify({ error: 'URL Google Form không hợp lệ' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize URL to viewform
    let formUrl = url.trim();
    if (!formUrl.includes('/viewform')) {
      formUrl = formUrl.replace(/\/edit.*$/, '/viewform');
      if (!formUrl.endsWith('/viewform')) {
        formUrl = formUrl.replace(/\/?$/, '/viewform');
      }
    }

    console.log('Fetching Google Form:', formUrl);

    const response = await fetch(formUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Không thể truy cập form (HTTP ${response.status})` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();

    // Verify it's a valid Google Form page
    if (!html.includes('FB_PUBLIC_LOAD_DATA_')) {
      return new Response(JSON.stringify({ error: 'Không tìm thấy dữ liệu form. Kiểm tra link có đúng và form đang ở chế độ công khai.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fetch form error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Lỗi server' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
