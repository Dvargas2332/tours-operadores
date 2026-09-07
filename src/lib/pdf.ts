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

/** Genera y descarga un PDF con la política de cancelación del tour. */
export async function descargarPoliticaPdf(tour: Tour): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Logo del hotel (volcán de Lavas Tacotal)
  try {
    const logo = await cargarImagen('./logo/volcan.png');
    doc.addImage(logo, 'PNG', 20, 15, 24, 24);
  } catch {
    // sin logo, continuamos
  }

  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text('Política de cancelación', 105, 25, { align: 'center' });

  doc.setDrawColor(180);
  doc.line(20, 32, 190, 32);

  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text(`Tour: ${tour.nombre}`, 20, 42);
  doc.text(`Operador: ${tour.operador.nombre}`, 20, 49);

  doc.setFontSize(11);
  doc.setTextColor(40);
  const politica = tour.politica_cancelacion?.trim() || 'No especificada.';
  const lineas = doc.splitTextToSize(politica, 170);
  doc.text(lineas, 20, 60);

  const yNota = 60 + lineas.length * 5 + 10;
  doc.setFontSize(10);
  doc.setTextColor(80);
  const nota = 'Horario y logística: el transporte se debe consultar en recepción.';
  doc.text(doc.splitTextToSize(nota, 170), 20, yNota);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`© ${new Date().getFullYear()} Tours Operadores · by Kazehana Cloud`, 105, 285, {
    align: 'center',
  });

  const nombreArchivo = `politica-${tour.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  doc.save(nombreArchivo);
}
