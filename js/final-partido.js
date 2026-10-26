/* Plantilla FINAL DE PARTIDO.
   Medidas tomadas de referencias/FINAL_PARTIDO.JPG (post); en el story lo de arriba
   baja con el cuadro y el marcador se apoya abajo, dejando la foto en el centro. */

const POST = {
  plantilla: "assets/plantillas/final-partido.png", // ya trae "final PARTIDO" y la raya
  liga: { x: 240, y: 174, tam: 150 },
  // Nombres: alineados a la izquierda; si no caben, el bloque se corre a la izquierda.
  nombres: { x: 826, base1: 703, base2: 742, altoMayus: 24, derechaMax: 1800 },
  // Marcador: centrado sobre la raya. Arriba el local, abajo el visitante.
  marcador: { cx: 1525, baseArriba: 1159, baseAbajo: 1759, alto: 295 },
};

const ARRIBA = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0; // 282
const ABAJO = Estudio.FORMATOS.story.caja.y1 - Estudio.FORMATOS.post.caja.y1; // 1044

// En el story los textos pequeños van ~40 % más grandes: se ve a pantalla completa y de pasada.
const STORY = {
  plantilla: Estudio.MARCO_STORY,
  liga: { x: 230, y: POST.liga.y + ARRIBA - 10, tam: 190 },
  // Título y raya sacados de la plantilla del post para poder recolocarlos.
  titulo: { src: "assets/plantillas/final-partido-titulo.png", x: 993, y: 199 + ARRIBA },
  raya: { x: 1376, y: 1323 + ABAJO, ancho: 300, alto: 14 },
  nombres: { x: 826, base1: POST.nombres.base1 + ARRIBA + 12, base2: POST.nombres.base2 + ARRIBA + 30, altoMayus: 34, derechaMax: 1800 },
  marcador: { ...POST.marcador, baseArriba: POST.marcador.baseArriba + ABAJO, baseAbajo: POST.marcador.baseAbajo + ABAJO },
};

const { estado, FUTURA, PLAYFAIR } = Estudio;
Object.assign(estado, { golesNuestros: "", golesRival: "" });

let titulo = null;

// Primero el local, luego "VS" + visitante.
function pintarNombres(ctx, n) {
  const [local, visitante] = Estudio.equiposEnOrden();
  const lineas = [
    { ...local, base: n.base1 },
    { ...visitante, texto: visitante.texto ? "VS " + visitante.texto : "", base: n.base2 },
  ];

  const tam = Lienzo.tamParaAlto(ctx, FUTURA(700), "H", n.altoMayus);
  ctx.textAlign = "left";
  const anchos = lineas.map((l) => {
    ctx.font = FUTURA(l.peso)(tam);
    return ctx.measureText(l.texto).width;
  });
  const x = Math.min(n.x, n.derechaMax - Math.max(...anchos));

  for (const l of lineas) {
    ctx.font = FUTURA(l.peso)(tam);
    ctx.fillText(l.texto, x, l.base);
  }
}

function pintarMarcador(ctx, m) {
  const [local, visitante] = estado.enCasa
    ? [estado.golesNuestros, estado.golesRival]
    : [estado.golesRival, estado.golesNuestros];
  ctx.textAlign = "center";
  ctx.font = PLAYFAIR(Lienzo.tamParaAlto(ctx, PLAYFAIR, "0", m.alto));
  ctx.fillText(String(local), m.cx, m.baseArriba);
  ctx.fillText(String(visitante), m.cx, m.baseAbajo);
}

Estudio.enlazar("goles-nuestros", "golesNuestros");
Estudio.enlazar("goles-rival", "golesRival");

Estudio.iniciar({
  nombre: "final",
  disenos: { post: POST, story: STORY },
  async alCargar() {
    titulo = await Lienzo.cargarImagen(STORY.titulo.src);
  },
  pintarTextos(ctx, D) {
    if (D.titulo && titulo) ctx.drawImage(titulo, D.titulo.x, D.titulo.y);
    if (D.raya) ctx.fillRect(D.raya.x, D.raya.y, D.raya.ancho, D.raya.alto);
    pintarNombres(ctx, D.nombres);
    pintarMarcador(ctx, D.marcador);
  },
});

// Mensaje según cómo nos ha ido (si están puestos los dos marcadores).
function mensajeResultado() {
  const [n, r] = [estado.golesNuestros, estado.golesRival];
  if (String(n) === "" || String(r) === "") return "";
  if (+n > +r) return estado.enCasa ? "¡Victoria! Tres puntos que se quedan en casa 💪💛💚" : "¡Victoria! Tres puntos que nos traemos 💪💛💚";
  if (+n === +r) return "Punto sumado. ¡Seguimos! 💛💚";
  return "Hoy no pudo ser. ¡A levantarse y a por el siguiente! 💛💚";
}

Textos.iniciar(() => {
  const [local, visitante] = Textos.equipos();
  const [gl, gv] = estado.enCasa
    ? [estado.golesNuestros, estado.golesRival]
    : [estado.golesRival, estado.golesNuestros];
  const marcador = String(gl) !== "" && String(gv) !== "" ? ` {f:${gl} - ${gv}} ` : " vs ";
  return Textos.unir(
    ["{c:final} {f:PARTIDO}"],
    [`${local}${marcador}${visitante}`],
    [mensajeResultado()],
  );
});

// Último partido según la FFCM (los goles se ponen a mano: la FFCM no deja leerlos).
Ffcm.iniciar((d) => {
  if (!d.ultima) Ffcm.falta();
  const p = Ffcm.nuestroPartido(d.ultima);
  if (!p) return `Jornada ${d.ultima.n}: descansamos`;
  Estudio.ponerPartido(p);
  return `Jornada ${d.ultima.n}: ${p.enCasa ? "en casa" : "fuera"} contra ${p.rival} (pon los goles)`;
});
