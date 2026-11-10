/* Publicación de JORNADA: clasificación y resultados juntos, porque se suben siempre en la
   misma publicación. Las dos imágenes usan la misma foto con el mismo encuadre (se coloca
   una vez), se ve una u otra con el selector de la vista previa, "Guardar" saca las dos y
   el texto las junta. Las tablas están en js/jornada-clasificacion.js y
   js/jornada-resultados.js; el título y el velo, en Estudio. */

const { estado } = Estudio;
Object.assign(estado, { jornada: "", velo: 0.55, imagen: "clasificacion" });

const BAJA_STORY = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0;
const DISENOS = {
  post: {
    plantilla: "assets/plantillas/clasificacion.png", // solo líneas y patrocinadores
    liga: { x: 240, y: 174, tam: 150 },
    clasificacion: Clasificacion.TABLA.post,
    resultados: Resultados.TABLA.post,
  },
  story: {
    plantilla: Estudio.MARCO_STORY,
    liga: { x: 230, y: 174 + BAJA_STORY - 10, tam: 190 },
    clasificacion: Clasificacion.TABLA.story,
    resultados: Resultados.TABLA.story,
  },
};

const IMAGENES = [
  { id: "clasificacion", nombre: "clasificacion", titulo: "clasificación" },
  { id: "resultados", nombre: "resultados", titulo: "resultados" },
];

Estudio.enlazar("jornada", "jornada");
Estudio.enlazar("velo", "velo", Number);

// Selector de la vista previa: qué imagen se ve (las dos se guardan).
document.querySelectorAll('input[name="imagen"]').forEach((el) => {
  el.checked = el.value === estado.imagen;
  el.addEventListener("change", () => {
    estado.imagen = el.value;
    Estudio.refrescar();
  });
});

Estudio.iniciar({
  nombre: "jornada",
  disenos: DISENOS,
  imagenes: IMAGENES,
  sufijoArchivo: () => (estado.jornada ? `jornada-${estado.jornada}` : "jornada"),
  alCargar() {
    Clasificacion.crearFormulario();
    Resultados.crearFormulario();
  },
  pintarTextos(ctx, D) {
    const im = IMAGENES.find((i) => i.id === estado.imagen) || IMAGENES[0];
    Estudio.pintarVeloJornada(ctx, estado.velo);
    Estudio.pintarTituloJornada(ctx, im.titulo, estado.jornada);
    (im.id === "resultados" ? Resultados : Clasificacion).pintar(ctx, D[im.id]);
  },
});

// Un solo texto para la publicación: clasificación y resultados.
Textos.iniciar(() => {
  const j = String(estado.jornada).trim();
  return Textos.unir(
    [`{c:jornada} {f:${j || "?"}} ⚽️`, Textos.capitalizar(Estudio.COMPETICIONES[estado.equipo])],
    ["📊 {f:CLASIFICACIÓN}", ...Clasificacion.texto()],
    ["🆚 {f:RESULTADOS}", ...Resultados.texto()],
  );
});

Ffcm.iniciar((d) => {
  const j = d.ultima || d.proxima;
  if (!d.clasificacion.length && !j) Ffcm.falta(d);
  const jornada = document.getElementById("jornada");
  jornada.value = j?.n ?? "";
  jornada.dispatchEvent(new Event("input"));
  const clas = Clasificacion.rellenar(d);
  const res = Resultados.rellenar(d);
  return [`Jornada ${j?.n ?? "?"}`, clas && `clasificación: ${clas}`, res && `resultados: ${res}`].filter(Boolean).join(" · ");
});
