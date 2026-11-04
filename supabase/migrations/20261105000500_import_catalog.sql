-- =====================================================================
-- Amoma — importación del catálogo desde Excel/CSV
--
-- El panel lee la planilla, la valida y manda un JSON a esta función.
-- Todo se aplica en UNA transacción: o entra todo, o no entra nada.
-- security invoker: corre con los permisos de quien llama, así que las
-- políticas RLS siguen aplicando (solo un admin con MFA puede escribir).
--
-- Formato:
-- { "products": [ {
--     "slug": "lemon-pie", "name": "Lemon pie", "category_slug": "postres",
--     "short_description": "...", "is_published": true,
--     "cover_path": "productos/lemon-pie/abc.webp",          -- opcional
--     "variants": [ { "label": "Chica", "servings": 8, "price_cents": 1800000 } ]
-- } ] }
--
-- Reglas: el producto se identifica por slug (se actualiza si ya existe).
-- Las variantes del producto se REEMPLAZAN por las de la planilla
-- (la planilla es la fuente de verdad de los precios).
-- =====================================================================

create function public.admin_import_catalog(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item       jsonb;
  variant    jsonb;
  cat_id     uuid;
  prod_id    uuid;
  existed    boolean;
  creados    integer := 0;
  actualizados integer := 0;
  variantes  integer := 0;
  orden      integer := 0;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  if jsonb_typeof(payload -> 'products') is distinct from 'array' then
    raise exception 'Formato inválido: falta la lista "products"' using errcode = '22023';
  end if;

  if jsonb_array_length(payload -> 'products') > 500 then
    raise exception 'Demasiados productos en una sola importación (máx. 500)' using errcode = '22023';
  end if;

  for item in select * from jsonb_array_elements(payload -> 'products')
  loop
    orden := orden + 1;

    cat_id := null;
    if coalesce(item ->> 'category_slug', '') <> '' then
      select c.id into cat_id from public.categories c where c.slug = item ->> 'category_slug';
      if cat_id is null then
        raise exception 'Fila de "%": la categoría "%" no existe', item ->> 'name', item ->> 'category_slug'
          using errcode = '22023';
      end if;
    end if;

    select exists (select 1 from public.products p where p.slug = item ->> 'slug') into existed;

    insert into public.products (slug, name, category_id, short_description, is_published, sort_order)
    values (
      item ->> 'slug',
      item ->> 'name',
      cat_id,
      nullif(item ->> 'short_description', ''),
      coalesce((item ->> 'is_published')::boolean, false),
      orden
    )
    on conflict (slug) do update
      set name              = excluded.name,
          category_id       = excluded.category_id,
          short_description = coalesce(excluded.short_description, public.products.short_description),
          is_published      = excluded.is_published,
          sort_order        = excluded.sort_order
    returning id into prod_id;

    if existed then actualizados := actualizados + 1; else creados := creados + 1; end if;

    -- precios: la planilla manda
    delete from public.product_variants v where v.product_id = prod_id;
    for variant in select * from jsonb_array_elements(coalesce(item -> 'variants', '[]'::jsonb))
    loop
      insert into public.product_variants (product_id, label, servings, price_cents, sort_order)
      values (
        prod_id,
        variant ->> 'label',
        nullif(variant ->> 'servings', '')::integer,
        (variant ->> 'price_cents')::bigint,
        variantes
      );
      variantes := variantes + 1;
    end loop;

    -- foto de portada (ya subida al Storage por el panel)
    if coalesce(item ->> 'cover_path', '') <> '' then
      update public.product_images i set is_cover = false
        where i.product_id = prod_id and i.is_cover and i.storage_path <> item ->> 'cover_path';
      if exists (
        select 1 from public.product_images i
        where i.product_id = prod_id and i.storage_path = item ->> 'cover_path'
      ) then
        update public.product_images i set is_cover = true
          where i.product_id = prod_id and i.storage_path = item ->> 'cover_path';
      else
        insert into public.product_images (product_id, storage_path, alt_text, is_cover)
        values (prod_id, item ->> 'cover_path', left(item ->> 'name', 200), true);
      end if;
    end if;
  end loop;

  return jsonb_build_object('creados', creados, 'actualizados', actualizados, 'variantes', variantes);
end;
$$;

revoke all on function public.admin_import_catalog(jsonb) from public, anon;
grant execute on function public.admin_import_catalog(jsonb) to authenticated;
