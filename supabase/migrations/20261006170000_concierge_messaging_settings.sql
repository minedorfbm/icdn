-- Populate these independently with the resort's verified messaging accounts.
-- The landline is not assumed to be registered on WhatsApp or Zalo.
INSERT INTO public.site_settings (key, value, label, display_order)
VALUES
  ('whatsapp', '', 'Concierge WhatsApp — official https://wa.me/ link', 20),
  ('zalo', '', 'Concierge Zalo — official https://zalo.me/ link', 21)
ON CONFLICT (key) DO NOTHING;
