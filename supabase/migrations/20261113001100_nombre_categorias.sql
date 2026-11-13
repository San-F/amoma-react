-- =====================================================================
-- Amoma — categorías: la dueña cambia SOLO el nombre (decisión del 13/11/2026)
-- Las 4 tarjetas y sus fotos son fijas (diseño). El nombre se ve en la
-- tarjeta de la portada y en el filtro del catálogo: máximo 30 letras para
-- que entre en el diseño.
-- =====================================================================

alter table public.categories drop constraint categories_name_check;
alter table public.categories
  add constraint categories_name_check
  check (char_length(btrim(name)) between 1 and 30);

revoke update on public.categories from authenticated;
grant update (name) on public.categories to authenticated;
