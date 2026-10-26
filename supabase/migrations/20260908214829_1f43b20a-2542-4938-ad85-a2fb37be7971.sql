ALTER TABLE public.destinations
ADD COLUMN IF NOT EXISTS vegetarian_menu_url TEXT,
ADD COLUMN IF NOT EXISTS vegan_menu_url TEXT;

UPDATE public.destinations
SET vegetarian_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/05/La-Maison-1888-Michelin-Vegetarian-Dinner-Menu-Q3.26.pdf',
    vegan_menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/05/La-Maison-1888-Michelin-Vegan-Dinner-Menu-Q3.26.pdf',
    updated_at = now()
WHERE id = 'la-maison-1888';