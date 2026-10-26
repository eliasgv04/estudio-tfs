/* Plantilla MATCHDAY: tres fotos en franjas sobre el fondo de la plantilla.
   Medidas tomadas de referencias/MATCHDAYEJEMPLO.JPG (post). En el story las tres franjas
   reparten el cuadro alto y título, datos y escudos guardan su sitio respecto a ellas. */

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
  datos: { cx: 1053, base: 1261, altoMayus: 38, anchoMax: 1500 },
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
  datos: { cx: 975, base: POST.datos.base + BAJA_CENTRO + 30, altoMayus: 52, anchoMax: 1440 },
  escudos: {
    cx: { local: 900, visitante: 1180 },
    abajo: POST.escudos.abajo + BAJA_ESCUDOS + 20,
    nuestro: { ancho: 300, alto: 295 },
    rival: { ancho: 262, alto: 277 },
  },
};

const TITULO = "assets/plantillas/matchday-titulo.png";

const { estado, FUTURA_CONDENSADA_MEDIA } = Estudio;

let titulo = null;

function pintarDatos(ctx, d) {
  const texto = [Estudio.horaTexto(), estado.pabellon.trim().toUpperCase()].filter(Boolean).join(" ");
  ctx.textAlign = "center";
  const tam = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA_MEDIA, "H", d.altoMayus);
  Estudio.textoAjustado(ctx, texto, FUTURA_CONDENSADA_MEDIA, tam, d.cx, d.base, d.anchoMax);
}

Estudio.iniciar({
  nombre: "matchday",
  disenos: { post: POST, story: STORY },
  async alCargar() {
    titulo = await Lienzo.cargarImagen(TITULO);
  },
  pintarTextos(ctx, D) {
    Estudio.pintarEscudos(ctx, D.escudos);
    if (titulo) ctx.drawImage(titulo, D.titulo.x, D.titulo.y);
    pintarDatos(ctx, D.datos);
  },
});

Textos.iniciar(() => {
  const [local, visitante] = Textos.equipos();
  return Textos.unir(
    ["{f:MATCH}{c:day} 🔥"],
    [
      `🆚 ${local} vs ${visitante}`,
      estado.hora && `⏰ ${estado.hora}h`,
      estado.pabellon.trim() && `📍 ${Textos.capitalizar(estado.pabellon)}`,
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
