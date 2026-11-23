---
id: 0004
titulo: Identidad visual de la app — azul del logo y blanco, colores por rama, Nunito
estado: aceptada
fecha: 2026-11-22
decide: Mauricio Rivas
constitucion: [C7]
relacionada: [spec 005]
---

# 0004 — Identidad visual de la app

## Contexto

El Grupo Scout No. 1 «Los Intrépidos» no tiene un manual de identidad pulido.
Lo que existe:

- **Dos colores tradicionales**, blanco y azul, los de la pañoleta, que evocan la
  bandera de El Salvador: el G1 fue el primer grupo inscrito en la ASES.
- **Un logotipo** que Mauricio rediseñó, en dos variantes (horizontal y
  vertical), con versión en negativo e isotipo. Cuatro figuras de colores
  alrededor del emblema scout mundial, y el nombre en azul.
- **Una paleta** (`paleta_2027`) en tonos malva y gris apagados.

El manual de identidad del grupo se trabajará aparte. La app necesitaba una
decisión antes.

## Opciones

| | Qué implicaba | Veredicto |
|---|---|---|
| **A. Azul + blanco** de la pañoleta y el logo | La paleta 2027 no entra a la app | **Elegida** |
| B. Adoptar la paleta 2027 | Mirage como texto, Martinique como acción, Prim de fondo | Descartada: pierde el azul de la pañoleta y ningún color aparece en el logo; resulta más apagada que fresca |
| C. Híbrido | Azul para acciones, grises de la paleta 2027 como neutros | Descartada: agrega matices sin ganancia clara |

## Decisión

**Azul y blanco**, con estas precisiones:

- **Azul único `#0E1754`**, el del texto del logo. El `#0E1958` que se dio como
  referencia de la pañoleta es prácticamente idéntico; se unifica para que la
  app y el logotipo coincidan exactamente.
- **Colores por rama, tomados del logo**, usados solo como acento (un punto junto
  al nombre, fondo tenue), nunca como color de texto:

  | Rama | Color del logo |
  |---|---|
  | Manada | amarillo `#F2EB0C` |
  | Unidad Scout | verde `#0E6305` |
  | Comunidad de Caminantes | celeste `#0C6AC6` |
  | Clan Rover | rojo `#AA0F0F` |

- **Colores de estado** independientes de las ramas, con contraste comprobado
  sobre blanco: aprobada `#0E7A55`, en revisión `#A15C07`, rechazada `#B42318`.
- **Tipografía Nunito**: redondeada y cercana para las familias, legible en las
  tablas del admin. Coincide con una de las referencias de estilo de Mauricio.
- **Neutros** fríos que acompañan al azul: fondo `#F4F6FB`, borde `#E2E6F0`,
  texto secundario `#5A6380`.

## Consecuencias

- La paleta 2027 queda para otras piezas del grupo.
- El amarillo de Manada no tiene contraste suficiente para texto ni para ser la
  única señal: por eso las ramas siempre llevan su nombre escrito.
- Cuando exista el manual de identidad del grupo, esta decisión se revisa contra
  él; si lo contradice, se escribe una decisión nueva que la supersede.
