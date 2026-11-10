/* Plantilla MATCHDAY.
   Sénior: tres fotos en franjas sobre el fondo de la plantilla. Medidas tomadas de
   referencias/MATCHDAYEJEMPLO.JPG (post); en el story las tres franjas reparten el cuadro
   alto y título, datos y escudos guardan su sitio respecto a ellas.
   Juvenil: una sola foto (del juvenil hay menos fotos), diseño propio con la misma
   identidad: foto a sangre con el borde desenfocado, velo oscuro desde abajo y, abajo y
   centrado, los escudos (juntos, como en el resto de carteles), el título "MATCHday" y la
   hora y el pabellón. */

const FONDO = "assets/plantillas/matchday.jpg";

const POST = {
  // La plantilla del post es el fondo entero (ya trae líneas y patrocinadores).
  fondo: { src: FONDO },
  liga: { x: 210, y: 155, tam: 152 },
  // Huecos de las fotos (entre ellos se ve el fondo dorado).
  tiras: [
    { x0: 205, y0: 139, x1: 1838, y1: 700 },
    { x0: 205, y0: 733, x1: 1838, y1: 1296 },
    { x0: 205, y0: 1330, x1: 1838, y1: 1892 },
  ],
  // "MATCHday": recortado del ejemplo (la cursiva de "day" no es ninguna de nuestras fuentes).
  titulo: { x: 247, y: 812 },
  // Hora y pabellón en una línea, centrada, en Futura Condensed Medium.
  // Con un degradado oscuro suave detrás para que se lea sobre cualquier foto.
  datos: { cx: 1053, base: 1261, altoMayus: 38, anchoMax: 1500, sombra: true },
  // Escudos en blanco sobre el corte entre la primera y la segunda foto.
  escudos: {
    cx: { local: 932, visitante: 1162 },
    abajo: 784,
    nuestro: { ancho: 240, alto: 236 },
    rival: { ancho: 210, alto: 222 },
  },
};

// Story: tres franjas iguales en el cuadro alto, con los mismos huecos de 33 px.
const CAJA_STORY = Estudio.FORMATOS.story.caja;
const HUECO = 33;
const ALTO_TIRA = (CAJA_STORY.y1 - CAJA_STORY.y0 - 2 * HUECO) / 3;
const tirasStory = [0, 1, 2].map((i) => {
  const y0 = Math.round(CAJA_STORY.y0 + 1 + i * (ALTO_TIRA + HUECO));
  return { x0: 205, y0, x1: 1838, y1: Math.round(y0 + ALTO_TIRA) };
});
// Título y datos: mismo sitio respecto al centro de la franja del medio.
const CENTRO = (t) => (t.y0 + t.y1) / 2;
const BAJA_CENTRO = Math.round(CENTRO(tirasStory[1]) - CENTRO(POST.tiras[1]));
// Escudos: mismo sitio respecto al borde de arriba de la franja del medio.
const BAJA_ESCUDOS = tirasStory[1].y0 - POST.tiras[1].y0;

// En el story la línea de hora y pabellón, los escudos y el logo van más grandes
// (se ve a pantalla completa y de pasada).
const STORY = {
  // Del fondo solo la zona de dentro del cuadro (sin líneas ni patrocinadores),
  // y encima el marco del story.
  fondo: { src: FONDO, recorte: [212, 145, 1830, 1885] },
  plantilla: Estudio.MARCO_STORY,
  sombraPatrocinadores: true,
  liga: { x: 200, y: POST.liga.y + (CAJA_STORY.y0 - Estudio.FORMATOS.post.caja.y0) - 10, tam: 190 },
  tiras: tirasStory,
  titulo: { ...POST.titulo, y: POST.titulo.y + BAJA_CENTRO },
  // Un poco a la izquierda para no chocar con la cola de la "y" de "day".
  datos: { cx: 975, base: POST.datos.base + BAJA_CENTRO + 30, altoMayus: 52, anchoMax: 1440, sombra: true },
  escudos: {
    cx: { local: 900, visitante: 1180 },
    abajo: POST.escudos.abajo + BAJA_ESCUDOS + 20,
    nuestro: { ancho: 300, alto: 295 },
    rival: { ancho: 262, alto: 277 },
  },
};

