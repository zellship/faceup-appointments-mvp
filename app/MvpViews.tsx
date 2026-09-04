import React from "react";
import { journeys, type Journey } from "./domain";
import { Evidence, Help } from "./ui";

type BaseProps = { onHelp: (id: string) => void };

export function ScopeView({ onHelp }: BaseProps) {
  return <div className="zs-page zs-scope">
    <section className="zs-hero">
      <div><span className="zs-eyebrow">Ruta 1 · contrato visual congelado</span><h1>Citas en Zellship</h1><p>Un MVP operativo para configurar Agenda en Admin y reservar, consultar y operar citas desde POS.</p></div>
      <div className="zs-hero-state"><strong>POS + Admin</strong><span>Alcance operativo interno</span><small>17 estados demostrables · 12 recorridos</small></div>
    </section>
    <div className="zs-triad">
      <article><Evidence kind="as-is" /><h2>Base que se conserva</h2><ul><li>Agenda y Cita <Help id="appointment" onOpen={onHelp}/></li><li>Cuenta, Command e inventario</li><li>Service Locations y Consumo</li><li>Product, Mix, User y Worker</li></ul></article>
      <article><Evidence kind="to-be" /><h2>Delta funcional</h2><ul><li>Disponibilidad completa y buffers</li><li>Cuenta reservada por cada cita</li><li>Capacidad separada y General automática</li><li>Operación y reprogramación segura</li></ul></article>
      <article><Evidence kind="pending" /><h2>TI debe resolver</h2><ul><li>Identidad User/Worker</li><li>Concurrencia y atomicidad</li><li>Persistencia de horarios y bloqueos</li><li>Ejecución real de recordatorios</li></ul></article>
    </div>
    <section className="zs-flow-card">
      <header><div><span className="zs-eyebrow">Recorrido central</span><h2>De configuración a operación</h2></div><Evidence kind="to-be" /></header>
      <div className="zs-flow">
        <div><b>1</b><strong>Configurar</strong><span>Oferta, prestadores, horarios y recursos</span></div><i>→</i>
        <div><b>2</b><strong>Validar</strong><span>Duración, buffers, identidad y capacidad</span></div><i>→</i>
        <div><b>3</b><strong>Reservar</strong><span>Cita + Cuenta + Command</span></div><i>→</i>
        <div><b>4</b><strong>Operar</strong><span>Confirmar, llegada, no-show y cierre</span></div>
      </div>
    </section>
    <section className="zs-boundaries"><div><b>Incluido</b><span>POS escritorio y móvil · Admin · Consumo · correo/WhatsApp por validar</span></div><div><b>Fuera</b><span>Checkout público · Account existente · recurrencia · migración histórica</span></div></section>
  </div>;
}

export function JourneysView({ onRun }: { onRun: (journey: Journey) => void }) {
  return <div className="zs-page">
    <header className="zs-page-title"><div><span className="zs-eyebrow">Misma aplicación, estado local compartido</span><h1>Recorridos críticos</h1><p>Cada recorrido abre su punto inicial y utiliza las mismas pantallas interactivas del dummy.</p></div><span className="zs-count">12 recorridos</span></header>
    <div className="zs-journey-grid">{journeys.map((journey, index) => <button key={journey.id} onClick={() => onRun(journey)}>
      <span className="zs-journey-no">{String(index + 1).padStart(2, "0")}</span><div><small>{journey.id} · {journey.issue}</small><h2>{journey.title}</h2><p>{journey.description}</p></div><i>Iniciar →</i>
    </button>)}</div>
  </div>;
}

const requirements = [
  ["ZEL-2766", "Service Location", "Consolidar Service Location, retirar Appointment Location y separar capacidad de citas."],
  ["ZEL-2767", "Configurar Agenda", "Oferta, prestadores, disponibilidad, bloqueos, duración, buffers, prioridad y recordatorios."],
  ["ZEL-2768", "Reservar y operar", "Crear Cita, Cuenta reservada, Command, Command Items y retención aplicable."],
  ["ZEL-2769", "Gestión POS", "Agenda, alta, detalle, estados, llegada, no-show, cancelación y reprogramación."],
  ["ZEL-2770", "Móvil y cierre", "Agenda móvil Día/Mes, responsive y cobertura final del contrato visual."],
];

export function InspectionView({ onHelp }: BaseProps) {
  return <div className="zs-page">
    <header className="zs-page-title"><div><span className="zs-eyebrow">Inspección del requerimiento</span><h1>Trazabilidad congelada</h1><p>Selecciona cualquier entidad subrayada para abrir un solo apoyo contextual legible.</p></div><Evidence kind="pending">Implementación técnica no prescrita</Evidence></header>
    <div className="zs-requirements">{requirements.map(([id, title, body]) => <article key={id}><span>{id}</span><h2>{title}</h2><p>{body}</p></article>)}</div>
    <section className="zs-entity-map"><header><h2>Entidades visibles y reales</h2><p>Los nombres técnicos nunca compiten con la tarea del operador.</p></header><div>
      {["appointment", "account", "consumption", "provider", "location", "general", "offer", "duration", "inventory", "reminder"].map((id) => <button key={id} onClick={() => onHelp(id)}>{id === "appointment" ? "Cita" : id === "account" ? "Cuenta reservada" : id === "consumption" ? "Consumo" : id === "provider" ? "Prestador" : id === "location" ? "Cabina" : id === "general" ? "Ubicación General" : id === "offer" ? "Servicio / Kit" : id === "duration" ? "Duración" : id === "inventory" ? "Retención" : "Recordatorios"}<span className="zs-help" aria-hidden="true">i</span></button>)}
    </div></section>
  </div>;
}
