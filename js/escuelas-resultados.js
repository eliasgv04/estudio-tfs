/* Plantilla ESCUELAS · RESULTADOS: los resultados del fin de semana de las cinco categorías.
   Misma identidad que los resultados de la jornada (sin escudos: los rivales de las
   escuelas no los tenemos). Cada fila: local, marcador en Playfair y visitante, con el
   nuestro en negrita; sin goles, "VS"; si descansa, "<CATEGORÍA> FS descansa".
   Rivales, casa/fuera y descansos vienen de lo puesto en Partidos (en este dispositivo). */

const BAJA = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0;

const POST = {
  plantilla: "assets/plantillas/clasificacion.png", // solo líneas y patrocinadores
  filas: {
    arriba: 760, alto: 220, izquierda: 250, derecha: 1790,
    // Nombres a una distancia del marcador que deja sitio a goles de dos cifras.
    nombre: { altoMayus: 32, anchoMax: 580, local: 840, visitante: 1202 },
    marcador: { cx: 1021, hueco: 42, altoNum: 70, altoVs: 32 },
  },
};

const ARRIBA_STORY = POST.filas.arriba + BAJA + 200;
const STORY = {
  plantilla: Estudio.MARCO_STORY,
  filas: {
    ...POST.filas,
    arriba: ARRIBA_STORY,
    alto: Math.floor((Estudio.FORMATOS.story.caja.y1 - 140 - ARRIBA_STORY) / 5),
    nombre: { altoMayus: 40, anchoMax: 530, local: 790, visitante: 1252 },
    marcador: { cx: 1021, hueco: 52, altoNum: 92, altoVs: 42 },
  },
};

const { estado, FUTURA, FUTURA_CONDENSADA_MEDIA, PLAYFAIR, PLAYFAIR_CURSIVA } = Estudio;
Object.assign(estado, { velo: 0.6 });

function pintarFilas(ctx, f) {
  const tamNombre = Lienzo.tamParaAlto(ctx, FUTURA(700), "H", f.nombre.altoMayus);
  const tamGoles = Lienzo.tamParaAlto(ctx, PLAYFAIR, "0", f.marcador.altoNum);
  const tamVs = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA_MEDIA, "H", f.marcador.altoVs);
  const m = f.marcador;

  Escuelas.CATEGORIAS.forEach((c, i) => {
    const e = estado.escuelas[i];
    const y0 = f.arriba + i * f.alto;
    const cy = y0 + f.alto / 2;

    ctx.globalAlpha = 0.45;
    ctx.fillRect(f.izquierda, y0, f.derecha - f.izquierda, 2);
    if (i === Escuelas.CATEGORIAS.length - 1) ctx.fillRect(f.izquierda, y0 + f.alto, f.derecha - f.izquierda, 2);
    ctx.globalAlpha = 1;

    const base = cy + f.nombre.altoMayus / 2;
    if (!e.juega) {
      ctx.globalAlpha = 0.8;
      ctx.textAlign = "right";
      ctx.font = FUTURA(700)(tamNombre);
      ctx.fillText(Escuelas.nuestro(i), f.nombre.local, base);
      ctx.textAlign = "left";
      ctx.font = PLAYFAIR_CURSIVA(tamNombre * 1.2);
      ctx.fillText("descansa", f.nombre.visitante, base);
      ctx.globalAlpha = 1;
      return;
    }

    const [local, visitante] = Escuelas.enOrden(i);
    ctx.textAlign = "right";
    Estudio.textoAjustado(ctx, local.texto, FUTURA(local.nuestro ? 700 : 400), tamNombre, f.nombre.local, base, f.nombre.anchoMax);
    ctx.textAlign = "left";
    Estudio.textoAjustado(ctx, visitante.texto, FUTURA(visitante.nuestro ? 700 : 400), tamNombre, f.nombre.visitante, base, f.nombre.anchoMax);

    // Goles en orden local - visitante.
    const [gl, gv] = e.enCasa ? [e.gn, e.gr] : [e.gr, e.gn];
    ctx.textAlign = "center";
    if (String(gl) === "" && String(gv) === "") {
      ctx.globalAlpha = 0.8;
      ctx.font = FUTURA_CONDENSADA_MEDIA(tamVs);
      ctx.fillText("VS", m.cx, cy + m.altoVs / 2);
      ctx.globalAlpha = 1;
    } else {
      const baseGoles = cy + m.altoNum / 2;
      ctx.font = PLAYFAIR(tamGoles);
      ctx.fillText("–", m.cx, baseGoles);
      ctx.textAlign = "right";
      ctx.fillText(String(gl || 0), m.cx - m.hueco, baseGoles);
      ctx.textAlign = "left";
      ctx.fillText(String(gv || 0), m.cx + m.hueco, baseGoles);
    }
  });
}

Estudio.enlazar("velo", "velo", Number);

Estudio.iniciar({
  nombre: "escuelas-resultados",
  disenos: { post: POST, story: STORY },
  sufijoArchivo: () => estado.escuelas.find((e) => e.juega && e.fecha)?.fecha || "fin-de-semana",
  async alCargar() {
    await Escuelas.cargarLogos();
    Escuelas.crearFormulario("resultados");
  },
  pintarTextos(ctx, D) {
    Estudio.pintarVeloJornada(ctx, estado.velo);
    Escuelas.pintarLogos(ctx);
    Estudio.pintarTituloDoble(ctx, "escuelas", "RESULTADOS");
    pintarFilas(ctx, D.filas);
  },
});

Textos.iniciar(() => {
  const lineas = Escuelas.CATEGORIAS.map((c, i) => {
    const e = estado.escuelas[i];
    if (!e.juega) return `🔹 {f:${Escuelas.nuestro(i)}}: descansa`;
    const [local, visitante] = Escuelas.enOrdenTexto(i);
    const [gl, gv] = e.enCasa ? [e.gn, e.gr] : [e.gr, e.gn];
    const marcador = String(gl) !== "" || String(gv) !== "" ? ` {f:${gl || 0} - ${gv || 0}} ` : " vs ";
    return `🔹 ${local}${marcador}${visitante}`;
  });
  return Textos.unir(["{c:escuelas} {f:DEPORTIVAS} ⚽️", "Resultados del fin de semana"], lineas, ["¡Bien, chavales! 💛💚"]);
});
