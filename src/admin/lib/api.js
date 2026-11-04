// Acceso a datos del panel. Cada función devuelve datos o lanza un Error
// con un mensaje entendible (nunca el detalle técnico al usuario).
import { BUCKET, supabase, urlPublica } from "../../lib/supabase";
import { comprimirImagen, rutaNueva } from "./images";

function fallar(error, texto) {
  // el detalle técnico queda en la consola del admin para diagnosticar
  console.error(error);
  throw new Error(texto);
}

export async function listarCategorias() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) fallar(error, "No se pudieron cargar las categorías.");
  return data;
}

export async function guardarCategoria(cat) {
  const { id, ...campos } = cat;
  const q = id
    ? supabase.from("categories").update(campos).eq("id", id)
    : supabase.from("categories").insert(campos);
  const { error } = await q;
  if (error)
    fallar(
      error,
      error.code === "23505"
        ? "Ya existe una categoría con ese nombre."
        : "No se pudo guardar la categoría.",
    );
}

export async function listarProductos() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, slug, name, is_published, is_featured, sort_order, category:categories(name), variants:product_variants(price_cents), images:product_images(storage_path, is_cover)",
    )
    .order("sort_order");
  if (error) fallar(error, "No se pudieron cargar los productos.");
  return data.map((p) => ({
    ...p,
    portada: urlPublica(
      (p.images.find((i) => i.is_cover) ?? p.images[0])?.storage_path,
    ),
    desde: p.variants.length
      ? Math.min(...p.variants.map((v) => v.price_cents))
      : null,
  }));
}

export async function obtenerProducto(id) {
  const { data, error } = await supabase
    .from("products")
    .select("*, variants:product_variants(*), images:product_images(*)")
    .eq("id", id)
    .single();
  if (error) fallar(error, "No se encontró el producto.");
  data.variants.sort((a, b) => a.sort_order - b.sort_order);
  data.images.sort(
    (a, b) =>
      Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
  return data;
}

export async function guardarProducto(producto, variantes) {
  const { id, ...campos } = producto;
  let productoId = id;
  if (id) {
    const { error } = await supabase
      .from("products")
      .update(campos)
      .eq("id", id);
    if (error)
      fallar(
        error,
        error.code === "23505"
          ? "Ya existe un producto con ese nombre."
          : "No se pudo guardar el producto.",
      );
  } else {
    const { data, error } = await supabase
      .from("products")
      .insert(campos)
      .select("id")
      .single();
    if (error)
      fallar(
        error,
        error.code === "23505"
          ? "Ya existe un producto con ese nombre."
          : "No se pudo crear el producto.",
      );
    productoId = data.id;
  }
  // precios: se reemplazan por los del formulario
  const del = await supabase
    .from("product_variants")
    .delete()
    .eq("product_id", productoId);
  if (del.error) fallar(del.error, "No se pudieron actualizar los precios.");
  if (variantes.length) {
    const filas = variantes.map((v, i) => ({
      ...v,
      product_id: productoId,
      sort_order: i,
    }));
    const ins = await supabase.from("product_variants").insert(filas);
    if (ins.error) fallar(ins.error, "No se pudieron guardar los precios.");
  }
  return productoId;
}

export async function cambiarPublicado(id, is_published) {
  const { error } = await supabase
    .from("products")
    .update({ is_published })
    .eq("id", id);
  if (error) fallar(error, "No se pudo cambiar la visibilidad.");
}

export async function borrarProducto(id) {
  const { data: imgs } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) fallar(error, "No se pudo borrar el producto.");
  if (imgs?.length)
    await supabase.storage.from(BUCKET).remove(imgs.map((i) => i.storage_path));
}

export async function subirFoto(file, carpeta) {
  const { blob, width, height } = await comprimirImagen(file);
  const path = rutaNueva(carpeta);
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) fallar(error, `No se pudo subir "${file.name}".`);
  return { path, width, height };
}

