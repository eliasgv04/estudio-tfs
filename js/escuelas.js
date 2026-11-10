/* Escuelas deportivas (del ayuntamiento, no del Torrenueva Futsal): lo común a las
   plantillas de partidos y resultados.
   - Cinco categorías; nuestro equipo es "AYTO. TORRENUEVA FS" en todas (la categoría ya
     va en la etiqueta amarilla de cada tarjeta, para no repetirla).
   - Diseño propio, más atrevido que el del sénior (solo comparte el cuadro de líneas y los
     patrocinadores): foto con tinte verde del club, "ESCUELAS" en vertical con contorno a
     la izquierda, logos del club y del ayuntamiento y título arriba, y una tarjeta por
     categoría con etiqueta y barra en el amarillo del club.
   - Formulario con una pestaña por categoría.
   - Lo que se rellena se guarda en este dispositivo, así que en Resultados ya salen los
     rivales y quién descansa de lo puesto en Partidos. */

const Escuelas = (() => {
  const CATEGORIAS = [
    { id: "prebenjamin", nombre: "PREBENJAMÍN", corto: "Prebenj." },
    { id: "benjamin", nombre: "BENJAMÍN", corto: "Benjamín" },
    { id: "alevin", nombre: "ALEVÍN", corto: "Alevín" },
    { id: "infantil", nombre: "INFANTIL", corto: "Infantil" },
    { id: "cadete", nombre: "CADETE", corto: "Cadete" },
  ];
  const NUESTRO = "AYTO. TORRENUEVA FS";
  const nuestro = () => NUESTRO;
  // "Alevín" para los textos.
  const categoria = (i) => CATEGORIAS[i].nombre.charAt(0) + CATEGORIAS[i].nombre.slice(1).toLowerCase();

  const LOGOS = { club: "assets/club/escudo-blanco.png", ayuntamiento: "assets/club/ayuntamiento-blanco.png" };
  const AMARILLO = "#f4c51d";

  /* Diseño. Todo en px del lienzo de 2048 de ancho; las tarjetas reparten el alto que
     quede y su contenido se escala con ellas (en el story, más grande). */
  const DISENOS = {
    post: {
      plantilla: "assets/plantillas/clasificacion.png", // solo líneas y patrocinadores
      degradado: "arriba", // logos y título (las tarjetas ya tienen fondo)
      vertical: { texto: "ESCUELAS", x: 236, abajo: 1862, arriba: 330, ancho: 360, grosor: 4 },
      cabecera: { x0: 640, x1: 1800, logos: { y: 178, alto: 112, separacion: 30 },
        cursiva: { base: 405, alto: 112 }, fuerte: { base: 572, alto: 150 } },
      tarjetas: { x0: 640, x1: 1800, y0: 630, y1: 1862, hueco: 18 },
    },
    story: {
      plantilla: Estudio.MARCO_STORY,
      degradado: "arriba",
      vertical: { texto: "ESCUELAS DEPORTIVAS", x: 236, abajo: 3455, arriba: 330, ancho: 360, grosor: 5 },
      cabecera: { x0: 640, x1: 1800, logos: { y: 185, alto: 150, separacion: 36 },
        cursiva: { base: 520, alto: 150 }, fuerte: { base: 740, alto: 205 } },
      tarjetas: { x0: 640, x1: 1800, y0: 820, y1: 3455, hueco: 30 },
    },
  };

  const { estado } = Estudio;
  const vacio = () => ({ juega: true, enCasa: true, rival: "", fecha: "", hora: "", lugar: Estudio.PABELLON_CASA, gn: "", gr: "" });
  estado.escuelas = CATEGORIAS.map(vacio);

  const CLAVE = "escuelas";
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || "null");
    if (Array.isArray(guardado)) guardado.forEach((g, i) => i < CATEGORIAS.length && Object.assign(estado.escuelas[i], g));
  } catch {}
  const guardar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(estado.escuelas));
    } catch {}
  };

  const logos = {};
  const cargarLogos = async () => {
    [logos.club, logos.ayuntamiento] = await Promise.all([Lienzo.cargarImagen(LOGOS.club), Lienzo.cargarImagen(LOGOS.ayuntamiento)]);
  };

  const { ANTON, PLAYFAIR, PLAYFAIR_CURSIVA, FUTURA, FUTURA_CONDENSADA_MEDIA } = Estudio;
  const tam = (ctx, fuente, letra, alto) => Lienzo.tamParaAlto(ctx, fuente, letra, alto);

  // Tinte verde oscuro del club sobre la foto, más fuerte hacia abajo (solo dentro del cuadro).
  function pintarTinte(ctx) {
    const c = Estudio.caja();
    const g = ctx.createLinearGradient(0, c.y0, 0, c.y1);
    g.addColorStop(0, `rgba(10,42,22,${0.35 * estado.velo})`);
    g.addColorStop(0.45, `rgba(8,30,16,${0.75 * estado.velo})`);
    g.addColorStop(1, `rgba(4,14,8,${0.95 * estado.velo})`);
    ctx.fillStyle = g;
    ctx.fillRect(c.x0 + 2, c.y0 + 2, c.x1 - c.x0 - 4, c.y1 - c.y0 - 4);
  }

  // Texto en vertical, solo contorno, de abajo arriba ocupando todo el alto, sin que las
  // letras pasen de `ancho` (para no meterse bajo las tarjetas).
  function pintarVertical(ctx, v) {
    const largo = v.abajo - v.arriba;
    ctx.font = ANTON(100);
    const m = ctx.measureText(v.texto);
    const f = Math.min((100 * largo) / m.width, (100 * v.ancho) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
    ctx.save();
    ctx.translate(v.x, v.abajo);
    ctx.rotate(-Math.PI / 2);
    ctx.font = ANTON(f);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.lineWidth = v.grosor;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.strokeText(v.texto, 0, 0);
    ctx.restore();
    ctx.textBaseline = "alphabetic";
  }

  function pintarCabecera(ctx, c, titulo) {
    let x = c.x0;
    for (const img of [logos.club, logos.ayuntamiento]) {
      if (!img) continue;
      const w = (img.naturalWidth / img.naturalHeight) * c.logos.alto;
      ctx.drawImage(img, x, c.logos.y, w, c.logos.alto);
      x += w + c.logos.separacion;
    }
    const ancho = c.x1 - c.x0;
    ctx.textAlign = "right";
    ctx.fillStyle = AMARILLO;
    Estudio.textoAjustado(ctx, titulo, PLAYFAIR_CURSIVA, tam(ctx, PLAYFAIR_CURSIVA, "l", c.cursiva.alto), c.x1 - 30, c.cursiva.base, ancho);
    ctx.fillStyle = "#fff";
    Estudio.textoAjustado(ctx, "FIN DE SEMANA", ANTON, tam(ctx, ANTON, "H", c.fuerte.alto), c.x1, c.fuerte.base, ancho);
  }

  /* Una tarjeta por categoría. `modo`: "partidos" o "resultados".
     Medidas pensadas para una tarjeta de 236 px de alto y escaladas a la real. */
  function pintarTarjeta(ctx, i, x0, x1, y, h, modo) {
    const e = estado.escuelas[i];
    const k = Math.min(h, 400) / 236;
    const kd = Math.min(k, 1.3); // lo de la derecha (día, hora, goles) crece menos, para dejar sitio a los nombres
    const top = y + (h - 236 * k) / 2; // contenido centrado si la tarjeta es más alta
    const pad = 40 * k;

    // Fondo, borde fino y barra amarilla.
    ctx.fillStyle = e.juega ? "rgba(0,0,0,0.42)" : "rgba(0,0,0,0.25)";
    ctx.fillRect(x0, y, x1 - x0, h);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x0 + 1, y + 1, x1 - x0 - 2, h - 2);
    ctx.fillStyle = AMARILLO;
    ctx.fillRect(x0, y, 12 * k, h);

    // Etiqueta: categoría en amarillo y, en partidos, el lugar al lado.
    const xt = x0 + 12 * k + pad;
    const baseEtiqueta = top + 62 * k;
    ctx.textAlign = "left";
    ctx.font = ANTON(tam(ctx, ANTON, "H", 38 * k));
    ctx.fillText(CATEGORIAS[i].nombre, xt, baseEtiqueta);
    const anchoEtiqueta = ctx.measureText(CATEGORIAS[i].nombre).width;
    ctx.fillStyle = "#fff";
    const derecha = x1 - pad;
    if (modo === "partidos" && e.juega && e.lugar.trim()) {
      ctx.globalAlpha = 0.75;
      const xl = xt + anchoEtiqueta + 24 * k;
      Estudio.textoAjustado(ctx, e.lugar.trim().toUpperCase(), FUTURA_CONDENSADA_MEDIA,
        tam(ctx, FUTURA_CONDENSADA_MEDIA, "H", 22 * k), xl, baseEtiqueta, derecha - xl);
      ctx.globalAlpha = 1;
    }

    const filas = [top + 135 * k, top + 202 * k];
    const tamNombre = tam(ctx, FUTURA(700), "H", 33 * k);
    // En partidos se deja a la derecha sitio para el día y la hora.
    const anchoNombres = (derecha - xt) * (modo === "partidos" ? 0.6 : 0.8);

    if (!e.juega) {
      ctx.globalAlpha = 0.85;
      Estudio.textoAjustado(ctx, nuestro(i), FUTURA(700), tamNombre, xt, filas[0] + 30 * k, (derecha - xt) * 0.58);
      ctx.fillStyle = AMARILLO;
      ctx.textAlign = "right";
      ctx.font = PLAYFAIR_CURSIVA(tam(ctx, PLAYFAIR_CURSIVA, "d", 58 * kd));
      ctx.fillText("descansa", derecha, filas[0] + 34 * k);
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 1;
      return;
    }

    // Local arriba y visitante abajo, como en un marcador; el nuestro en negrita.
    const equipos = enOrden(i);
    equipos.forEach((eq, f) => {
      ctx.textAlign = "left";
      ctx.globalAlpha = eq.nuestro ? 1 : 0.88;
      Estudio.textoAjustado(ctx, eq.texto, FUTURA(eq.nuestro ? 700 : 400), tamNombre, xt, filas[f], anchoNombres);
      ctx.globalAlpha = 1;
    });

    if (modo === "partidos") {
      // A la derecha: el día grande y la hora en amarillo.
      ctx.textAlign = "right";
      const dia = fechaCorta(e.fecha);
      if (dia) Estudio.textoAjustado(ctx, dia, ANTON, tam(ctx, ANTON, "H", 44 * kd), derecha, filas[0] - 4 * k, (derecha - xt) * 0.34);
      if (e.hora) {
        ctx.fillStyle = AMARILLO;
        ctx.font = ANTON(tam(ctx, ANTON, "H", 64 * kd));
        ctx.fillText(`${e.hora}H`, derecha, filas[1] + 4 * k);
        ctx.fillStyle = "#fff";
      }
    } else {
      // A la derecha de cada equipo, sus goles (los nuestros en amarillo); sin goles, "–".
      const goles = e.enCasa ? [e.gn, e.gr] : [e.gr, e.gn];
      const hay = goles.some((g) => String(g) !== "");
      ctx.textAlign = "right";
      ctx.font = PLAYFAIR(tam(ctx, PLAYFAIR, "0", 54 * kd));
      equipos.forEach((eq, f) => {
        ctx.fillStyle = eq.nuestro ? AMARILLO : "#fff";
        ctx.fillText(hay ? String(goles[f] || 0) : "–", derecha, filas[f] + 6 * k);
      });
      ctx.fillStyle = "#fff";
    }
  }

  // Todo el diseño. `modo` ("partidos" o "resultados") es también la palabra del título.
  function pintar(ctx, D, modo) {
    pintarTinte(ctx);
    ctx.fillStyle = "#fff";
    pintarVertical(ctx, D.vertical);
    pintarCabecera(ctx, D.cabecera, modo);
    const t = D.tarjetas;
    const n = CATEGORIAS.length;
    const h = (t.y1 - t.y0 - (n - 1) * t.hueco) / n;
    CATEGORIAS.forEach((c, i) => pintarTarjeta(ctx, i, t.x0, t.x1, t.y0 + i * (h + t.hueco), h, modo));
  }

  // "SÁB 8 NOV" a partir de AAAA-MM-DD.
  function fechaCorta(iso) {
    if (!iso) return "";
    const [a, m, d] = iso.split("-").map(Number);
    const dia = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"][new Date(a, m - 1, d).getDay()];
    const mes = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][m - 1];
    return `${dia} ${d} ${mes}`;
  }

  // [local, visitante] de la categoría i, con nuestro nombre marcado.
  function enOrden(i) {
    const e = estado.escuelas[i];
    const n = { texto: nuestro(i), nuestro: true };
    const r = { texto: e.rival.trim().toUpperCase() || "RIVAL", nuestro: false };
    return e.enCasa ? [n, r] : [r, n];
  }

  // Igual, para el texto de la publicación: nuestro nombre en negrita y el rival tal como
  // se ha escrito.
  function enOrdenTexto(i) {
    const e = estado.escuelas[i];
    const n = `{f:${nuestro(i)}}`;
    const r = e.rival.trim() || "Rival";
    return e.enCasa ? [n, r] : [r, n];
  }

  /* ---------- Formulario: una pestaña por categoría ---------- */

  // `campos`: "partidos" (fecha, hora y lugar) o "resultados" (goles).
  function crearFormulario(campos) {
    const pestanas = document.getElementById("pestanas");
    const cont = document.getElementById("categorias");
    let activa = 0;

    const cambiado = () => {
      guardar();
      actualizarPestanas();
      Estudio.refrescar();
    };

    CATEGORIAS.forEach((c, i) => {
      const e = estado.escuelas[i];
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "pestana";
      boton.addEventListener("click", () => activar(i));
      pestanas.appendChild(boton);

      const bloque = document.createElement("div");
      bloque.className = "categoria";
      bloque.innerHTML = `
        <div class="opciones">
          <label><input type="radio" name="juega-${i}" value="si"> Juega</label>
          <label><input type="radio" name="juega-${i}" value="no"> Descansa</label>
        </div>
        <div class="si-juega">
          <div class="opciones">
            <label><input type="radio" name="campo-${i}" value="casa"> En casa (local)</label>
            <label><input type="radio" name="campo-${i}" value="fuera"> Fuera (visitante)</label>
          </div>
          <label>Rival
            <input type="text" data-campo="rival" placeholder="Nombre del rival" autocomplete="off">
          </label>
          ${campos === "partidos" ? `
          <div class="fila">
            <label>Fecha <input type="date" data-campo="fecha"></label>
            <label>Hora <input type="time" data-campo="hora"></label>
          </div>
          <label>Lugar
            <input type="text" data-campo="lugar" autocomplete="off">
          </label>` : `
          <div class="fila">
            <label>Goles Ayto. Torrenueva <input type="number" data-campo="gn" inputmode="numeric" min="0"></label>
            <label>Goles rival <input type="number" data-campo="gr" inputmode="numeric" min="0"></label>
          </div>`}
        </div>`;
      const siJuega = bloque.querySelector(".si-juega");
      const lugar = bloque.querySelector('[data-campo="lugar"]');

      bloque.querySelectorAll(`input[name="juega-${i}"]`).forEach((r) => {
        r.checked = (r.value === "si") === e.juega;
        r.addEventListener("change", () => {
          e.juega = r.value === "si";
          siJuega.hidden = !e.juega;
          cambiado();
        });
      });
      siJuega.hidden = !e.juega;

      bloque.querySelectorAll(`input[name="campo-${i}"]`).forEach((r) => {
        r.checked = (r.value === "casa") === e.enCasa;
        r.addEventListener("change", () => {
          e.enCasa = r.value === "casa";
          // En casa se propone nuestro pabellón; fuera se deja para escribir.
          if (lugar) {
            e.lugar = e.enCasa ? Estudio.PABELLON_CASA : "";
            lugar.value = e.lugar;
          }
          cambiado();
        });
      });

      bloque.querySelectorAll("[data-campo]").forEach((input) => {
        const clave = input.dataset.campo;
        input.value = e[clave];
        input.addEventListener("input", () => {
          e[clave] = input.value;
          cambiado();
        });
      });

      cont.appendChild(bloque);
    });

    function activar(i) {
      activa = i;
      document.querySelectorAll(".categoria").forEach((b, k) => (b.hidden = k !== activa));
      document.getElementById("titulo-categoria").textContent = CATEGORIAS[activa].nombre;
      document.getElementById("anterior").disabled = activa === 0;
      document.getElementById("siguiente").disabled = activa === CATEGORIAS.length - 1;
      actualizarPestanas();
    }

    // Cada pestaña: categoría y si juega, descansa o su marcador.
    function actualizarPestanas() {
      document.querySelectorAll(".pestana").forEach((b, i) => {
        const e = estado.escuelas[i];
        let resumen = e.juega ? (e.rival.trim() ? "✓" : "·") : "desc.";
        if (campos === "resultados" && e.juega && (e.gn !== "" || e.gr !== "")) {
          resumen = e.enCasa ? `${e.gn || 0}–${e.gr || 0}` : `${e.gr || 0}–${e.gn || 0}`;
        }
        b.classList.toggle("activa", i === activa);
        b.innerHTML = `<b>${CATEGORIAS[i].corto}</b><small>${resumen}</small>`;
      });
    }

    document.getElementById("anterior").addEventListener("click", () => activar(activa - 1));
    document.getElementById("siguiente").addEventListener("click", () => activar(activa + 1));
    activar(0);
  }

  return { CATEGORIAS, DISENOS, nuestro, categoria, enOrden, enOrdenTexto, fechaCorta, cargarLogos, pintar, crearFormulario };
})();
