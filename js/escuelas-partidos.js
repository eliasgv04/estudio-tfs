/* Plantilla ESCUELAS · PARTIDOS: los partidos del fin de semana de las cinco categorías.
   Misma identidad que las publicaciones de jornada (foto con borde desenfocado, título
   cursiva + Anton y velo oscuro), con los logos del club y del ayuntamiento.
   Cada fila: "LOCAL vs VISITANTE" (el nuestro en negrita) y debajo fecha, hora y lugar;
   si la categoría descansa, "<CATEGORÍA> FS descansa". */

const BAJA = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0;

const POST = {
  plantilla: "assets/plantillas/clasificacion.png", // solo líneas y patrocinadores
  filas: {
    arriba: 760, alto: 220, izquierda: 250, derecha: 1790, sangria: 34,
    equipos: { base: 0.47, altoMayus: 34 },
    datos: { base: 0.78, altoMayus: 27 },
  },
};

// Story: las filas, más altas y con todo más grande, llenan el cuadro alto.
const ARRIBA_STORY = POST.filas.arriba + BAJA + 200;
const STORY = {
  plantilla: Estudio.MARCO_STORY,
  filas: {
    ...POST.filas,
    arriba: ARRIBA_STORY,
    alto: Math.floor((Estudio.FORMATOS.story.caja.y1 - 140 - ARRIBA_STORY) / 5),
    equipos: { base: 0.45, altoMayus: 44 },
    datos: { base: 0.72, altoMayus: 35 },
  },
};

const { estado, FUTURA, FUTURA_CONDENSADA_MEDIA, PLAYFAIR_CURSIVA } = Estudio;
Object.assign(estado, { velo: 0.6 });

// Escribe trozos seguidos ([texto, fuente]) desde x; si no caben en `anchoMax`, los
// reduce a todos por igual.
function trozos(ctx, partes, tam, x, y, anchoMax) {
  const ancho = (t) => partes.reduce((s, [texto, fuente]) => ((ctx.font = fuente(t)), s + ctx.measureText(texto).width), 0);
  const total = ancho(tam);
  if (total > anchoMax) tam = (tam * anchoMax) / total;
  ctx.textAlign = "left";
  for (const [texto, fuente] of partes) {
    ctx.font = fuente(tam);
    ctx.fillText(texto, x, y);
    x += ctx.measureText(texto).width;
  }
}

function pintarFilas(ctx, f) {
  const x = f.izquierda + f.sangria;
  const anchoMax = f.derecha - f.sangria - x;
  const tamEquipos = Lienzo.tamParaAlto(ctx, FUTURA(700), "H", f.equipos.altoMayus);
  const tamDatos = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA_MEDIA, "H", f.datos.altoMayus);

  Escuelas.CATEGORIAS.forEach((c, i) => {
    const e = estado.escuelas[i];
    const y0 = f.arriba + i * f.alto;

    ctx.globalAlpha = 0.45;
    ctx.fillRect(f.izquierda, y0, f.derecha - f.izquierda, 2);
    if (i === Escuelas.CATEGORIAS.length - 1) ctx.fillRect(f.izquierda, y0 + f.alto, f.derecha - f.izquierda, 2);
    ctx.globalAlpha = 1;

    const yEquipos = y0 + f.alto * f.equipos.base;
    if (!e.juega) {
      // Descansa: la fila un poco apagada y centrada en vertical.
      ctx.globalAlpha = 0.8;
      trozos(ctx, [[Escuelas.nuestro(i), FUTURA(700)], ["  descansa", PLAYFAIR_CURSIVA]], tamEquipos,
        x, y0 + f.alto * 0.58, anchoMax);
      ctx.globalAlpha = 1;
      return;
    }
    const [local, visitante] = Escuelas.enOrden(i);
    const peso = (eq) => FUTURA(eq.nuestro ? 700 : 400);
    trozos(ctx, [[local.texto, peso(local)], ["  vs  ", FUTURA(400)], [visitante.texto, peso(visitante)]],
      tamEquipos, x, yEquipos, anchoMax);

    const datos = [Escuelas.fechaCorta(e.fecha), e.hora && `${e.hora}H`, e.lugar.trim().toUpperCase()].filter(Boolean);
    if (datos.length) {
      ctx.globalAlpha = 0.85;
      Estudio.textoAjustado(ctx, datos.join("  ·  "), FUTURA_CONDENSADA_MEDIA, tamDatos, x, y0 + f.alto * f.datos.base, anchoMax);
      ctx.globalAlpha = 1;
    }
  });
}

Estudio.enlazar("velo", "velo", Number);

Estudio.iniciar({
  nombre: "escuelas-partidos",
  disenos: { post: POST, story: STORY },
  sufijoArchivo: () => estado.escuelas.find((e) => e.juega && e.fecha)?.fecha || "fin-de-semana",
  async alCargar() {
    await Escuelas.cargarLogos();
    Escuelas.crearFormulario("partidos");
  },
  pintarTextos(ctx, D) {
    Estudio.pintarVeloJornada(ctx, estado.velo);
    Escuelas.pintarLogos(ctx);
    Estudio.pintarTituloDoble(ctx, "escuelas", "PARTIDOS");
    pintarFilas(ctx, D.filas);
  },
});

Textos.iniciar(() => {
  const bloques = Escuelas.CATEGORIAS.map((c, i) => {
    const e = estado.escuelas[i];
    if (!e.juega) return [`🔹 {f:${Escuelas.nuestro(i)}}: descansa`];
    const [local, visitante] = Escuelas.enOrdenTexto(i);
    const fecha = Textos.fechaTexto(e.fecha);
    const cuando = [fecha && fecha.charAt(0).toUpperCase() + fecha.slice(1), e.hora && `${e.hora}h`].filter(Boolean).join(" · ");
    return [`🔹 ${local} vs ${visitante}`, cuando && `📅 ${cuando}`, e.lugar.trim() && `📍 ${Textos.capitalizar(e.lugar)}`];
  });
  return Textos.unir(["{c:escuelas} {f:DEPORTIVAS} ⚽️", "Partidos del fin de semana"], ...bloques, ["¡Vamos, chavales! 💛💚"]);
});
