import { jsPDF } from 'jspdf';
import type { Tour } from '@/data/mock-tours';

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el logo'));
    img.src = url;
  });
}

/** Construye el documento PDF con la política de cancelación. */
async function construirDoc(tour: Tour): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margen = 20;

  // Logo del hotel (volcán de Lavas Tacotal) centrado arriba, sin deformar.
  let cursor = 20;
  try {
    const logo = await cargarImagen('./logo/volcan.png');
    const maxAncho = 30;
    const maxAlto = 26;
    const ratio = logo.naturalHeight / logo.naturalWidth;
    let w = maxAncho;
    let h = w * ratio;
    if (h > maxAlto) {
      h = maxAlto;
      w = h / ratio;
    }
    const x = (pageWidth - w) / 2;
    const y = 12;
    doc.addImage(logo, 'PNG', x, y, w, h);
    cursor = y + h + 8;
  } catch {
    cursor = 20;
  }

  // Título centrado
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text('Política de cancelación', pageWidth / 2, cursor, { align: 'center' });
  cursor += 7;

  doc.setDrawColor(180);
  doc.line(margen, cursor, pageWidth - margen, cursor);
  cursor += 10;

  // Tour y operador (texto con salto de línea para nombres largos)
  doc.setFontSize(12);
  doc.setTextColor(60);
  const infoTour = doc.splitTextToSize(`Tour: ${tour.nombre}`, pageWidth - margen * 2);
  doc.text(infoTour, margen, cursor);
  cursor += infoTour.length * doc.getLineHeight() + 3;

  const infoOperador = doc.splitTextToSize(`Operador: ${tour.operador.nombre}`, pageWidth - margen * 2);
  doc.text(infoOperador, margen, cursor);
  cursor += infoOperador.length * doc.getLineHeight() + 6;

  // Política completa
  doc.setFontSize(11);
  doc.setTextColor(40);
  const politica = tour.politica_cancelacion?.trim() || 'No especificada.';
  const lineas = doc.splitTextToSize(politica, pageWidth - margen * 2);
  doc.text(lineas, margen, cursor);
  cursor += lineas.length * doc.getLineHeight() + 8;

  // Nota de logística
  doc.setFontSize(10);
  doc.setTextColor(80);
  const nota = 'Horario y logística: el transporte se debe consultar en recepción.';
  doc.text(doc.splitTextToSize(nota, pageWidth - margen * 2), margen, cursor);

  // Pie de página
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`© ${new Date().getFullYear()} Tours Operadores · by Kazehana Cloud`, pageWidth / 2, 285, {
    align: 'center',
  });

  return doc;
}

/** Genera el PDF y devuelve el Blob (para vista previa). */
export async function generarPoliticaPdf(tour: Tour): Promise<Blob> {
  const doc = await construirDoc(tour);
  return doc.output('blob');
}

/** Genera y descarga el PDF de la política de cancelación. */
export async function descargarPoliticaPdf(tour: Tour): Promise<void> {
  const doc = await construirDoc(tour);
  const nombreArchivo = `politica-${tour.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  doc.save(nombreArchivo);
}
