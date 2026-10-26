/* Lee de la web pública de la FFCM los datos del grupo y los guarda en data/ffcm-<equipo>.json
   para que las plantillas se rellenen solas. Lo ejecuta la GitHub Action de los lunes.

   Se leen: fechas de cada jornada, clasificación y, de la última y las próximas jornadas,
   los partidos con equipos, fecha, hora y pabellón.

   Los marcadores de los partidos NO se leen: la FFCM los camufla a propósito para que no se
   extraigan de forma automática. Lo que sí publica sin camuflar es la clasificación de cada
   jornada con los goles a favor y en contra de cada equipo, así que el resultado de un
   partido ya jugado se calcula restando la clasificación de esa jornada menos la de la
   anterior (y se comprueba que cuadre por los dos lados).

   Uso: node herramientas/ffcm.mjs */

import { writeFile } from "node:fs/promises";

const BASE = "https://www.ffcm.es/pnfg";

// Grupo de cada equipo en la FFCM (de la URL NFG_VisGrupos_Vis?...&codgrupo=...).
const GRUPOS = {
  senior: { temporada: 22, competicion: 22916226, grupo: 23193707 },
  juvenil: { temporada: 22, competicion: 23352276, grupo: 23382105 },
};

const UA = "Mozilla/5.0 (compatible; EstudioTorrenueva/1.0; +https://estudio-torrenueva.vercel.app)";

/* La web funciona con una cookie de sesión: la primera visita redirige a NLogin, que la da,
   y a NLogin?NSess=1, que la activa. Se siguen las redirecciones a mano guardando las
   cookies, como haría un navegador. */
const cookies = new Map();
const cabecera = () => [...cookies].map(([k, v]) => `${k}=${v}`).join("; ");

async function pedir(url) {
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { redirect: "manual", headers: { "User-Agent": UA, Cookie: cabecera() } });
    for (const c of r.headers.getSetCookie?.() || []) {
      const [k, v] = c.split(";")[0].split("=");
      cookies.set(k.trim(), v);
    }
    const loc = r.headers.get("location");
    if (r.status >= 300 && r.status < 400 && loc) {
      url = new URL(loc, url).href;
      continue;
    }
    return r;
  }
  throw new Error("Demasiadas redirecciones en la web de la FFCM");
}

async function pagina(ruta) {
  const url = `${BASE}/NPcd/${ruta}`;
  let r = await pedir(url);
  // Si la sesión no estaba activa se acaba en otra página tras el login: se repite.
  if (!r.url.includes("/NPcd/")) r = await pedir(url);
  if (!r.ok) throw new Error(`La FFCM respondió ${r.status} en ${ruta}`);
  return new TextDecoder("iso-8859-15").decode(await r.arrayBuffer());
}

const ENTIDADES = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&Aacute;": "Á", "&Eacute;": "É",
  "&Iacute;": "Í", "&Oacute;": "Ó", "&Uacute;": "Ú", "&Ntilde;": "Ñ", "&aacute;": "á", "&eacute;": "é",
  "&iacute;": "í", "&oacute;": "ó", "&uacute;": "ú", "&ntilde;": "ñ" };
