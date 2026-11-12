-- =====================================================================
-- Categorías fijas (decisión del 12/11/2026)
-- La portada y los filtros de la página están diseñados para 4 categorías.
-- Desde el panel no se crean, no se borran y no se ocultan: solo se puede
-- cambiar el texto (nombre y descripción). La base lo hace cumplir aunque
-- alguien intente saltearse el panel.
-- =====================================================================

drop policy "categories: admin inserta" on public.categories;
drop policy "categories: admin borra" on public.categories;

revoke insert, update, delete on public.categories from authenticated;
-- solo estas columnas; slug, orden y visibilidad quedan fijos
grant update (name, description) on public.categories to authenticated;
