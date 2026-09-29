import type { Diccionario } from '../types';

/** Texts for the tour detail page (/tour/:id and desktop drawer). */
const detalle: Diccionario = {
  // Header actions (tooltips / aria-labels)
  'detalle.tooltip_quitar_comparador': 'Remove from comparison',
  'detalle.tooltip_comparar': 'Compare (C key)',
  'detalle.tooltip_copiar_resumen': 'Copy summary',
  'detalle.tooltip_cerrar': 'Close (Esc)',
  'detalle.operador': 'Operator',

  // Key facts strip
  'detalle.aria_datos_clave': 'Key facts',
  'detalle.caption_tarifas': 'rates',
  'detalle.caption_rack_adulto': 'rack · adult',
  'detalle.caption_precio_adulto': 'adult price',
  'detalle.caption_horario_operador': 'operator schedule',
  'detalle.min_personas': 'Min. {n} people',
  'detalle.apto_ninos': 'Kids friendly',
  'detalle.solo_adultos': 'Adults only',
  'detalle.todos_los_dias': 'Every day',

  // Rates table
  'detalle.aria_tarifas': 'Rates',
  'detalle.tarifas': 'Rates',
  'detalle.col_tarifa': 'Rate',
  'detalle.col_edad': 'Age',
  'detalle.col_rack': 'Rack (public)',
  'detalle.col_precio': 'Price',
  'detalle.col_neta': 'Net (internal)',
  'detalle.col_margen': 'Margin',
  'detalle.rango_edad': '{min} - {max} yrs',
  'detalle.desde_edad': '+{min} yrs',
  'detalle.sin_tarifas': 'No rates loaded.',

  // What it includes
  'detalle.aria_incluye': 'What it includes',
  'detalle.incluye': 'Includes',
  'detalle.sin_especificar': 'Not specified in the rate sheet',

  // Schedules and logistics
  'detalle.aria_horarios': 'Schedules and logistics',
  'detalle.horarios_logistica': 'Schedules and logistics',
  'detalle.fila_horarios': 'Tour schedules',
  'detalle.no_especificado': 'Not specified',
  'detalle.fila_recojo': 'Hotel pickup',
  'detalle.recojo_incluido': 'Included — pickup 30 min before',
  'detalle.recojo_consultar': 'Ask the operator',
  'detalle.fila_minimo': 'Minimum people',
  'detalle.fila_dias': 'Operating days',
  'detalle.lunes_a_domingo': 'Monday to Sunday',

  // Policies + notes
  'detalle.aria_politicas': 'Policies and notes',
  'detalle.politica_cancelacion': 'Cancellation policy',
  'detalle.politica_descripcion': 'See the full policy in PDF with the logo, the tour and the operator.',
  'detalle.generando': 'Generating…',
  'detalle.vista_previa': 'Preview',
  'detalle.descargar_pdf': 'Download (PDF)',
  'detalle.observaciones': 'Notes',
  'detalle.observaciones_del_operador': 'Operator notes',

  // Data provenance (admin only)
  'detalle.aria_procedencia': 'Data provenance',
  'detalle.aviso_warn': 'This rate sheet is over 90 days old — consider confirming the price.',
  'detalle.aviso_danger': 'Outdated rate sheet (>6 months). Confirm with the operator before quoting to the guest.',
  'detalle.ver_contacto': 'View operator contact',
  'detalle.actualizado': 'Updated',
  'detalle.tarifario_vigente': 'current rate sheet {anio}',

  // Policy PDF preview dialog
  'detalle.vista_previa_politica': 'Preview — Cancellation policy',

  // Copy summary (admin only)
  'detalle.copiado': 'Copied ✓',
  'detalle.copiar_resumen_huesped': 'Copy summary for the guest',

  // Toasts
  'detalle.toast_copiado': 'Summary copied to clipboard',
  'detalle.toast_error_copiar': 'Could not copy the summary',
  'detalle.toast_error_pdf': 'Could not generate the policy preview',

  // Skeleton / states
  'detalle.cargando': 'Loading tour details',

  // Operator popover
  'detalle.contacto': 'Contact',
  'detalle.sin_datos_contacto': 'No contact info',
  'detalle.enviar_whatsapp': 'Send via WhatsApp',
  'detalle.comision': 'Commission',
  'detalle.uso_interno': 'Internal use — do not show the guest',

  // Full page / drawer
  'detalle.aria_detalle_de': '{nombre} details',
  'detalle.titulo': 'Tour details',
  'detalle.no_encontrado': 'This tour is no longer in the database',
  'detalle.no_encontrado_desc': 'It may have been replaced by a more recent upload from the operator.',
  'detalle.volver_a_buscar': 'Back to search',
  'detalle.similares': 'Similar tours',
  'detalle.adulto': 'adult',
  'detalle.abrir_pagina': 'Open full page',

  // Copyable summary texts (resumen.ts)
  'detalle.resumen_horarios': 'Tour schedules: {h}',
  'detalle.resumen_incluye': 'Includes: {items}',
  'detalle.resumen_minimo': 'Minimum {n} people · {apto}',
  'detalle.resumen_cancelacion': 'Cancellation: {politica}',
  'detalle.resumen_zona': 'Area: {zona}',
  'detalle.resumen_comparacion': 'Tour comparison (prices in {monedas}):',
  'detalle.resumen_nino_no_aplica': 'adult · child N/A',
};

export default detalle;
