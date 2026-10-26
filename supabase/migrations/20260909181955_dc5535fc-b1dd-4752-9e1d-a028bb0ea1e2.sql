ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS lunch_menu_url text,
  ADD COLUMN IF NOT EXISTS dinner_menu_url text;

UPDATE public.destinations
SET lunch_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Lunch-Summer-Menu.pdf',
    dinner_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2026/08/Dinner-Summer-Menu.pdf',
    updated_at = now()
WHERE id = 'tingara';