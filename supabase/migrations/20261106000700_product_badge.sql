-- =====================================================================
-- Amoma — etiqueta opcional por producto ("Más pedido", "Nuevo",
-- "De temporada"). La elige la dueña desde el panel.
-- =====================================================================
alter table public.products
  add column badge text
  check (badge in ('mas-pedido', 'nuevo', 'temporada'));
