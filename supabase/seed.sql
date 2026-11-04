-- Datos iniciales (tomados de la página actual). Sin precios: los carga
-- la dueña desde el panel; no inventamos precios.

insert into public.site_settings (id, whatsapp, instagram, address)
values (1, '5491136362466', 'amoma.cakeshop', 'Villa Pueyrredón, CABA')
on conflict (id) do nothing;

insert into public.categories (slug, name, description, sort_order, is_published)
values
  ('tortas', 'Tortas', 'Hechas con ingredientes de primera calidad.', 1, true),
  ('postres-individuales', 'Postres individuales',
   'Cupcakes, cheesecake, volcán y porciones listas para disfrutar.', 2, true),
  ('tortas-personalizadas', 'Tortas personalizadas',
   'Las diseñamos a tu gusto para cumpleaños, casamientos y eventos especiales.', 3, true)
on conflict (slug) do nothing;
