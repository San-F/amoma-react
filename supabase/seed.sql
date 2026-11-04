-- Datos iniciales (tomados de la página actual). Sin precios: los carga
-- la dueña desde el panel; no inventamos precios.

insert into public.site_settings (id, whatsapp, instagram, address)
values (1, '5491136362466', 'amoma.cakeshop', 'Villa Pueyrredón, CABA')
on conflict (id) do nothing;

insert into public.categories (slug, name, description, sort_order, is_published)
values
  ('tortas', 'Tortas', 'Clásicas y caseras, con ingredientes de primera.', 1, true),
  ('postres', 'Tartas y postres', 'Tartas, porciones y cajitas para regalar.', 2, true),
  ('personalizadas', 'Tortas personalizadas',
   'Para cumpleaños, casamientos y eventos.', 3, true)
on conflict (slug) do nothing;
