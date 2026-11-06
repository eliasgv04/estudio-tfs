/* Escuelas deportivas (del ayuntamiento, no del Torrenueva Futsal): lo común a las
   plantillas de partidos y resultados.
   - Cinco categorías; nuestro equipo en cada una es "<CATEGORÍA> FS".
   - Logos del club y del ayuntamiento arriba a la izquierda (no hay logo de liga).
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
  const nuestro = (i) => `${CATEGORIAS[i].nombre} FS`;

  const LOGOS = { club: "assets/club/escudo-blanco.png", ayuntamiento: "assets/club/ayuntamiento-blanco.png" };
  // Escudo del club y, a su derecha, el del ayuntamiento (mismo alto visual).
  const POSICION_LOGOS = {
    post: { x: 240, y: 168, alto: 150, separacion: 34 },
    story: { x: 230, y: 160, alto: 190, separacion: 40 },
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

  function pintarLogos(ctx) {
    const p = POSICION_LOGOS[estado.formato];
    let x = p.x;
    for (const img of [logos.club, logos.ayuntamiento]) {
      if (!img) continue;
      const w = (img.naturalWidth / img.naturalHeight) * p.alto;
      ctx.drawImage(img, x, p.y, w, p.alto);
      x += w + p.separacion;
    }
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
            <label>Goles ${c.nombre.toLowerCase()} FS <input type="number" data-campo="gn" inputmode="numeric" min="0"></label>
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

  return { CATEGORIAS, nuestro, enOrden, enOrdenTexto, fechaCorta, cargarLogos, pintarLogos, crearFormulario };
})();