const limpiar = (t) => t.replace(/&[a-zA-Z#0-9]+;/g, (e) => ENTIDADES[e] ?? " ").replace(/\s+/g, " ").trim();
const iso = (f) => f.split("-").reverse().join("-"); // "24-10-2026" -> "2026-10-24"

function leerCalendario(html) {
  return [...html.matchAll(/Jornada\s*(\d+)[^(]{0,300}?\((\d\d-\d\d-\d{4})\)/g)].map((m) => ({
    n: Number(m[1]),
    fecha: iso(m[2]),
  }));
}

function leerClasificacion(html) {
  // Solo la primera tabla (la detallada); luego viene otra resumida con los mismos equipos.
  const fin = html.indexOf("Jornada Anterior");
  const filas = [];
  for (const tr of (fin > 0 ? html.slice(0, fin) : html).split(/<tr[\s>]/).slice(1)) {
    const equipo = tr.match(/NFG_VisCompeticiones_Grupo[^>]*>([^<]+)<\/a>/);
    if (!equipo) continue;
    const celdas = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => limpiar(c[1].replace(/<[^>]+>/g, " ")));
    // [color, pos, equipo, pts/pj, pts, J G E P en casa, J G E P fuera, F, C, ...]
    const num = (i) => Number(celdas[i]) || 0;
    const nombre = limpiar(equipo[1]);
    // Antes de la primera jornada no hay "Jornada Anterior" y entran las dos tablas:
    // cada equipo solo una vez.
    if (filas.some((f) => f.equipo === nombre)) continue;
    filas.push({ pos: num(1), equipo: nombre, pts: num(4), pj: num(5) + num(9), gf: num(13), gc: num(14) });
  }
  return filas;
}

function leerJornada(html) {
  const partidos = [];
  let descansa = null;
  for (const b of html.split('<td width="40%" align=left class=td_widget').slice(1)) {
    const local = b.match(/font_widgetL"?>\s*<h4>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    const visitante = b.match(/font_widgetV"?>\s*<h4>\s*<a[^>]*>([^<]+)<\/a>/);
    const horario = [...b.matchAll(/class=horario[^>]*>\s*([^<]+?)\s*</g)].map((m) => m[1]);
    const campo = b.match(/NFG_VisCampos[^>]*>\s*([^<]+?)\s*<\/a>/);
    // El equipo que descansa aparece como un "partido" sin fecha.
    if (!horario.length) {
      if (local) descansa = limpiar(local[1]);
      continue;
    }
    partidos.push({
      local: local ? limpiar(local[1]) : "",
      visitante: visitante ? limpiar(visitante[1]) : "",
      fecha: horario[0] ? iso(horario[0]) : "",
      hora: horario[1] || "",
      campo: campo ? limpiar(campo[1]) : "",
    });
  }
  return { descansa, partidos };
}

/* Resultado de cada partido de la jornada n a partir de la clasificación tras la jornada n
   y tras la n-1: los goles de cada equipo son lo que han subido sus goles a favor. Solo se
   da por bueno si cuadra por los dos lados (lo que marca uno es lo que encaja el otro) y
   los dos equipos suman exactamente un partido jugado; si no (aplazado, sanción…), null. */
function calcularResultados(partidos, antes, despues) {
  const indice = (tabla) => new Map(tabla.map((f) => [f.equipo, f]));
  const [a, d] = [indice(antes), indice(despues)];
  const cero = { gf: 0, gc: 0, pj: 0 };
  for (const p of partidos) {
    const [la, ld] = [a.get(p.local) || cero, d.get(p.local)];
    const [va, vd] = [a.get(p.visitante) || cero, d.get(p.visitante)];
    p.goles = null;
    if (!ld || !vd) continue;
    const local = ld.gf - la.gf;
    const visitante = vd.gf - va.gf;
    const cuadra =
      ld.gc - la.gc === visitante && vd.gc - va.gc === local && ld.pj - la.pj === 1 && vd.pj - va.pj === 1;
    if (cuadra) p.goles = [local, visitante];
  }
}

async function leerGrupo(g) {
  const comun = `cod_primaria=1000120&codtemporada=${g.temporada}&codcompeticion=${g.competicion}&codgrupo=${g.grupo}`;
  const urlClasificacion = (n) =>
    `NFG_VisClasificacion?cod_primaria=1000120&codgrupo=${g.grupo}&codcompeticion=${g.competicion}` +
    (n ? `&codjornada=${n}` : "");
  const cal = await pagina(`NFG_VisCalendario_Vis?${comun}`);
  const clas = await pagina(urlClasificacion());
  const jornadas = leerCalendario(cal);
  if (!jornadas.length) throw new Error("La FFCM ha devuelto el calendario vacío");

  // Clasificación tras cada jornada (la 0 es todo a cero), pedida una sola vez cada una.
  const clasificaciones = new Map([[0, []]]);
  const clasificacionTras = async (n) => {
    if (!clasificaciones.has(n)) clasificaciones.set(n, leerClasificacion(await pagina(urlClasificacion(n))));
    return clasificaciones.get(n);
  };

  // Partidos de la última jornada ya llegada y de las dos siguientes: así sirven toda la
  // semana aunque la Action no vuelva a ejecutarse hasta el lunes siguiente.
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const i = jornadas.findIndex((j) => j.fecha >= hoy);
  const desde = Math.max(0, (i < 0 ? jornadas.length : i) - 1);
  const partidos = {};
  for (const j of jornadas.slice(desde, desde + 3)) {
    partidos[j.n] = leerJornada(
      await pagina(`NFG_CmpJornada?cod_primaria=1000120&CodCompeticion=${g.competicion}&CodGrupo=${g.grupo}&CodTemporada=${g.temporada}&CodJornada=${j.n}`),
    );
    // Resultados solo de jornadas ya pasadas (el día de partido aún no están).
    if (j.fecha < hoy) {
      calcularResultados(partidos[j.n].partidos, await clasificacionTras(j.n - 1), await clasificacionTras(j.n));
    }
  }
  return { actualizado: new Date().toISOString(), jornadas, clasificacion: leerClasificacion(clas), partidos };
}

for (const [equipo, g] of Object.entries(GRUPOS)) {
  try {
    const datos = await leerGrupo(g);
    await writeFile(`data/ffcm-${equipo}.json`, JSON.stringify(datos, null, 1) + "\n");
    console.log(`${equipo}: ${datos.clasificacion.length} equipos, jornadas con partidos ${Object.keys(datos.partidos)}`);
  } catch (e) {
    console.error(`${equipo}: ${e.message}`);
    process.exitCode = 1;
  }
}
