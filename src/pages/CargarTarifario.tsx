/**
 * Página: Cargar catálogo (`/admin/cargar`) — importación masiva.
 * Wizard de 4 pasos: subir Excel → extracción real → revisión editable
 * (agrupada por operador) → confirmación. El botón final llama a la
 * mutación tRPC real `tours.importarCatalogo`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PasoExito from '@/components/admin/cargar/PasoExito';
import PasoExtraccion from '@/components/admin/cargar/PasoExtraccion';
import PasoRevision from '@/components/admin/cargar/PasoRevision';
import PasoSubir from '@/components/admin/cargar/PasoSubir';
import Stepper from '@/components/admin/cargar/Stepper';
import type { ArchivoSubido, FilaRevision } from '@/components/admin/cargar/tipos';
import { filaAInput } from '@/components/admin/cargar/tipos';
import type { OperadorCatalogo } from '@/components/admin/cargar/tarifario-excel';
import { trpc } from '@/providers/trpc';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const BORRADOR_KEY = 'tourhub-borrador-catalogo';

interface Borrador {
  archivo: ArchivoSubido;
  filas: FilaRevision[];
  comisiones: Record<string, number | null>;
}

interface Resultado {
  operadores: number;
  tours: number;
  fecha: string;
  fuente: string;
}

export default function CargarTarifario() {
  const [paso, setPaso] = useState(1);
  const [direccion, setDireccion] = useState(1);
  const [archivo, setArchivo] = useState<ArchivoSubido | null>(null);
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [filas, setFilas] = useState<FilaRevision[]>([]);
  const [comisiones, setComisiones] = useState<Record<string, number | null>>({});
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [borradorInicial] = useState<Borrador | null>(() => {
    try {
      const crudo = window.sessionStorage.getItem(BORRADOR_KEY);
      return crudo ? (JSON.parse(crudo) as Borrador) : null;
    } catch {
      return null;
    }
  });
  const [hayBorrador, setHayBorrador] = useState(borradorInicial != null);

  const mutacion = trpc.tours.importarCatalogo.useMutation({
    onSuccess: (res) => {
      window.sessionStorage.removeItem(BORRADOR_KEY);
      setHayBorrador(false);
      setResultado({
        operadores: res.operadoresCreados + res.operadoresActualizados,
        tours: res.toursInsertados,
        fecha: new Date().toISOString().slice(0, 10),
        fuente: archivo?.nombre ?? 'catálogo',
      });
      setDireccion(1);
      setPaso(4);
    },
    onError: (err) => setErrorConfirmacion(err.message),
  });

  // Borrador en sessionStorage (revisión sin confirmar)
  useEffect(() => {
    if (paso !== 3 || !archivo || filas.length === 0) return;
    const t = window.setTimeout(() => {
      const borrador: Borrador = { archivo, filas, comisiones };
      window.sessionStorage.setItem(BORRADOR_KEY, JSON.stringify(borrador));
    }, 500);
    return () => window.clearTimeout(t);
  }, [paso, archivo, filas, comisiones]);

  /* ----- Navegación del wizard ----- */
  const irAPaso = (n: number) => {
    setDireccion(n > paso ? 1 : -1);
    setPaso(n);
  };

  const onArchivoListo = useCallback(
    (nuevo: ArchivoSubido, file: File) => {
      setArchivo(nuevo);
      setArchivoFile(file);
      irAPaso(2);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paso],
  );

  const onExtraccionTerminada = useCallback(
    (operadores: OperadorCatalogo[]) => {
      const todas: FilaRevision[] = operadores.flatMap((op) => op.tours);
      const comis: Record<string, number | null> = {};
      for (const op of operadores) comis[op.nombre] = op.comision;
      setFilas(todas);
      setComisiones(comis);
      irAPaso(3);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [paso],
  );

  const confirmar = () => {
    if (!archivo) return;
    setErrorConfirmacion(null);

    const activas = filas.filter((f) => !f.excluida);
    const porOperador = new Map<string, FilaRevision[]>();
    for (const f of activas) {
      const lista = porOperador.get(f.operador) ?? [];
      lista.push(f);
      porOperador.set(f.operador, lista);
    }
    const operadores = [...porOperador.entries()].map(([nombre, tours]) => ({
      nombre,
      contacto: '',
      comision: comisiones[nombre] ?? null,
      tours: tours.map(filaAInput),
    }));

    mutacion.mutate({
      fuente: archivo.nombre,
      fechaActualizacion: new Date().toISOString().slice(0, 10),
      operadores,
    });
  };

  const continuarBorrador = () => {
    if (!borradorInicial) return;
    setArchivo(borradorInicial.archivo);
    setFilas(borradorInicial.filas);
    setComisiones(borradorInicial.comisiones);
    setHayBorrador(false);
    irAPaso(3);
  };

  const descartarBorrador = () => {
    window.sessionStorage.removeItem(BORRADOR_KEY);
    setHayBorrador(false);
  };

  const reiniciarWizard = () => {
    setArchivo(null);
    setArchivoFile(null);
    setFilas([]);
    setComisiones({});
    setResultado(null);
    setErrorConfirmacion(null);
    irAPaso(1);
  };

  const totalOperadores = useMemo(() => new Set(filas.map((f) => f.operador)).size, [filas]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <Stepper paso={paso} />

        <div className={paso === 3 ? 'mt-6' : 'mx-auto mt-6 max-w-[860px]'}>
          <AnimatePresence mode="wait" initial={false} custom={direccion}>
            <motion.div
              key={paso}
              custom={direccion}
              initial={{ opacity: 0, x: 24 * direccion }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 * direccion }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              {paso === 1 && (
                <PasoSubir
                  onArchivoListo={onArchivoListo}
                  hayBorrador={hayBorrador}
                  onContinuarBorrador={continuarBorrador}
                  onDescartarBorrador={descartarBorrador}
                />
              )}

              {paso === 2 && archivo && archivoFile && (
                <PasoExtraccion
                  archivo={archivo}
                  file={archivoFile}
                  onTerminado={onExtraccionTerminada}
                  onCancelar={() => {
                    setArchivo(null);
                    setArchivoFile(null);
                    irAPaso(1);
                  }}
                />
              )}

              {paso === 3 && (
                <PasoRevision
                  filas={filas}
                  onFilasChange={setFilas}
                  totalOperadores={totalOperadores}
                  onVolver={() => irAPaso(1)}
                  onConfirmar={confirmar}
                  confirmando={mutacion.isPending}
                  errorConfirmacion={errorConfirmacion}
                />
              )}

              {paso === 4 && resultado && (
                <PasoExito
                  operadores={resultado.operadores}
                  tours={resultado.tours}
                  fecha={resultado.fecha}
                  fuente={resultado.fuente}
                  onCargarOtro={reiniciarWizard}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