/* ---------- Juvenil: una sola foto ---------- */

// Todo el bloque va centrado y apoyado abajo; en el story baja con la línea de abajo.
const CENTRO_X = 1021;
const JUVENIL_POST = {
  plantilla: "assets/plantillas/clasificacion.png", // solo líneas y patrocinadores
  degradado: "abajo", // escudos, título y hora (el sénior no lleva: la hora tiene su sombra)
  liga: { x: 240, y: 174, tam: 150 },
  // Degradado oscuro desde `desde` (transparente) hasta `hasta` (opacidad del deslizador).
  velo: { desde: 820, hasta: 1350 },
  escudos: {
    cx: { local: CENTRO_X - 118, visitante: CENTRO_X + 118 },
    abajo: 1240,
    nuestro: { ancho: 280, alto: 276 },
    rival: { ancho: 245, alto: 260 },
  },
  // "MATCHday" a escala (la imagen original mide 1563 x 460).
  titulo: { cx: CENTRO_X, y: 1285, escala: 0.85 },
  datos: { cx: CENTRO_X, base: 1792, altoMayus: 38, anchoMax: 1500 },
};

// Story: lo de abajo baja con la línea de abajo del cuadro y lo pequeño va más grande.
const BAJA_ABAJO = Estudio.FORMATOS.story.caja.y1 - Estudio.FORMATOS.post.caja.y1;
const JUVENIL_STORY = {
  plantilla: Estudio.MARCO_STORY,
  degradado: "abajo",
  liga: { x: 230, y: JUVENIL_POST.liga.y - 10, tam: 190 },
  velo: { desde: JUVENIL_POST.velo.desde + BAJA_ABAJO - 250, hasta: JUVENIL_POST.velo.hasta + BAJA_ABAJO },
  escudos: {
    cx: { local: CENTRO_X - 142, visitante: CENTRO_X + 142 },
    abajo: JUVENIL_POST.escudos.abajo + BAJA_ABAJO - 70,
    nuestro: { ancho: 340, alto: 335 },
    rival: { ancho: 298, alto: 316 },
  },
  titulo: { cx: CENTRO_X, y: JUVENIL_POST.titulo.y + BAJA_ABAJO - 40, escala: 0.95 },
  datos: { cx: CENTRO_X, base: JUVENIL_POST.datos.base + BAJA_ABAJO, altoMayus: 52, anchoMax: 1500 },
};

const TITULO = "assets/plantillas/matchday-titulo.png";

const { estado, FUTURA_CONDENSADA_MEDIA } = Estudio;
Object.assign(estado, { velo: 0.6 });

let titulo = null;

function pintarDatos(ctx, d) {
  const texto = [Estudio.horaTexto(), estado.pabellon.trim().toUpperCase()].filter(Boolean).join(" ");
  ctx.textAlign = "center";
  const tam = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA_MEDIA, "H", d.altoMayus);
  if (d.sombra && texto) {
    ctx.font = FUTURA_CONDENSADA_MEDIA(tam);
    const ancho = Math.min(ctx.measureText(texto).width, d.anchoMax);
    sombraOvalada(ctx, d.cx, d.base - d.altoMayus / 2, ancho / 2 + d.altoMayus * 2.5, d.altoMayus * 1.9);
  }
  Estudio.textoAjustado(ctx, texto, FUTURA_CONDENSADA_MEDIA, tam, d.cx, d.base, d.anchoMax);
}

