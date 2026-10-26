/* Plantilla PRÓXIMO PARTIDO.
   Medidas tomadas de referencias/PROXIMOPARTIDOEJEMPLO.JPG (post); en el story el bloque
   se apoya abajo igual que en el post. */

// El bloque (título, nombres, escudos y fecha) se puede mover arrastrando (estado.bloqueX/Y).
// Posiciones de partida: las del ejemplo, con nombres, escudos y fecha 24 px más abajo
// para que no se peguen a "PARTIDO".
const POST = {
  plantilla: "assets/plantillas/proximo-partido.png",
  liga: { x: 210, y: 155, tam: 152 },
  // "próximo PARTIDO" (separado de la plantilla para poder moverlo).
  titulo: { x: 388, y: 1131 },
  // Línea 1 (local) alineada a la izquierda; línea 2 ("VS visitante") alineada a la derecha.
  nombres: { izquierda1: 713, base1: 1461, derecha2: 1667, base2: 1502, altoMayus: 24, derechaMax: 1810 },
  // Escudos en blanco: a la izquierda el local, a la derecha el visitante (apoyados abajo).
  escudos: {
    cx: { local: 852, visitante: 1087 },
    abajo: 1755,
    nuestro: { ancho: 240, alto: 236 },
    rival: { ancho: 210, alto: 222 },
  },
  // Fecha | hora y pabellón en Futura Condensed ExtraBold.
  datos: { x: 1246, base1: 1630, base2: 1682, altoMayus: 31, derechaMax: 1813 },
};

const ARRIBA = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0;
const ABAJO = Estudio.FORMATOS.story.caja.y1 - Estudio.FORMATOS.post.caja.y1;

// En el story los textos pequeños y los escudos van más grandes (se ve a pantalla completa
// y de pasada). El bloque se monta de abajo arriba desde el borde del cuadro: escudos y
// datos al lado, encima los nombres y encima el título.
const ESCUDOS_ABAJO = Estudio.FORMATOS.story.caja.y1 - (Estudio.FORMATOS.post.caja.y1 - POST.escudos.abajo);
const ALTO_ESCUDO = 295;
const NOMBRES_BASE2 = ESCUDOS_ABAJO - ALTO_ESCUDO - 42;
const STORY = {
  plantilla: Estudio.MARCO_STORY,
  liga: { x: 200, y: POST.liga.y + ARRIBA - 10, tam: 190 },
  titulo: { ...POST.titulo, y: NOMBRES_BASE2 - 58 - 34 - 36 - 273 },
  nombres: { ...POST.nombres, base1: NOMBRES_BASE2 - 58, base2: NOMBRES_BASE2, altoMayus: 34 },
  escudos: {
    cx: { local: 650, visitante: 935 },
    abajo: ESCUDOS_ABAJO,
    nuestro: { ancho: 300, alto: ALTO_ESCUDO },
    rival: { ancho: 262, alto: 277 },
  },
  datos: { x: 1110, base1: ESCUDOS_ABAJO - 175, base2: ESCUDOS_ABAJO - 100, altoMayus: 44, derechaMax: 1813 },
};

const TITULO = "assets/plantillas/proximo-partido-titulo.png";

const { estado, FUTURA, FUTURA_CONDENSADA } = Estudio;

let titulo = null;

function pintarNombres(ctx, n) {
  const [local, visitante] = Estudio.equiposEnOrden();
  const tam = Lienzo.tamParaAlto(ctx, FUTURA(700), "H", n.altoMayus);

  ctx.font = FUTURA(local.peso)(tam);
  const ancho1 = ctx.measureText(local.texto).width;
  ctx.textAlign = "left";
  // El tope derecho es fijo en la imagen, no se mueve con el bloque.
  ctx.fillText(local.texto, Math.min(n.izquierda1, n.derechaMax - estado.bloqueX - ancho1), n.base1);

  if (!visitante.texto) return;
  ctx.font = FUTURA(visitante.peso)(tam);
  ctx.textAlign = "right";
  ctx.fillText("VS " + visitante.texto, n.derecha2, n.base2);
}

function pintarDatos(ctx, d) {
  const tam = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA, "H", d.altoMayus);
  const anchoMax = d.derechaMax - estado.bloqueX - d.x;
  const partes = [Estudio.fechaLarga(estado.fecha), Estudio.horaTexto()].filter(Boolean);
  ctx.textAlign = "left";
  Estudio.textoAjustado(ctx, partes.join(" | "), FUTURA_CONDENSADA, tam, d.x, d.base1, anchoMax);
  Estudio.textoAjustado(ctx, estado.pabellon.trim().toUpperCase(), FUTURA_CONDENSADA, tam, d.x, d.base2, anchoMax);
}

Estudio.iniciar({
  nombre: "proximo",
  disenos: { post: POST, story: STORY },
  async alCargar() {
    titulo = await Lienzo.cargarImagen(TITULO);
  },
  pintarTextos(ctx, D) {
    ctx.save();
    ctx.translate(estado.bloqueX, estado.bloqueY);
    if (titulo) ctx.drawImage(titulo, D.titulo.x, D.titulo.y);
    pintarNombres(ctx, D.nombres);
    Estudio.pintarEscudos(ctx, D.escudos);
    pintarDatos(ctx, D.datos);
    ctx.restore();
  },
});

Textos.iniciar(() => {
  const [local, visitante] = Textos.equipos();
  const fecha = Textos.fechaTexto(estado.fecha);
  return Textos.unir(
    ["{c:próximo} {f:PARTIDO} ⚽️"],
    [
      `🆚 ${local} vs ${visitante}`,
      fecha && `📅 ${fecha.charAt(0).toUpperCase() + fecha.slice(1)}`,
      estado.hora && `⏰ ${estado.hora}h`,
      estado.pabellon.trim() && `📍 ${Textos.capitalizar(estado.pabellon)}`,
    ],
    [estado.enCasa ? "¡Os esperamos en el pabellón! 💛💚" : "¡A por los tres puntos! 💛💚"],
  );
});

// Próximo partido según la FFCM.
Ffcm.iniciar((d) => {
  if (!d.proxima) Ffcm.falta();
  const p = Ffcm.nuestroPartido(d.proxima);
  if (!p) return `Jornada ${d.proxima.n}: esta jornada descansamos`;
  Estudio.ponerPartido(p);
  return `Jornada ${d.proxima.n}: ${p.enCasa ? "en casa" : "fuera"} contra ${p.rival}`;
});