export async function agregarImagen(productoId, file, alt, esPortada) {
  const { path, width, height } = await subirFoto(
    file,
    `productos/${productoId}`,
  );
  if (esPortada) {
    await supabase
      .from("product_images")
      .update({ is_cover: false })
      .eq("product_id", productoId);
  }
  const { error } = await supabase.from("product_images").insert({
    product_id: productoId,
    storage_path: path,
    alt_text: alt.slice(0, 200),
    width,
    height,
    is_cover: esPortada,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    fallar(error, "No se pudo guardar la foto.");
  }
}

export async function marcarPortada(productoId, imagenId) {
  await supabase
    .from("product_images")
    .update({ is_cover: false })
    .eq("product_id", productoId);
  const { error } = await supabase
    .from("product_images")
    .update({ is_cover: true })
    .eq("id", imagenId);
  if (error) fallar(error, "No se pudo marcar la portada.");
}

export async function borrarImagen(imagen) {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imagen.id);
  if (error) fallar(error, "No se pudo borrar la foto.");
  await supabase.storage.from(BUCKET).remove([imagen.storage_path]);
}

export async function importarCatalogo(productos) {
  const { data, error } = await supabase.rpc("admin_import_catalog", {
    payload: { products: productos },
  });
  if (error)
    fallar(
      error,
      error.code === "22023"
        ? error.message
        : "No se pudo importar. No se guardó nada.",
    );
  return data;
}

export async function borrarArchivos(paths) {
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

export async function listarConsultas(estado) {
  let q = supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (estado !== "todas") q = q.eq("status", estado);
  const { data, error } = await q;
  if (error) fallar(error, "No se pudieron cargar las consultas.");
  return data;
}

export async function cambiarEstadoConsulta(id, status) {
  const { error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id);
  if (error) fallar(error, "No se pudo actualizar la consulta.");
}

export async function obtenerAjustes() {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) fallar(error, "No se pudieron cargar los ajustes.");
  return data ?? { id: 1 };
}

export async function guardarAjustes(ajustes) {
  const { id: _id, updated_at: _u, ...campos } = ajustes;
  const { error } = await supabase
    .from("site_settings")
    .update(campos)
    .eq("id", 1);
  if (error)
    fallar(
      error,
      error.code === "23514"
        ? "Revisá los datos: el WhatsApp va solo con números (ej. 5491112345678)."
        : "No se pudieron guardar los ajustes.",
    );
}

export async function resumen() {
  const [p, c] = await Promise.all([
    supabase.from("products").select("is_published"),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);
  if (p.error) fallar(p.error, "No se pudo cargar el resumen.");
  return {
    publicados: p.data.filter((x) => x.is_published).length,
    ocultos: p.data.filter((x) => !x.is_published).length,
    consultasNuevas: c.count ?? 0,
  };
}

// ---------- galería ----------

export async function listarGaleria() {
  const { data, error } = await supabase
    .from("gallery_items")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) fallar(error, "No se pudo cargar la galería.");
  return data.map((g) => ({ ...g, url: urlPublica(g.storage_path) }));
}

export async function agregarFotoGaleria(file, alt, orden) {
  const { path, width, height } = await subirFoto(file, "galeria");
  const { error } = await supabase.from("gallery_items").insert({
    storage_path: path,
    alt_text: alt.slice(0, 200),
    width,
    height,
    sort_order: orden,
    is_published: true,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    fallar(error, `No se pudo guardar "${file.name}".`);
  }
}

export async function cambiarFotoGaleria(id, campos) {
  const { error } = await supabase
    .from("gallery_items")
    .update(campos)
    .eq("id", id);
  if (error) fallar(error, "No se pudo actualizar la foto.");
}

// guarda el orden según la posición en la lista (solo actualiza lo que cambió)
export async function reordenarGaleria(lista) {
  const cambios = lista
    .map((g, i) => ({ id: g.id, antes: g.sort_order, ahora: i }))
    .filter((c) => c.antes !== c.ahora);
  for (const c of cambios) {
    const { error } = await supabase
      .from("gallery_items")
      .update({ sort_order: c.ahora })
      .eq("id", c.id);
    if (error) fallar(error, "No se pudo cambiar el orden.");
  }
}

export async function borrarFotoGaleria(item) {
  const { error } = await supabase
    .from("gallery_items")
    .delete()
    .eq("id", item.id);
  if (error) fallar(error, "No se pudo borrar la foto.");
  await supabase.storage.from(BUCKET).remove([item.storage_path]);
}
