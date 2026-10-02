import type { Diccionario } from '../types';

/** Textos del detalle de tour (página /tour/:id y drawer de escritorio). */
const detalle: Diccionario = {
  // Acciones del header (tooltips / aria-labels)
  'detalle.tooltip_quitar_comparador': 'Quitar del comparador',
  'detalle.tooltip_comparar': 'Comparar (tecla C)',
  'detalle.tooltip_copiar_resumen': 'Copiar resumen',
  'detalle.tooltip_cerrar': 'Cerrar (Esc)',
  'detalle.operador': 'Operador',

  // Franja de datos clave
  'detalle.aria_datos_clave': 'Datos clave',
  'detalle.caption_tarifas': 'tarifas',
  'detalle.caption_rack_adulto': 'rack · adulto',
  'detalle.caption_precio_adulto': 'precio adulto',
  'detalle.caption_horario_operador': 'horario del operador',
  'detalle.min_personas': 'Mín. {n} personas',
  'detalle.apto_ninos': 'Apto para niños',
  'detalle.solo_adultos': 'Solo adultos',
  'detalle.todos_los_dias': 'Todos los días',

  // Tabla de tarifas
  'detalle.aria_tarifas': 'Tarifas',
  'detalle.tarifas': 'Tarifas',
  'detalle.col_tarifa': 'Tarifa',
  'detalle.col_edad': 'Edad',
  'detalle.col_rack': 'Rack (público)',
  'detalle.col_precio': 'Precio',
  'detalle.col_neta': 'Neta (interno)',
  'detalle.col_margen': 'Margen',
  'detalle.rango_edad': '{min} - {max} años',
  'detalle.desde_edad': '+{min} años',
  'detalle.sin_tarifas': 'No hay tarifas cargadas.',

  // Qué incluye
  'detalle.aria_incluye': 'Qué incluye',
  'detalle.incluye': 'Incluye',
  'detalle.sin_especificar': 'Sin especificar en el tarifario',

  // Horarios y logística
  'detalle.aria_horarios': 'Horarios y logística',
  'detalle.horarios_logistica': 'Horarios y logística',
  'detalle.fila_horarios': 'Horarios de tours',
  'detalle.no_especificado': 'No especificado',
  'detalle.fila_recojo': 'Recojo en hotel',
  'detalle.recojo_incluido': 'Incluido — pasan 30 min antes',
  'detalle.recojo_consultar': 'Consultar con operador',
  'detalle.fila_minimo': 'Mínimo de personas',
  'detalle.fila_dias': 'Días de operación',
  'detalle.lunes_a_domingo': 'Lunes a domingo',

  // Políticas + observaciones
  'detalle.aria_politicas': 'Políticas y observaciones',
  'detalle.politica_cancelacion': 'Política de cancelación',
  'detalle.politica_descripcion': 'Consulta la política completa en PDF con el logo y el tour.',
  'detalle.generando': 'Generando…',
  'detalle.vista_previa': 'Vista previa',
  'detalle.descargar_pdf': 'Descargar (PDF)',
  'detalle.observaciones': 'Observaciones',
  'detalle.observaciones_del_operador': 'Observaciones del operador',

  // Procedencia del dato (solo admin)
  'detalle.aria_procedencia': 'Procedencia del dato',
  'detalle.aviso_warn': 'Este tarifario tiene más de 90 días — considera confirmar el precio.',
  'detalle.aviso_danger': 'Tarifario desactualizado (>6 meses). Confirma con el operador antes de cotizar al huésped.',
  'detalle.ver_contacto': 'Ver contacto del operador',
  'detalle.actualizado': 'Actualizado',
  'detalle.tarifario_vigente': 'tarifario vigente {anio}',

  // Diálogo de vista previa del PDF
  'detalle.vista_previa_politica': 'Vista previa — Política de cancelación',

  // Copiar resumen (solo admin)
  'detalle.copiado': 'Copiado ✓',
  'detalle.copiar_resumen_huesped': 'Copiar resumen para el huésped',

  // Toasts
  'detalle.toast_copiado': 'Resumen copiado al portapapeles',
  'detalle.toast_error_copiar': 'No se pudo copiar el resumen',
  'detalle.toast_error_pdf': 'No se pudo generar la vista previa de la política',

  // Skeleton / estados
  'detalle.cargando': 'Cargando detalle del tour',

  // Popover de operador
  'detalle.contacto': 'Contacto',
  'detalle.sin_datos_contacto': 'Sin datos de contacto',
  'detalle.enviar_whatsapp': 'Enviar por WhatsApp',
  'detalle.comision': 'Comisión',
  'detalle.uso_interno': 'Uso interno — no mostrar al huésped',

  // Página completa / drawer
  'detalle.aria_detalle_de': 'Detalle de {nombre}',
  'detalle.titulo': 'Detalle de tour',
  'detalle.no_encontrado': 'Este tour ya no está en la base de datos',
  'detalle.no_encontrado_desc': 'Puede haber sido reemplazado por una carga más reciente del operador.',
  'detalle.volver_a_buscar': 'Volver a buscar',
  'detalle.similares': 'Tours similares',
  'detalle.adulto': 'adulto',
  'detalle.abrir_pagina': 'Abrir página completa',

  // Textos del resumen copiable (resumen.ts)
  'detalle.resumen_horarios': 'Horarios de tours: {h}',
  'detalle.resumen_incluye': 'Incluye: {items}',
  'detalle.resumen_minimo': 'Mínimo {n} personas · {apto}',
  'detalle.resumen_cancelacion': 'Cancelación: {politica}',
  'detalle.resumen_zona': 'Zona: {zona}',
  'detalle.resumen_comparacion': 'Comparación de tours (precios en {monedas}):',
  'detalle.resumen_nino_no_aplica': 'adulto · niño no aplica',
};

export default detalle;
