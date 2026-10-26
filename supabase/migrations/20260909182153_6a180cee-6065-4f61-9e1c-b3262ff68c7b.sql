ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS breakfast_menu_url text;

UPDATE public.destinations SET menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2026/09/Terra-Mare-A-la-carte-Menu.pdf', updated_at = now() WHERE id = 'terra-mare';

UPDATE public.destinations SET breakfast_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2024/06/Citron-Highlights-Breakfast.pdf', lunch_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/Citron-Lunch-Menu-Highlights.Feb2026.pdf', dinner_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/Citron-Dinner-Menu-Highlights.Feb2026.pdf', updated_at = now() WHERE id = 'citron';

UPDATE public.destinations SET menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2026/02/Long-Bar-Menu-Highlights.Feb2026.pdf', updated_at = now() WHERE id = 'long-bar';