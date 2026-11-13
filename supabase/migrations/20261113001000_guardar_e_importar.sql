-- =====================================================================
-- Amoma — guardar un producto "todo o nada" + importación que no pisa
-- lo que la dueña no tocó (auditoría del 13/11/2026: A3 y A5)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Guardar un producto con sus precios en UNA transacción.
-- Antes el panel hacía 3 pedidos (producto, borrar precios, cargar
-- precios): si se cortaba en el medio, el producto quedaba sin precios.
-- security invoker: las políticas RLS siguen aplicando.
--
-- { "id": "…" (vacío = nuevo), "slug": "lemon-pie", "name": "Lemon pie",
--   "category_id": "…", "short_description": "…", "description": "…",
--   "is_published": true, "is_featured": false, "badge": "nuevo",
--   "variants": [ { "label": "Chica", "servings": 8, "price_cents": 1800000 } ] }
--
-- El slug se fija al crear y NO cambia al renombrar: es el identificador
-- estable (planilla de Excel, pedidos a medio armar de los clientes).
-- =====================================================================
create function public.admin_save_product(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  prod_id   uuid := nullif(payload ->> 'id', '')::uuid;
  variantes jsonb := coalesce(payload -> 'variants', '[]'::jsonb);
  variant   jsonb;
  orden     integer := 0;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;
  if jsonb_typeof(variantes) is distinct from 'array' or jsonb_array_length(variantes) > 30 then
    raise exception 'Formato inválido: precios' using errcode = '22023';
  end if;
  if coalesce((payload ->> 'is_published')::boolean, false) and jsonb_array_length(variantes) = 0 then
    raise exception 'Para publicarlo, cargá al menos un precio.' using errcode = '22023';
  end if;

  if prod_id is null then
    insert into public.products
      (slug, name, category_id, short_description, description,
       is_published, is_featured, badge, sort_order)
    values (
      payload ->> 'slug',
      payload ->> 'name',
      nullif(payload ->> 'category_id', '')::uuid,
      nullif(payload ->> 'short_description', ''),
      nullif(payload ->> 'description', ''),
      coalesce((payload ->> 'is_published')::boolean, false),
      coalesce((payload ->> 'is_featured')::boolean, false),
      nullif(payload ->> 'badge', ''),
      (select coalesce(max(p.sort_order), 0) + 1 from public.products p)
    )
    returning id into prod_id;
  else
    update public.products p
       set name              = payload ->> 'name',
           category_id       = nullif(payload ->> 'category_id', '')::uuid,
           short_description = nullif(payload ->> 'short_description', ''),
           description       = nullif(payload ->> 'description', ''),
           is_published      = coalesce((payload ->> 'is_published')::boolean, false),
           is_featured       = coalesce((payload ->> 'is_featured')::boolean, false),
           badge             = nullif(payload ->> 'badge', '')
     where p.id = prod_id;
    if not found then
      raise exception 'El producto ya no existe.' using errcode = '22023';
    end if;
  end if;

  delete from public.product_variants v where v.product_id = prod_id;
  for variant in select * from jsonb_array_elements(variantes)
  loop
    insert into public.product_variants (product_id, label, servings, price_cents, sort_order)
    values (
      prod_id,
      variant ->> 'label',
      nullif(variant ->> 'servings', '')::integer,
      (variant ->> 'price_cents')::bigint,
      orden
    );
    orden := orden + 1;
  end loop;

  return prod_id;
end;
$$;

revoke all on function public.admin_save_product(jsonb) from public, anon;
grant execute on function public.admin_save_product(jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- Mostrar/ocultar desde la lista: no se puede mostrar algo sin precio.
-- ---------------------------------------------------------------------
create function private.exigir_precio_al_publicar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and not old.is_published
     and not exists (select 1 from public.product_variants v where v.product_id = new.id) then
    raise exception 'Para publicarlo, cargá al menos un precio.' using errcode = '22023';
  end if;
  return new;
end;
$$;

-- "deferrable initially deferred": se controla al terminar la transacción,
-- así guardar producto + precios juntos (o importar) no choca con la regla.
create constraint trigger products_precio_al_publicar
  after update of is_published on public.products
  deferrable initially deferred
  for each row execute function private.exigir_precio_al_publicar();

-- ---------------------------------------------------------------------
-- Importación desde Excel: mismo formato que antes, con estas reglas:
--   · "is_published" ausente o null  → un producto que ya existe queda como
--     estaba (antes se volvía a mostrar lo oculto); uno nuevo nace visible.
--   · un producto que ya existe NO cambia de lugar; los nuevos van al final.
--   · categoría vacía → el que ya existe conserva la suya.
-- =====================================================================
create or replace function public.admin_import_catalog(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  item         jsonb;
  variant      jsonb;
  cat_id       uuid;
  prod_id      uuid;
  creados      integer := 0;
  actualizados integer := 0;
  variantes    integer := 0;
  orden        integer;
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
    cat_id := null;
    if coalesce(item ->> 'category_slug', '') <> '' then
      select c.id into cat_id from public.categories c where c.slug = item ->> 'category_slug';
      if cat_id is null then
        raise exception 'Fila de "%": la categoría "%" no existe', item ->> 'name', item ->> 'category_slug'
          using errcode = '22023';
      end if;
    end if;

    prod_id := null;
    select p.id into prod_id from public.products p where p.slug = item ->> 'slug';

    if prod_id is null then
      select coalesce(max(p.sort_order), 0) + 1 into orden from public.products p;
      insert into public.products (slug, name, category_id, short_description, is_published, sort_order)
      values (
        item ->> 'slug',
        item ->> 'name',
        cat_id,
        nullif(item ->> 'short_description', ''),
        coalesce((item ->> 'is_published')::boolean, true),
        orden
      )
      returning id into prod_id;
      creados := creados + 1;
    else
      update public.products p
         set name              = item ->> 'name',
             category_id       = coalesce(cat_id, p.category_id),
             short_description = coalesce(nullif(item ->> 'short_description', ''), p.short_description),
             is_published      = coalesce((item ->> 'is_published')::boolean, p.is_published)
       where p.id = prod_id;
      actualizados := actualizados + 1;
    end if;

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

    -- foto de portada (opcional; el panel ya la subió al Storage)
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
