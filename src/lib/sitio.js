// Datos del sitio público: arranca con el contenido fijo (data/catalog.js) y,
// si Supabase está configurado, lo reemplaza por lo que cargó la dueña.
// Si la base falla o está vacía, la página sigue mostrando el contenido fijo.
import { useSyncExternalStore } from "react";
import {
  galeria as galeriaBase,
  negocio as negocioBase,
  productos as productosBase,
} from "../data/catalog";
import { fotos } from "../data/images";
import { desdeFila } from "./encuadre";

// temáticas de ejemplo para "Tortas personalizadas" (se reemplazan por las
// 3 primeras fotos de la galería cuando la dueña las sube)
const tematicasBase = [fotos.arcoiris, fotos.surf, fotos.calabaza];

let estado = {
  negocio: negocioBase,
  productos: productosBase,
  galeria: galeriaBase,
  tematicas: tematicasBase,
  desdeBase: false,
  // false mientras se espera a la base (si hay base configurada)
  listo: !import.meta.env.VITE_SUPABASE_URL,
};
const suscriptos = new Set();
let iniciado = false;

function emitir(cambios) {
  estado = { ...estado, ...cambios };
  suscriptos.forEach((fn) => fn());
}

// "5491136362466" → "11 3636 2466"
export function telefonoVisible(whatsapp) {
  const local = String(whatsapp ?? "").replace(/^549/, "");
  return /^\d{10}$/.test(local)
    ? `${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`
    : local;
}

async function iniciar() {
  if (iniciado) return;
  iniciado = true;
  // sin configuración no se descarga ni el cliente de Supabase
  if (!import.meta.env.VITE_SUPABASE_URL) return;
  try {
    const { supabase, urlPublica } = await import("./supabase");
    const [ajustes, productos, galeria] = await Promise.all([
      supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("products")
        .select(
          "slug, name, badge, short_description, description, sort_order, category:categories(slug), variants:product_variants(label, servings, price_cents, is_available, sort_order), images:product_images(storage_path, alt_text, width, height, is_cover, sort_order, focus_x, focus_y, zoom)",
        )
        .order("sort_order"),
      supabase
        .from("gallery_items")
        .select("storage_path, alt_text, width, height, sort_order")
        .order("sort_order"),
    ]);

    const cambios = {};
    const a = ajustes.data;
    if (a) {
      cambios.negocio = {
        ...negocioBase,
        whatsapp: a.whatsapp || negocioBase.whatsapp,
        telefonoVisible: a.whatsapp
          ? telefonoVisible(a.whatsapp)
          : negocioBase.telefonoVisible,
        instagram: a.instagram || negocioBase.instagram,
        zona: a.address || negocioBase.zona,
        horarios: a.hours || null,
        aviso: a.notice || null,
      };
    }
    const conFoto = (productos.data ?? [])
      .map((p) => {
        const imgs = [...p.images].sort(
          (x, y) =>
            Number(y.is_cover) - Number(x.is_cover) ||
            x.sort_order - y.sort_order,
        );
        const img = imgs[0];
        return {
          id: p.slug,
          categoria: p.category?.slug ?? "otras",
          nombre: p.name,
          etiqueta: p.badge ?? null,
          descripcion: p.short_description ?? "",
          foto: img
            ? {
                src: urlPublica(img.storage_path),
                alt: img.alt_text || p.name,
                width: img.width,
                height: img.height,
                encuadre: desdeFila(img),
              }
            : null,
          variantes: p.variants
            .filter((v) => v.is_available)
            .sort((x, y) => x.sort_order - y.sort_order)
            .map((v) => ({
              id: v.label,
              nombre: v.label,
              porciones: v.servings,
              precio: v.price_cents,
            })),
        };
      })
      .filter((p) => p.foto); // sin foto no se muestra en la grilla
    if (conFoto.length) {
      cambios.productos = conFoto;
      cambios.desdeBase = true;
    }
    if (galeria.data?.length) {
      cambios.galeria = galeria.data.map((g) => ({
        src: urlPublica(g.storage_path),
        alt: g.alt_text || "Torta de Amoma",
        width: g.width,
        height: g.height,
      }));
      if (cambios.galeria.length >= 3)
        cambios.tematicas = cambios.galeria.slice(0, 3);
    }
    const problema = ajustes.error ?? productos.error ?? galeria.error;
    if (problema) console.warn("Supabase:", problema);
    emitir({ ...cambios, listo: true });
  } catch (err) {
    console.warn(
      "No se pudo cargar el catálogo; se muestra el contenido fijo.",
      err,
    );
    emitir({ listo: true });
  }
}

function suscribir(fn) {
  suscriptos.add(fn);
  iniciar();
  return () => suscriptos.delete(fn);
}

export function useSitio() {
  return useSyncExternalStore(suscribir, () => estado);
}