// Mancha oscura ovalada que se difumina hacia los bordes (centro cx, cy y radios rx, ry).
function sombraOvalada(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(rx / ry, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
  g.addColorStop(0, "rgba(0,0,0,0.6)");
  g.addColorStop(0.55, "rgba(0,0,0,0.42)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-ry, -ry, 2 * ry, 2 * ry);
  ctx.restore();
  ctx.fillStyle = "#fff";
}

function pintarJuvenil(ctx, D) {
  // Velo: solo dentro del cuadro, para no oscurecer las líneas blancas.
  const c = Estudio.caja();
  const g = ctx.createLinearGradient(0, D.velo.desde, 0, D.velo.hasta);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${estado.velo})`);
  ctx.fillStyle = g;
  ctx.fillRect(c.x0 + 2, D.velo.desde, c.x1 - c.x0 - 4, c.y1 - D.velo.desde);
  ctx.fillStyle = "#fff";

  Estudio.pintarEscudos(ctx, D.escudos);

  if (titulo) {
    const [w, h] = [titulo.naturalWidth * D.titulo.escala, titulo.naturalHeight * D.titulo.escala];
    ctx.drawImage(titulo, D.titulo.cx - w / 2, D.titulo.y, w, h);
  }
  pintarDatos(ctx, D.datos);
}

// Con el juvenil solo se pide una foto: se ocultan las otras dos y su zoom.
function mostrarFotos() {
  const juvenil = estado.equipo === "juvenil";
  document.querySelectorAll(".solo-senior").forEach((el) => (el.hidden = juvenil));
  document.getElementById("nombre-foto-0").textContent = juvenil ? "Elegir foto" : "Foto de arriba";
  document.getElementById("nombre-zoom-0").textContent = juvenil ? "Zoom" : "Zoom arriba";
  document.querySelector(".solo-juvenil").hidden = !juvenil;
}
document.querySelectorAll('input[name="equipo"]').forEach((el) => el.addEventListener("change", mostrarFotos));
Estudio.enlazar("velo", "velo", Number);

Estudio.iniciar({
  nombre: "matchday",
  disenos: {
    senior: { post: POST, story: STORY },
    juvenil: { post: JUVENIL_POST, story: JUVENIL_STORY },
  },
  async alCargar() {
    titulo = await Lienzo.cargarImagen(TITULO);
    mostrarFotos();
  },
  pintarTextos(ctx, D) {
    if (D.tiras) {
      Estudio.pintarEscudos(ctx, D.escudos);
      if (titulo) ctx.drawImage(titulo, D.titulo.x, D.titulo.y);
      pintarDatos(ctx, D.datos);
    } else {
      pintarJuvenil(ctx, D);
    }
  },
});

// Precio de la entrada: en casa es 2 € para sénior y juvenil; fuera no se pone (lo decide
// el otro club). Se pone solo al cambiar entre casa y fuera, y se puede cambiar a mano.
const PRECIO_CASA = "2";
Object.assign(estado, { entrada: PRECIO_CASA });
Estudio.enlazar("entrada", "entrada");
let casaAnterior = estado.enCasa;
Estudio.alCambiar(() => {
  if (estado.enCasa === casaAnterior) return;
  casaAnterior = estado.enCasa;
  estado.entrada = estado.enCasa ? PRECIO_CASA : "";
  document.getElementById("entrada").value = estado.entrada;
});

Textos.iniciar(() => {
  const [local, visitante] = Textos.equipos();
  const entrada = String(estado.entrada).trim().replace(".", ",");
  return Textos.unir(
    ["{f:MATCH}{c:day} 🔥"],
    [
      `🆚 ${local} vs ${visitante}`,
      estado.hora && `⏰ ${estado.hora}h`,
      estado.pabellon.trim() && `📍 ${Textos.capitalizar(estado.pabellon)}`,
      entrada && `🎟️ Entrada: ${entrada}€`,
    ],
    [estado.enCasa ? "¡Hoy toca! Todos al pabellón a animar 💛💚" : "¡Hoy toca! Vamos Torrenueva 💛💚"],
  );
});

// Próximo partido según la FFCM.
Ffcm.iniciar((d) => {
  if (!d.proxima) Ffcm.falta(d);
  const p = Ffcm.nuestroPartido(d.proxima);
  if (!p) return `Jornada ${d.proxima.n}: esta jornada descansamos`;
  Estudio.ponerPartido(p);
  return `Jornada ${d.proxima.n}: ${p.enCasa ? "en casa" : "fuera"} contra ${p.rival}`;
});
