UPDATE public.destinations
SET level_id = 'sea',
    cluster = NULL,
    type = 'service',
    discover_url = 'https://www.danang.intercontinental.com/spas/nail-and-hair-studio/',
    menu_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/01/The-Nail-Hair-Studio-Brochure.pdf',
    price_list_url = 'https://www.danang.intercontinental.com/wp-content/uploads/2025/07/The-Nail-Hair-Studio-Price-List.Jul2025.pdf',
    booking_url = 'https://www.danang.intercontinental.com/spas/nail-and-hair-studio/',
    booking_message = 'Hello, I''m interested in booking The Nail & Hair Studio. Could you please assist me?',
    image_key = 'd-nail-studio',
    display_order = 2
WHERE id = 'nail-hair';

UPDATE public.destinations SET display_order = 3 WHERE id = 'marine-centre';
UPDATE public.destinations SET display_order = 4 WHERE id = 'coconut-beach';
UPDATE public.destinations SET display_order = 5 WHERE id = 'family-beach';
UPDATE public.destinations SET display_order = 6 WHERE id = 'club-beach';
UPDATE public.destinations SET display_order = 7 WHERE id = 'spa-lagoon-villas';
UPDATE public.destinations SET display_order = 8 WHERE id = 'sea-experiences';