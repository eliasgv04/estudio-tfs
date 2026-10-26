/* Utilidades de lienzo compartidas por todas las plantillas.
   Todo se hace a mano (sin ctx.filter) porque Safari en iPhone no lo soporta bien. */

const Lienzo = (() => {
  function cargarImagen(src) {
    return new Promise((ok, mal) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => mal(new Error("No se pudo cargar " + src));
      img.src = src;
    });
  }

  // Dibuja la imagen cubriendo el rectángulo (x, y, ancho, alto) como object-fit: cover,
  // con zoom (>= 1) y desplazamiento (-1..1 en cada eje) elegidos por el usuario.
  function dibujarCubriendoRect(ctx, img, x, y, ancho, alto, zoom = 1, dx = 0, dy = 0) {
    const { w, h, sobraX, sobraY } = medidasCubriendo(img, ancho, zoom, alto);
    ctx.drawImage(img, x - sobraX + dx * sobraX, y - sobraY + dy * sobraY, w, h);
  }

  // Cuánto sobresale la imagen por cada lado (sirve para traducir arrastres a dx/dy).
  function medidasCubriendo(img, ancho, zoom = 1, alto = ancho) {
    const escala = Math.max(ancho / img.naturalWidth, alto / img.naturalHeight) * zoom;
    const w = img.naturalWidth * escala;
    const h = img.naturalHeight * escala;
    return { w, h, sobraX: (w - ancho) / 2, sobraY: (h - alto) / 2 };
  }

  // Tamaños de las tres cajas que aproximan un desenfoque gaussiano de sigma dado.
  function cajasGauss(sigma) {
    const ideal = Math.sqrt((12 * sigma * sigma) / 3 + 1);
    let wl = Math.floor(ideal);
    if (wl % 2 === 0) wl--;
    const m = Math.round((12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4));
    return [0, 1, 2].map((i) => ((i < m ? wl : wl + 2) - 1) / 2);
  }

  // Desenfoque de caja en una dirección, repitiendo el píxel del borde.
  function cajaLinea(src, dst, ancho, alto, r, horizontal) {
    const n = horizontal ? ancho : alto;
    const lineas = horizontal ? alto : ancho;
    const paso = horizontal ? 4 : ancho * 4;
    const inv = 1 / (2 * r + 1);
    for (let l = 0; l < lineas; l++) {
      const base = horizontal ? l * ancho * 4 : l * 4;
      for (let c = 0; c < 3; c++) {
        const at = (i) => src[base + (i < 0 ? 0 : i >= n ? n - 1 : i) * paso + c];
        let suma = 0;
        for (let k = -r; k <= r; k++) suma += at(k);
        for (let i = 0; i < n; i++) {
          dst[base + i * paso + c] = suma * inv;
          suma += at(i + r + 1) - at(i - r);
        }
      }
    }
  }

  // Desenfoque gaussiano (sigma en px) + ajuste de brillo (se suma a cada canal, -255..255)
  // sobre todo el lienzo de ancho x alto.
  function desenfocarYBrillo(ctx, ancho, alto, sigma, brillo) {
    const datos = ctx.getImageData(0, 0, ancho, alto);
    let a = datos.data;
    if (sigma > 0.5) {
      let b = new Uint8ClampedArray(a.length);
      for (const r of cajasGauss(sigma)) {
        cajaLinea(a, b, ancho, alto, r, true);
        cajaLinea(b, a, ancho, alto, r, false);
      }
    }
    if (brillo) {
      for (let i = 0; i < a.length; i += 4) {
        a[i] += brillo;
        a[i + 1] += brillo;
        a[i + 2] += brillo;
      }
    }
    ctx.putImageData(datos, 0, 0);
  }

  // Tamaño de letra para que los números midan `alto` px desde la línea base.
  function tamParaAlto(ctx, fuente, texto, alto) {
    ctx.font = fuente(100);
    const m = ctx.measureText(texto);
    return (100 * alto) / m.actualBoundingBoxAscent;
  }

  // Exporta el lienzo: en iPhone abre el menú de compartir (Guardar imagen); si no, descarga.
  async function exportar(canvas, nombre) {
    const blob = await new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.95));
    const archivo = new File([blob], nombre, { type: "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo] });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return {
    cargarImagen, dibujarCubriendoRect, medidasCubriendo,
    desenfocarYBrillo, tamParaAlto, exportar,
  };
})();
