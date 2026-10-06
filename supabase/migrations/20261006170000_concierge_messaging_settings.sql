-- Interim links using the resort number, explicitly requested by the owner.
-- Replace independently when dedicated messaging accounts are supplied.
INSERT INTO public.site_settings (key, value, label, display_order)
VALUES
  ('whatsapp', 'https://wa.me/842363938888', 'Concierge WhatsApp', 20),
  ('zalo', 'https://zalo.me/842363938888', 'Concierge Zalo', 21)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
WHERE public.site_settings.value = '';
