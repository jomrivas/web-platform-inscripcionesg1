// lib/ramas.ts
// Etiquetas visibles de rama (spec 005, R5). Los valores guardados en la
// base no cambian; solo cambia cómo se muestran.

export type RamaId = 'manada' | 'unidad' | 'caminantes' | 'rover';

export const RAMAS: Record<string, { id: RamaId; label: string }> = {
  manada_7_10: { id: 'manada', label: 'Manada' },
  scouts_11_14: { id: 'unidad', label: 'Unidad Scout' },
  caminantes_15_17: { id: 'caminantes', label: 'Comunidad de Caminantes' },
  rovers_18_21: { id: 'rover', label: 'Clan Rover' },
};

/** Etiqueta visible para un valor guardado; si no es una rama conocida
 *  (p. ej. la rama libre de un adulto), devuelve el texto tal cual. */
export function ramaLabel(value: string | null | undefined): string {
  if (!value) return '';
  return RAMAS[value]?.label ?? value;
}
