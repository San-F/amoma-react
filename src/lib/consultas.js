// Envío del formulario de contacto a la base (función submit_inquiry).
// El cliente de Supabase se descarga recién al enviar.

export const guardaConsultas = Boolean(import.meta.env.VITE_SUPABASE_URL);

export async function enviarConsulta(form) {
  const { supabase } = await import("./supabase");
  const { error } = await supabase.rpc("submit_inquiry", {
    p_name: form.nombre,
    p_email: form.email,
    p_phone: form.telefono,
    p_reason: form.motivo,
    p_message: form.mensaje,
    p_contact_pref: form.preferencia,
    p_website: form.website,
  });
  if (!error) return;
  console.error(error);
  if (error.message?.includes("demasiados_envios")) {
    throw new Error(
      "Recibimos varias consultas seguidas. Probá en un rato o escribinos por WhatsApp.",
    );
  }
  if (error.code === "23514" || error.code === "22023") {
    throw new Error(
      "Revisá los datos: el email o el teléfono parecen tener un error.",
    );
  }
  throw new Error(
    "No pudimos enviar la consulta. Probá de nuevo o escribinos por WhatsApp.",
  );
}
