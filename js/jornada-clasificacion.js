/* Imagen CLASIFICACIÓN de la publicación de jornada (js/jornada.js): cinco equipos con
   posición, escudo, nombre y puntos. Números en Playfair, como el marcador del final de
   partido. Todo en px del lienzo de 2048 de ancho. */

const Clasificacion = (() => {
  const FILAS = 5;
  const { estado, recursos, FUTURA, FUTURA_CONDENSADA_MEDIA, PLAYFAIR, NUESTRO } = Estudio;

  const POST = {
    cabecera: { base: 760, altoMayus: 22 },
    arriba: 790, // primera línea divisoria
    alto: 214, // alto de cada fila
    izquierda: 250,
    derecha: 1790,
    posicion: { cx: 330, altoNum: 70 },
    escudo: { cx: 480, lado: 150 },
    nombre: { x: 590, altoMayus: 33, anchoMax: 960 },
    puntos: { derecha: 1760, altoNum: 92 },
  };

  // Story: las filas, más altas y con todo un poco más grande, llenan el cuadro.
  const BAJA = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0;
  const ARRIBA_STORY = POST.arriba + BAJA + 170;
  const STORY = {
    ...POST,
    cabecera: { ...POST.cabecera, base: ARRIBA_STORY - 36, altoMayus: 32 },
    arriba: ARRIBA_STORY,
    alto: Math.floor((Estudio.FORMATOS.story.caja.y1 - 120 - ARRIBA_STORY) / FILAS),
    posicion: { cx: 335, altoNum: 96 },
    escudo: { cx: 505, lado: 215 },
    nombre: { x: 650, altoMayus: 42, anchoMax: 890 },
    puntos: { derecha: 1760, altoNum: 128 },
  };

  Object.assign(estado, {
    primeraPosicion: 1,
    // equipo: NUESTRO, la ruta del escudo de un rival, o "" (otro sin escudo)
    filas: Array.from({ length: FILAS }, (_, i) => ({ equipo: i === 0 ? NUESTRO : "", nombre: "", puntos: "", img: null })),
  });

  const nombreFila = (f) => (f.equipo === NUESTRO ? Estudio.EQUIPOS[estado.equipo] : f.nombre.trim().toUpperCase());
  const escudoFila = (f) => (f.equipo === NUESTRO ? recursos.escudoNuestro : f.img);

  /* ---------- Pintado ---------- */

  function pintar(ctx, t) {
    const cab = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA_MEDIA, "H", t.cabecera.altoMayus);
    const tamPos = Lienzo.tamParaAlto(ctx, PLAYFAIR, "0", t.posicion.altoNum);
    const tamPts = Lienzo.tamParaAlto(ctx, PLAYFAIR, "0", t.puntos.altoNum);
    const tamNombre = Lienzo.tamParaAlto(ctx, FUTURA(700), "H", t.nombre.altoMayus);

    // Cabecera
    ctx.globalAlpha = 0.75;
    ctx.font = FUTURA_CONDENSADA_MEDIA(cab);
    ctx.textAlign = "center";
    ctx.fillText("POS", t.posicion.cx, t.cabecera.base);
    ctx.textAlign = "left";
    ctx.fillText("EQUIPO", t.nombre.x, t.cabecera.base);
    ctx.textAlign = "right";
    ctx.fillText("PTS", t.puntos.derecha, t.cabecera.base);
    ctx.globalAlpha = 1;

    estado.filas.forEach((f, i) => {
      const y0 = t.arriba + i * t.alto;
      const cy = y0 + t.alto / 2;
      const nuestro = f.equipo === NUESTRO;

      // Nuestra fila: banda translúcida con una barra blanca a la izquierda.
      if (nuestro) {
        ctx.fillStyle = "rgba(255,255,255,0.13)";
        ctx.fillRect(t.izquierda, y0, t.derecha - t.izquierda, t.alto);
        ctx.fillStyle = "#fff";
        ctx.fillRect(t.izquierda, y0, 8, t.alto);
      }

      // Línea divisoria (fina, como las del cuadro).
      ctx.globalAlpha = 0.45;
      ctx.fillRect(t.izquierda, y0, t.derecha - t.izquierda, 2);
      if (i === estado.filas.length - 1) ctx.fillRect(t.izquierda, y0 + t.alto, t.derecha - t.izquierda, 2);
      ctx.globalAlpha = 1;

      // Posición
      const pos = Number(estado.primeraPosicion) + i;
      ctx.font = PLAYFAIR(tamPos);
      ctx.textAlign = "center";
      ctx.globalAlpha = nuestro ? 1 : 0.85;
      ctx.fillText(Number.isFinite(pos) ? String(pos) : "", t.posicion.cx, cy + t.posicion.altoNum / 2);
      ctx.globalAlpha = 1;

      // Escudo
      const img = escudoFila(f);
      if (img) Estudio.dibujarEnCaja(ctx, img, t.escudo.cx, cy + t.escudo.lado / 2, t.escudo.lado, t.escudo.lado);

      // Nombre: el nuestro en negrita, el resto normal.
      ctx.textAlign = "left";
      Estudio.textoAjustado(ctx, nombreFila(f), FUTURA(nuestro ? 700 : 400), tamNombre,
        t.nombre.x, cy + t.nombre.altoMayus / 2, t.nombre.anchoMax);

      // Puntos
      ctx.font = PLAYFAIR(tamPts);
      ctx.textAlign = "right";
      ctx.fillText(String(f.puntos), t.puntos.derecha, cy + t.puntos.altoNum / 2);
    });
  }

  /* ---------- Formulario de filas ---------- */

  const peticiones = [];
  async function ponerEscudoFila(i) {
    const f = estado.filas[i];
    const esta = (peticiones[i] = (peticiones[i] || 0) + 1);
    const img = f.equipo && f.equipo !== NUESTRO ? await Lienzo.cargarImagen(f.equipo) : null;
    if (esta !== peticiones[i]) return;
    f.img = img;
    Estudio.refrescar();
  }

  function crearFormulario() {
    const cont = document.getElementById("filas");
    estado.filas.forEach((f, i) => {
      const fila = document.createElement("div");
      fila.className = "fila-tabla";
      fila.innerHTML = `
        <span class="num"></span>
        <select aria-label="Equipo ${i + 1}"></select>
        <input type="text" placeholder="Nombre" autocomplete="off" aria-label="Nombre ${i + 1}">
        <input type="number" inputmode="numeric" min="0" placeholder="Pts" aria-label="Puntos ${i + 1}">`;
      const [num, sel, nombre, puntos] = fila.children;
      Estudio.rellenarEquipos(sel);
      sel.value = f.equipo;

      const actualizarNombre = () => {
        nombre.disabled = f.equipo === NUESTRO;
        nombre.value = f.equipo === NUESTRO ? "Torrenueva" : f.nombre;
      };
      actualizarNombre();

      sel.addEventListener("change", () => {
        f.equipo = sel.value;
        f.nombre = sel.value && sel.value !== NUESTRO ? sel.selectedOptions[0].text : "";
        actualizarNombre();
        ponerEscudoFila(i);
      });
      nombre.addEventListener("input", () => {
        f.nombre = nombre.value;
        Estudio.refrescar();
      });
      puntos.addEventListener("input", () => {
        f.puntos = puntos.value;
        Estudio.refrescar();
      });
      fila.numero = num;
      cont.appendChild(fila);
    });
    numerarFilas();
  }

  function numerarFilas() {
    document.querySelectorAll(".fila-tabla").forEach((fila, i) => {
      fila.numero.textContent = `${Number(estado.primeraPosicion) + i}º`;
    });
  }

  Estudio.enlazar("primera-posicion", "primeraPosicion", Number);
  document.getElementById("primera-posicion").addEventListener("input", numerarFilas);

  /* ---------- Texto y FFCM ---------- */

  function texto() {
    return estado.filas.map((f, i) => {
      const pos = Number(estado.primeraPosicion) + i;
      const nombre = f.equipo === NUESTRO ? `{f:${Textos.nuestro()}}` : f.nombre.trim();
      if (!nombre) return "";
      const pts = String(f.puntos) !== "" ? ` · ${f.puntos} pts` : "";
      return `${pos}. ${nombre}${pts}`;
    });
  }

  // Los 5 equipos alrededor de nosotros en la clasificación de la FFCM. Antes de la primera
  // jornada también: la tabla sale con todos a 0 puntos. Devuelve un resumen o "".
  function rellenar(d) {
    const tabla = d.clasificacion;
    if (!tabla.length) return "";
    const disparar = (el, ev) => el.dispatchEvent(new Event(ev));
    const nuestra = tabla.findIndex((f) => Ffcm.esNuestro(f.equipo));
    const desde = Math.max(0, Math.min(tabla.length - FILAS, nuestra - 2));

    const primera = document.getElementById("primera-posicion");
    primera.value = tabla[desde].pos;
    disparar(primera, "input");

    document.querySelectorAll(".fila-tabla").forEach((fila, i) => {
      const f = tabla[desde + i];
      if (!f) return;
      const [, sel, nombre, puntos] = fila.children;
      const r = Ffcm.esNuestro(f.equipo) ? null : Ffcm.rival(f.equipo);
      sel.value = r ? r.escudo : NUESTRO;
      disparar(sel, "change");
      if (r && !r.escudo) {
        nombre.value = r.nombre;
        disparar(nombre, "input");
      }
      puntos.value = f.pts;
      disparar(puntos, "input");
    });
    return d.ultima ? `vamos ${tabla[nuestra]?.pos}º` : "aún todos a 0 puntos";
  }

  return { TABLA: { post: POST, story: STORY }, pintar, crearFormulario, texto, rellenar };
})();
