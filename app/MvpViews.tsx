import React from "react";
import { journeys, type Journey } from "./domain";
import { Evidence, Help } from "./ui";

type BaseProps = { onHelp: (id: string) => void };

export function ScopeView({ onHelp }: BaseProps) {
  return <div className="zs-page zs-scope">
    <section className="zs-hero">
      <div><span className="zs-eyebrow">Ruta 1 · contrato visual congelado</span><h1>Citas en Zellship</h1><p>Un MVP operativo para configurar Agenda en Admin y reservar, consultar y operar citas desde POS.</p></div>
      <div className="zs-hero-state"><strong>POS + Admin</strong><span>Alcance operativo interno</span><small>18 estados demostrables · 13 recorridos</small></div>
    </section>
    <div className="zs-triad">
      <article><Evidence kind="as-is" /><h2>Base que se conserva</h2><ul><li>Agenda y Cita <Help id="appointment" onOpen={onHelp}/></li><li>Cuenta, Command e inventario</li><li>Service Locations y Consumo</li><li>Product, Mix, User y Worker</li></ul></article>
      <article><Evidence kind="to-be" /><h2>Delta funcional</h2><ul><li>Disponibilidad completa y buffers</li><li>Una Account por visita y citas independientes</li><li>Capacidad separada y General automática</li><li>Operación y reprogramación segura</li></ul></article>
      <article><Evidence kind="pending" /><h2>TI debe resolver</h2><ul><li>Identidad User/Worker</li><li>Concurrencia y atomicidad</li><li>Persistencia de horarios y bloqueos</li><li>Ejecución real de recordatorios</li></ul></article>
    </div>
    <section className="zs-flow-card">
      <header><div><span className="zs-eyebrow">Recorrido central</span><h2>De configuración a operación</h2></div><Evidence kind="to-be" /></header>
      <div className="zs-flow">
        <div><b>1</b><strong>Configurar</strong><span>Ubicaciones operativas, prestadores, horarios y recursos</span></div><i>→</i>
        <div><b>2</b><strong>Validar</strong><span>Duración, buffers, identidad y capacidad</span></div><i>→</i>
        <div><b>3</b><strong>Reservar</strong><span>Citas + Account + Commands independientes</span></div><i>→</i>
        <div><b>4</b><strong>Operar</strong><span>Confirmar, llegada, no-show y cierre</span></div>
      </div>
    </section>
    <section className="zs-boundaries"><div><b>Incluido</b><span>POS escritorio y móvil · Account existente de la misma visita · Admin · Consumo</span></div><div><b>Fuera</b><span>Checkout público · servicios simultáneos · recurrencia · migración histórica</span></div></section>
  </div>;
}

export function JourneysView({ onRun }: { onRun: (journey: Journey) => void }) {
  return <div className="zs-page">
    <header className="zs-page-title"><div><span className="zs-eyebrow">Misma aplicación, estado local compartido</span><h1>Recorridos críticos</h1><p>Cada recorrido abre su punto inicial y utiliza las mismas pantallas interactivas del dummy.</p></div><span className="zs-count">13 recorridos</span></header>
    <div className="zs-journey-grid">{journeys.map((journey, index) => <button key={journey.id} onClick={() => onRun(journey)}>
      <span className="zs-journey-no">{String(index + 1).padStart(2, "0")}</span><div><small>{journey.id} · {journey.issue}</small><h2>{journey.title}</h2><p>{journey.description}</p></div><i>Iniciar →</i>
    </button>)}</div>
  </div>;
}

const requirements = [
  ["ZEL-2766", "Service Location", "Consolidar Service Location, retirar Appointment Location y separar capacidad de citas."],
  ["ZEL-2767", "Configurar Agenda", "Ubicación operativa, prestadores, disponibilidad, bloqueos, duración, buffers, prioridad y recordatorios."],
  ["ZEL-2768", "Reservar y operar", "Crear o reutilizar la Account de la visita y generar una Cita, Command y Command Item independientes por servicio."],
  ["ZEL-2769", "Gestión POS", "Agenda, alta, detalle, estados, llegada, no-show, cancelación y reprogramación."],
  ["ZEL-2770", "Móvil y cierre", "Agenda móvil Día/Mes, responsive y cobertura final del contrato visual."],
];

const locationReuse = [
  ["Módulo base", "Nombre, fecha de creación, capacidad comercial, General por defecto y acciones permanecen As-Is.", "Faceup + OVYE"],
  ["Capacidad de citas", "Se configura dentro de la ubicación; no sustituye capability ni altera la tabla comercial.", "Sólo Agenda"],
  ["Habilitación para citas", "Activa la ubicación como recurso reservable sin duplicar Service Location.", "Sólo Agenda"],
  ["Agrupación y estado", "Edificio, piso o zona y estado de ocupación amplían el detalle sin cambiar el núcleo de la ubicación.", "OVYE reutilizable"],
  ["Expediente de ubicación", "Descripción, imágenes, atributos, actualizaciones, contratos relacionados y activos viven como secciones adicionales.", "OVYE reutilizable"],
];

