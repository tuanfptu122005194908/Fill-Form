CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO public.system_settings (key, value) VALUES
  ('bank_info', '{"bank_name":"MB Bank","account_no":"0354860785","account_name":"CAO MINH TUAN"}'::jsonb),
  ('pricing', '{"price_per_form":350,"currency":"VND"}'::jsonb),
  ('limits', '{"max_forms_per_day":500,"rate_limit_ms":1000}'::jsonb),
  ('maintenance', '{"enabled":false,"message":"Hệ thống đang bảo trì"}'::jsonb)
ON CONFLICT (key) DO NOTHING;