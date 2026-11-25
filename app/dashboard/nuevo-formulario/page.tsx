// app/dashboard/nuevo-formulario/page.tsx — tablero 3 · ¿Quién se inscribe?
import { TipoSelector } from './TipoSelector';

export default function SeleccionarTipoFormularioPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-muted">Nueva inscripción</span>
        <h1 className="m-0 text-2xl font-extrabold tracking-tight">¿Quién se inscribe?</h1>
        <p className="m-0 text-[15px] leading-normal text-muted">
          Elige el tipo de ficha. Se llena, se firma y se envía en una sola sesión.
        </p>
      </div>
      <TipoSelector />
    </div>
  );
}