const edgeCases = [
  ["Varios servicios en la misma visita", "Una Account", "Cada servicio genera su propia Cita, Command y Command Item dentro de la misma operación comercial."],
  ["Prestadores diferentes", "Permitido", "Cada Cita resuelve de forma independiente el User o Worker elegible por su operative_location."],
  ["Cabinas diferentes", "Permitido", "Cada Cita reserva su propio Service Location; la Account no impone una cabina común."],
  ["Servicios físicos y sin ubicación", "Permitido", "Cada Cita define cabina física o General automática según su propia necesidad."],
  ["Horarios del mismo cliente", "Secuencial", "El MVP bloquea el traslape de citas activas del mismo cliente; no presupone atención simultánea."],
  ["Ejecución paralela", "Fuera del MVP", "Requiere una regla explícita por servicio y una validación adicional de simultaneidad del cliente."],
  ["Otra fecha o visita", "Nueva Account", "Una Account existente sólo es elegible para el mismo cliente, Establishment y visita comercial."],
  ["Account no elegible", "Bloqueado", "Las Accounts to_pay, close o canceled no reciben nuevas citas; se crea una nueva."],
  ["Kit con componentes", "Una Cita", "El Mix es el servicio programable; sus componentes no generan citas independientes."],
  ["Cancelación o reprogramación parcial", "Por Cita", "La acción afecta únicamente la Cita y el Command Item relacionados; las demás citas permanecen activas."],
  ["Capacidad de cabina", "Por Cita", "Cada Cita consume una unidad del Service Location durante su intervalo completo."],
  ["Rangos cruzados o duplicados", "Bloqueado", "Cada rango debe iniciar antes de terminar y no puede superponerse con otro del mismo día."],
  ["24 horas y No disponible", "Excluyentes", "Activar una opción desactiva rangos y la otra opción."],
  ["Cambio concurrente al guardar", "Revalidar", "Prestador, ubicación, horario e inventario se confirman de forma atómica antes de crear la operación."],
];

export function InspectionView({ onHelp }: BaseProps) {
  return <div className="zs-page">
    <header className="zs-page-title"><div><span className="zs-eyebrow">Inspección del requerimiento</span><h1>Trazabilidad congelada</h1><p>Selecciona cualquier entidad subrayada para abrir un solo apoyo contextual legible.</p></div><Evidence kind="pending">Implementación técnica no prescrita</Evidence></header>
    <div className="zs-requirements">{requirements.map(([id, title, body]) => <article key={id}><span>{id}</span><h2>{title}</h2><p>{body}</p></article>)}</div>
    <section className="zs-entity-map"><header><h2>Entidades visibles y reales</h2><p>Los nombres técnicos nunca compiten con la tarea del operador.</p></header><div>
      {["appointment", "account", "consumption", "provider", "location", "general", "offer", "duration", "inventory", "reminder"].map((id) => <button key={id} onClick={() => onHelp(id)}>{id === "appointment" ? "Cita" : id === "account" ? "Cuenta reservada" : id === "consumption" ? "Consumo" : id === "provider" ? "Prestador" : id === "location" ? "Cabina" : id === "general" ? "Ubicación General" : id === "offer" ? "Servicio / Kit" : id === "duration" ? "Duración" : id === "inventory" ? "Retención" : "Recordatorios"}<span className="zs-help" aria-hidden="true">i</span></button>)}
    </div></section>
    <section className="zs-audit-section"><header><div><span className="zs-eyebrow">Reutilización sin duplicar módulos</span><h2>Ubicaciones de servicio · Faceup y OVYE</h2></div><p>Service Location conserva su núcleo. Cada producto amplía sólo la capacidad que le corresponde.</p></header><div className="zs-audit-table zs-location-reuse"><div className="head"><b>Área</b><b>Decisión</b><b>Alcance</b></div>{locationReuse.map(([area, decision, scope]) => <div key={area}><b>{area}</b><span>{decision}</span><em>{scope}</em></div>)}</div></section>
    <section className="zs-audit-section"><header><div><span className="zs-eyebrow">Reglas cerradas del MVP</span><h2>Auditoría de edge cases</h2></div><p>La agrupación ocurre en la Account, no dentro de una cita compuesta: cada servicio conserva horario, prestador, ubicación y operación propios.</p></header><div className="zs-audit-table zs-edge-table"><div className="head"><b>Caso</b><b>Resultado</b><b>Regla</b></div>{edgeCases.map(([edge, result, rule]) => <div key={edge}><b>{edge}</b><em>{result}</em><span>{rule}</span></div>)}</div></section>
  </div>;
}
