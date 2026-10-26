ALTER TABLE public.destinations ADD COLUMN price_list_url text;

UPDATE public.destinations
SET menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/05/Mi-Sol-Spa-menu.pdf',
    price_list_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/12/TREATMENT-PRICE-LIST-Mi-Sol-Spa.pdf',
    booking_url = 'https://www.danang.intercontinental.com/spas/mi-sol-spa/'
WHERE id = 'mi-sol-spa';