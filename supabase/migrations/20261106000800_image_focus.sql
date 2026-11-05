-- =====================================================================
-- Amoma — encuadre de cada foto de producto (lo elige la dueña en el panel,
-- moviendo y acercando la foto dentro del círculo).
--   focus_x / focus_y: punto de la foto que queda centrado (0 a 100 %).
--   zoom: cuánto se acerca (1 = foto entera, hasta 3).
-- Los límites los controla la base, no solo la pantalla.
-- =====================================================================
alter table public.product_images
  add column focus_x numeric(5, 2) not null default 50
    check (focus_x between 0 and 100),
  add column focus_y numeric(5, 2) not null default 50
    check (focus_y between 0 and 100),
  add column zoom numeric(4, 2) not null default 1
    check (zoom between 1 and 3);
