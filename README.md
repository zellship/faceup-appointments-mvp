# Faceup · Appointments MVP

Contrato visual interactivo del MVP de gestión de citas de Faceup sobre Zellship.

## Alcance

- POS y Admin.
- Agenda móvil limitada a Citas.
- Product / Mix como oferta agendable.
- User como prestador.
- Service Location como recurso físico canónico.
- Revalidación de disponibilidad, concurrencia, reprogramación, cancelación y llegada.
- Store, reservación pública, carrito y checkout quedan fuera de esta etapa.

El dummy distingue el comportamiento AS-IS de Zellship de los cambios requeridos para el MVP. No representa una implementación productiva.

## Desarrollo local

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

## GitHub Pages

```bash
npm run build:github-pages
```

La rama `main` publica automáticamente el resultado mediante GitHub Actions.
