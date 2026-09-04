/**
 * Previsualización de pólizas (PDF o imagen) renderizada en el cliente con
 * PDF.js. Evita que el navegador descargue el PDF en vez de mostrarlo.
 */
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function esImagen(url: string): boolean {
  const sinQuery = url.split('?')[0];
  return /\.(png|jpe?g|webp|gif)$/i.test(sinQuery);
}

export default function PdfPreview({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);

  if (esImagen(url)) {
    return (
      <div className="flex max-h-[70vh] justify-center overflow-y-auto">
        <img src={url} alt="Vista previa de la póliza" className="w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto rounded-r-sm bg-surface-2 p-3">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p className="p-6 text-center text-small text-ink-muted">Cargando PDF…</p>}
        error={<p className="p-6 text-center text-small text-danger">No se pudo cargar el PDF.</p>}
        options={{ withCredentials: true }}
      >
        {Array.from({ length: numPages ?? 0 }, (_, i) => (
          <Page
            key={`page_${i + 1}`}
            pageNumber={i + 1}
            width={700}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto mb-3 shadow-card"
          />
        ))}
      </Document>
    </div>
  );
}
