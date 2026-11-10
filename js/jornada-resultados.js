/* Imagen RESULTADOS de la publicación de jornada (js/jornada.js): hasta 7 partidos con
   escudos y marcador en Playfair. Todo en px del lienzo de 2048 de ancho. */

const Resultados = (() => {
  const MAX_PARTIDOS = 7;
  const { estado, recursos, FUTURA, FUTURA_CONDENSADA_MEDIA, PLAYFAIR, NUESTRO } = Estudio;

  const POST = {
    arriba: 740, // primera línea divisoria
    alto: 160, // alto de cada partido
    maxPartidos: MAX_PARTIDOS,
    izquierda: 250,
    derecha: 1790,
    local: { derecha: 715, escudo: 790 },
    visitante: { izquierda: 1327, escudo: 1252 },
    nombre: { altoMayus: 26, anchoMax: 455 },
    escudo: { lado: 110 },
    // Goles a cada lado del guion, separados `hueco` px del centro (caben 2 cifras).
    marcador: { cx: 1021, hueco: 42, altoNum: 62, altoVs: 30 },
  };

  // Story: los partidos, más altos y con todo un poco más grande, llenan el cuadro.
  const BAJA = Estudio.FORMATOS.story.caja.y0 - Estudio.FORMATOS.post.caja.y0;
  const ARRIBA_STORY = POST.arriba + BAJA + 170;
  const STORY = {
    ...POST,
    arriba: ARRIBA_STORY,
    alto: Math.floor((Estudio.FORMATOS.story.caja.y1 - 120 - ARRIBA_STORY) / MAX_PARTIDOS),
    // Escudos y nombres un poco más abiertos para que quepan marcadores de 2 cifras
    // y escudos anchos (Salesianos).
    local: { derecha: 650, escudo: 752 },
    visitante: { izquierda: 1392, escudo: 1290 },
    nombre: { altoMayus: 35, anchoMax: 395 },
    escudo: { lado: 150 },
    marcador: { ...POST.marcador, hueco: 50, altoNum: 82, altoVs: 38 },
  };

  const nuevoEquipo = (equipo = "") => ({ equipo, nombre: "", goles: "", img: null });

  Object.assign(estado, {
    numPartidos: MAX_PARTIDOS,
    partidos: Array.from({ length: MAX_PARTIDOS }, (_, i) => ({
      local: nuevoEquipo(i === 0 ? NUESTRO : ""),
      visitante: nuevoEquipo(),
    })),
  });

  const esNuestro = (e) => e.equipo === NUESTRO;
  const nombreEquipo = (e) => (esNuestro(e) ? Estudio.EQUIPOS_CORTOS[estado.equipo] : e.nombre.trim().toUpperCase());
  const escudoEquipo = (e) => (esNuestro(e) ? recursos.escudoNuestro : e.img);
  const numVisibles = () => Number(estado.numPartidos) || MAX_PARTIDOS;

  /* ---------- Pintado ---------- */

  function pintar(ctx, t) {
    const n = Math.max(1, Math.min(t.maxPartidos, numVisibles()));
    // Con menos partidos, el bloque se centra en el mismo hueco.
    const arriba = t.arriba + ((t.maxPartidos - n) * t.alto) / 2;
    const tamNombre = Lienzo.tamParaAlto(ctx, FUTURA(700), "H", t.nombre.altoMayus);
    const tamGoles = Lienzo.tamParaAlto(ctx, PLAYFAIR, "0", t.marcador.altoNum);
    const tamVs = Lienzo.tamParaAlto(ctx, FUTURA_CONDENSADA_MEDIA, "H", t.marcador.altoVs);

    estado.partidos.slice(0, n).forEach((p, i) => {
      const y0 = arriba + i * t.alto;
      const cy = y0 + t.alto / 2;
      const nuestro = esNuestro(p.local) || esNuestro(p.visitante);

      // Nuestro partido: banda translúcida con barra blanca, como nuestra fila en la clasificación.
      if (nuestro) {
        ctx.fillStyle = "rgba(255,255,255,0.13)";
        ctx.fillRect(t.izquierda, y0, t.derecha - t.izquierda, t.alto);
        ctx.fillStyle = "#fff";
        ctx.fillRect(t.izquierda, y0, 8, t.alto);
      }

      ctx.globalAlpha = 0.45;
      ctx.fillRect(t.izquierda, y0, t.derecha - t.izquierda, 2);
      if (i === n - 1) ctx.fillRect(t.izquierda, y0 + t.alto, t.derecha - t.izquierda, 2);
      ctx.globalAlpha = 1;

      // Nombres: el nuestro en negrita, el resto normal.
      const baseNombre = cy + t.nombre.altoMayus / 2;
      ctx.textAlign = "right";
      Estudio.textoAjustado(ctx, nombreEquipo(p.local), FUTURA(esNuestro(p.local) ? 700 : 400), tamNombre,
        t.local.derecha, baseNombre, t.nombre.anchoMax);
      ctx.textAlign = "left";
      Estudio.textoAjustado(ctx, nombreEquipo(p.visitante), FUTURA(esNuestro(p.visitante) ? 700 : 400), tamNombre,
        t.visitante.izquierda, baseNombre, t.nombre.anchoMax);

      // Escudos a los lados del marcador
      const abajo = cy + t.escudo.lado / 2;
      const imgL = escudoEquipo(p.local);
      const imgV = escudoEquipo(p.visitante);
      if (imgL) Estudio.dibujarEnCaja(ctx, imgL, t.local.escudo, abajo, t.escudo.lado, t.escudo.lado);
      if (imgV) Estudio.dibujarEnCaja(ctx, imgV, t.visitante.escudo, abajo, t.escudo.lado, t.escudo.lado);

      // Marcador; si aún no hay goles (aplazado o sin jugar), "VS".
      ctx.textAlign = "center";
      if (String(p.local.goles) === "" && String(p.visitante.goles) === "") {
        ctx.globalAlpha = 0.8;
        ctx.font = FUTURA_CONDENSADA_MEDIA(tamVs);
        ctx.fillText("VS", t.marcador.cx, cy + t.marcador.altoVs / 2);
        ctx.globalAlpha = 1;
      } else {
        const m = t.marcador;
        const base = cy + m.altoNum / 2;
        ctx.font = PLAYFAIR(tamGoles);
        ctx.fillText("–", m.cx, base);
        ctx.textAlign = "right";
        ctx.fillText(String(p.local.goles), m.cx - m.hueco, base);
        ctx.textAlign = "left";
        ctx.fillText(String(p.visitante.goles), m.cx + m.hueco, base);
      }
    });
  }

  /* ---------- Formulario de partidos ---------- */

  const peticiones = new Map();
  async function ponerEscudo(e) {
    const esta = (peticiones.get(e) || 0) + 1;
    peticiones.set(e, esta);
    const img = e.equipo && !esNuestro(e) ? await Lienzo.cargarImagen(e.equipo) : null;
    if (peticiones.get(e) !== esta) return;
    e.img = img;
    Estudio.refrescar();
  }

  // Un equipo en el formulario: desplegable + goles, y el nombre solo si es "Otro".
  function campoEquipo(e, etiqueta) {
    const caja = document.createElement("div");
    caja.className = "equipo-partido";
    caja.innerHTML = `
      <span class="lado">${etiqueta}</span>
      <select aria-label="${etiqueta}"></select>
      <input type="number" inputmode="numeric" min="0" placeholder="–" aria-label="Goles ${etiqueta}">
      <input type="text" placeholder="Nombre del equipo" autocomplete="off" aria-label="Nombre ${etiqueta}">`;
    const [, sel, goles, nombre] = caja.children;
    Estudio.rellenarEquipos(sel);
    sel.value = e.equipo;
    nombre.hidden = e.equipo !== "";

    sel.addEventListener("change", () => {
      e.equipo = sel.value;
      e.nombre = sel.value && !esNuestro(e) ? sel.selectedOptions[0].text : "";
      nombre.value = e.nombre;
      nombre.hidden = e.equipo !== "";
      ponerEscudo(e);
      actualizarPestanas();
    });
    nombre.addEventListener("input", () => {
      e.nombre = nombre.value;
      Estudio.refrescar();
    });
    goles.addEventListener("input", () => {
      e.goles = goles.value;
      Estudio.refrescar();
      actualizarPestanas();
    });
    return caja;
  }

  /* Un partido a la vista: pestañas numeradas arriba (con su marcador) y debajo
     solo el partido elegido, en vez de una lista larguísima. */

  let activo = 0;

  function crearFormulario() {
    const pestanas = document.getElementById("pestanas");
    const cont = document.getElementById("partidos");
    estado.partidos.forEach((p, i) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "pestana";
      boton.addEventListener("click", () => activar(i));
      pestanas.appendChild(boton);

      const bloque = document.createElement("div");
      bloque.className = "partido";
      bloque.append(campoEquipo(p.local, "Local"), campoEquipo(p.visitante, "Visitante"));
      cont.appendChild(bloque);
    });

    document.getElementById("anterior").addEventListener("click", () => activar(activo - 1));
    document.getElementById("siguiente").addEventListener("click", () => activar(activo + 1));
    activar(0);
  }

  function activar(i) {
    activo = Math.max(0, Math.min(numVisibles() - 1, i));
    document.querySelectorAll(".partido").forEach((b, k) => (b.hidden = k !== activo));
    document.getElementById("titulo-partido").textContent = `Partido ${activo + 1} de ${numVisibles()}`;
    document.getElementById("anterior").disabled = activo === 0;
    document.getElementById("siguiente").disabled = activo === numVisibles() - 1;
    actualizarPestanas();
  }

  // Cada pestaña: número, marcador si ya lo hay y punto si es nuestro partido.
  function actualizarPestanas() {
    document.querySelectorAll(".pestana").forEach((b, i) => {
      const p = estado.partidos[i];
      const jugado = String(p.local.goles) !== "" || String(p.visitante.goles) !== "";
      b.hidden = i >= numVisibles();
      b.classList.toggle("activa", i === activo);
      b.classList.toggle("nuestro", esNuestro(p.local) || esNuestro(p.visitante));
      b.innerHTML = `<b>${i + 1}</b><small>${jugado ? `${p.local.goles || 0}–${p.visitante.goles || 0}` : "·"}</small>`;
    });
  }

  Estudio.enlazar("num-partidos", "numPartidos", Number);
  document.getElementById("num-partidos").addEventListener("input", () => activar(activo));

  /* ---------- Texto y FFCM ---------- */

  function texto() {
    const nombre = (e) => (esNuestro(e) ? `{f:${Textos.nuestro()}}` : e.nombre.trim());
    return estado.partidos.slice(0, numVisibles()).map((p) => {
      if (!nombre(p.local) && !nombre(p.visitante)) return "";
      const jugado = String(p.local.goles) !== "" || String(p.visitante.goles) !== "";
      const marcador = jugado ? ` {f:${p.local.goles || 0} - ${p.visitante.goles || 0}} ` : " vs ";
      return `${nombre(p.local) || "?"}${marcador}${nombre(p.visitante) || "?"}`;
    });
  }

  // Partidos de la jornada `j` (la última o, si aún no se ha jugado ninguna, la próxima),
  // con los goles calculados a partir de la clasificación (herramientas/ffcm.mjs). Los que
  // aún no tienen resultado quedan vacíos (en la imagen, "VS"). Devuelve un resumen o "".
  function rellenar(d) {
    const j = d.ultima || d.proxima;
    if (!j) return "";
    const disparar = (el, ev) => el.dispatchEvent(new Event(ev));
    const partidos = j.partidos;
    const num = document.getElementById("num-partidos");
    num.value = Math.min(MAX_PARTIDOS, partidos.length) || MAX_PARTIDOS;
    disparar(num, "input");

    document.querySelectorAll(".partido").forEach((bloque, i) => {
      const p = partidos[i];
      if (!p) return;
      bloque.querySelectorAll(".equipo-partido").forEach((caja, k) => {
        const [, sel, goles, nombre] = caja.children;
        const ffcm = k === 0 ? p.local : p.visitante;
        const r = Ffcm.esNuestro(ffcm) ? null : Ffcm.rival(ffcm);
        sel.value = r ? r.escudo : NUESTRO;
        disparar(sel, "change");
        if (r && !r.escudo) {
          nombre.value = r.nombre;
          disparar(nombre, "input");
        }
        goles.value = p.goles ? p.goles[k] : "";
        disparar(goles, "input");
      });
    });
    const descansa = j.descansa ? `, descansa ${Ffcm.rival(j.descansa).nombre}` : "";
    const sinGoles = partidos.filter((p) => !p.goles).length;
    const aviso = !d.ultima ? " (aún sin jugar)" : sinGoles ? ` (${sinGoles} sin resultado: ponlo a mano)` : "";
    return `${partidos.length} partidos${descansa}${aviso}`;
  }

  return { TABLA: { post: POST, story: STORY }, pintar, crearFormulario, texto, rellenar };
})();
