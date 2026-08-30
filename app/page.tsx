"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Surface = "MVP" | "POS" | "Admin";
type ScenarioId = "program" | "conflict" | "reschedule" | "cancel" | "arrival";
type InspectionId = "offering" | "worker" | "location" | "availability" | "create" | "account" | "conflict" | "actions" | "block";
type ChangeType = "existing" | "extend" | "new";

type Requirement = {
  title: string;
  surface: string;
  change: ChangeType;
  status: "Confirmado" | "Decisión MVP" | "Pendiente de diseño";
  technical: string;
  confirmed: string;
  decision: string;
  rule: string;
  acceptance: string;
  pending?: string;
};

const scenarios: { id: ScenarioId; label: string; screen: string; instruction: string }[] = [
  { id: "program", label: "Programar", screen: "appointment", instruction: "Extiende el registro actual de Appointment con oferta, User, Service Location y disponibilidad." },
  { id: "conflict", label: "Conflicto", screen: "conflicts", instruction: "Revalida la disponibilidad y ofrece el siguiente horario válido." },
  { id: "reschedule", label: "Reprogramar", screen: "detail", instruction: "Cambia fecha u hora sin sustituir servicio ni establecimiento." },
  { id: "cancel", label: "Cancelar", screen: "detail", instruction: "Cancela y libera disponibilidad e inventario retenido aplicable." },
  { id: "arrival", label: "Registrar llegada", screen: "detail", instruction: "Presenta la transición actual reserved → open con una etiqueta operativa; no crea un estado nuevo." },
];

const requirements: Record<InspectionId, Requirement> = {
  offering: { title: "Product / Mix agendable", surface: "ADMIN + API", change: "extend", status: "Decisión MVP", technical: "products / mixes", confirmed: "Product corresponde a products y Kit es la etiqueta visible de Mix (mixes). Appointment no tiene una relación directa confirmada con Product ni Mix.", decision: "Agregar a Product y Mix duración, Users autorizados, Establishments aplicables y compatibilidad con Service Locations.", rule: "La duración final de Mix suma la duración base y los minutos adicionales de la configuración elegida.", acceptance: "ADMIN configura la oferta sin crear otro catálogo y POS usa la duración final al consultar disponibilidad.", pending: "TI debe definir la relación persistente entre Appointment y Product/Mix." },
  worker: { title: "User elegible", surface: "POS + ADMIN + API", change: "extend", status: "Decisión MVP", technical: "users", confirmed: "User (users) es una entidad actual. El MVP lo usa como prestador; Worker (workers) no forma parte del nuevo camino crítico.", decision: "Agregar elegibilidad por oferta, Establishment y prioridad para la opción de primer User disponible.", rule: "Sólo puede asignarse un User activo, autorizado para la oferta y disponible durante todo el intervalo.", acceptance: "La opción de primer User disponible respeta prioridad y no genera doble ocupación." },
  location: { title: "Migración a Service Location · alias Cabina", surface: "POS + ADMIN + API", change: "extend", status: "Decisión MVP", technical: "appointment_locations → service_locations", confirmed: "Appointment Location (appointment_locations) está relacionada actualmente con Appointment, pero sólo conserva una etiqueta. Service Location (service_locations) ya contiene las condiciones operativas requeridas para el recurso físico.", decision: "Migrar Appointment a Service Location como catálogo canónico, conservar compatibilidad histórica durante la transición y retirar después el CRUD legado. “Cabina” es sólo la etiqueta visible.", rule: "Cuando la oferta requiera Service Location, debe ocuparse durante el mismo intervalo que el User.", acceptance: "Dos Appointments incompatibles no pueden reservar la misma Service Location; las citas históricas conservan su ubicación visible y una cancelación libera el recurso.", pending: "TI debe cerrar el mapeo histórico, la transición de lectura/escritura y el significado de Service Location.capability antes de ejecutar la migración." },
  availability: { title: "Cálculo de disponibilidad", surface: "ADMIN + POS + API", change: "new", status: "Decisión MVP", technical: "appointments + users + service_locations", confirmed: "Appointment, User y Service Location existen; no está confirmada una capacidad única que resuelva su disponibilidad conjunta.", decision: "Agregar el cálculo con horario del Establishment, oferta, User, Service Location, duración, buffers aprobados y bloqueos.", rule: "La validación se ejecuta al consultar y nuevamente al guardar.", acceptance: "Sólo se ofrecen intervalos completos y el guardado rechaza conflictos surgidos desde la consulta." },
  create: { title: "Reservación atómica", surface: "POS + API", change: "extend", status: "Decisión MVP", technical: "appointments → service_locations; appointments → appointment_accounts → accounts", confirmed: "Appointment ya se relaciona con Account mediante appointment_accounts; su relación actual con Appointment Location debe migrarse a Service Location.", decision: "Extender el registro actual para reservar Appointment, User, Service Location y la integración comercial como una operación atómica.", rule: "La reservación ocupa disponibilidad de inmediato; no se crea una segunda ocupación al confirmar.", acceptance: "Ante cualquier error no queda parcialmente creado Appointment, Account, Command, Command Item ni la retención aplicable." },
  account: { title: "Integración con Account y Command", surface: "POS + API", change: "extend", status: "Pendiente de diseño", technical: "accounts → commands → command_items", confirmed: "La cadena actual es Appointment → appointment_accounts → Account → Command → Command Item → Product/Mix. No existe relación directa de Appointment con Product, Mix o Command.", decision: "Ajustar la orquestación existente para generar o actualizar el Command reservado y sus Command Items sin crear entidades comerciales paralelas.", rule: "Registrar llegada presenta la transición actual reserved → open; pago y cierre permanecen operaciones separadas.", acceptance: "Account conserva estados y comportamiento actuales, y la reservación mantiene consistentes sus Command Items y retenciones.", pending: "TI debe definir en qué punto del flujo actual se genera o actualiza Command y cómo se retiene/libera inventario." },
  conflict: { title: "Concurrencia", surface: "POS + API", change: "new", status: "Pendiente de diseño", technical: "appointments / users / service_locations", confirmed: "La auditoría confirma las entidades participantes, no una garantía transaccional completa para esta reservación conjunta.", decision: "Revalidar y reservar User, Service Location y efectos comerciales de forma atómica.", rule: "Si otra operación toma primero el intervalo, la segunda se rechaza sin perder los datos capturados.", acceptance: "El POS informa el motivo y ofrece el siguiente horario válido sin duplicar ocupaciones.", pending: "TI debe definir la estrategia transaccional y las restricciones que impedirán dobles asignaciones." },
  actions: { title: "Operación de Appointment", surface: "POS + API", change: "extend", status: "Decisión MVP", technical: "appointments", confirmed: "Appointment (appointments) y su Agenda POS ya existen. Account y Command conservan sus estados actuales.", decision: "Agregar únicamente los efectos requeridos sobre recursos y presentar reserved → open como “Registrar llegada”, sin crear un estado nuevo.", rule: "Cada acción modifica sólo sus efectos definidos y conserva trazabilidad.", acceptance: "Reprogramar revalida recursos; cancelar los libera; Registrar llegada usa la transición actual; confirmar no duplica la reservación." },
  block: { title: "Bloqueos excepcionales", surface: "ADMIN + API", change: "new", status: "Pendiente de diseño", technical: "Persistencia por definir", confirmed: "No se confirmó una entidad canónica reutilizable para los bloqueos propuestos.", decision: "Permitir bloqueos por fecha y horario específico para Establishment, User o Service Location.", rule: "Las reglas regulares se configuran como disponibilidad; el bloqueo sólo representa una excepción.", acceptance: "POS deja de ofrecer el intervalo bloqueado y ADMIN valida conflictos con Appointments existentes.", pending: "TI debe definir la persistencia y el tratamiento de zona horaria. La recurrencia queda fuera del MVP." },
};

const InspectionContext = createContext<{ enabled: boolean; open: (id: InspectionId) => void }>({ enabled: false, open: () => undefined });

const screens: Record<Surface, { id: string; label: string }[]> = {
  MVP: [
    { id: "scope", label: "Resumen del alcance" },
    { id: "rules", label: "Reglas del delta" },
    { id: "pending", label: "Pendientes técnicos" },
  ],
  POS: [
    { id: "agenda", label: "Agenda" },
    { id: "mobile-calendar", label: "Mobile" },
    { id: "appointment", label: "Programar" },
    { id: "detail", label: "Detalle" },
    { id: "conflicts", label: "Conflicto" },
  ],
  Admin: [
    { id: "settings", label: "Configuración de agenda" },
    { id: "offering", label: "Product / Mix" },
    { id: "block", label: "Bloqueos" },
  ],
};

function Mark({ type }: { type: ChangeType }) {
  const labels = { existing: "AS-IS actual", extend: "Cambio requerido", new: "Cambio nuevo requerido" };
  return <span className={`mark ${type}`}>{labels[type]}</span>;
}

function Status({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`status ${tone}`}>{children}</span>;
}

function EntityHint({ children, system, code, note }: { children: React.ReactNode; system: string; code: string; note?: string }) {
  const label = `${String(children)}. Entidad actual: ${system}. Nombre técnico: ${code}${note ? `. Aclaración: ${note}` : ""}`;
  return <span className="entity-hint" tabIndex={0} aria-label={label}>{children}<i className="entity-info" aria-hidden="true">i</i><span className="entity-tooltip" role="tooltip"><b>Correspondencia en Zellship</b><span><strong>Entidad actual:</strong> {system}</span><span><strong>Nombre técnico:</strong> {code}</span>{note && <span><strong>Aclaración:</strong> {note}</span>}</span></span>;
}

function InspectionPin({ id, label = "Ver requerimiento" }: { id: InspectionId; label?: string }) {
  const inspection = useContext(InspectionContext);
  if (!inspection.enabled) return null;
  return <button className="inspection-pin" aria-label={`${label}: ${requirements[id].title}`} onClick={(event) => { event.stopPropagation(); inspection.open(id); }}><span>＋</span>{label}</button>;
}

function RequirementDrawer({ id, onClose }: { id: InspectionId | null; onClose: () => void }) {
  if (!id) return null;
  const item = requirements[id];
  return <aside className="requirement-drawer" aria-label={`Requerimiento: ${item.title}`}>
    <header><div><span>FICHA DE REQUERIMIENTO</span><h2>{item.title}</h2></div><button aria-label="Cerrar ficha" onClick={onClose}>×</button></header>
    <div className="requirement-meta"><Mark type={item.change}/><Status tone={item.status === "Confirmado" ? "green" : item.status === "Pendiente de diseño" ? "yellow" : "blue"}>{item.status}</Status><span>{item.surface}</span></div>
    <section><small>Nombre técnico</small><code>{item.technical}</code></section>
    <section className="fact"><small>AS-IS confirmado · referencia</small><p>{item.confirmed}</p></section>
    <section className="decision"><small>Cambio requerido sobre el AS-IS</small><p>{item.decision}</p></section>
    {item.pending && <section className="pending"><small>Pendiente técnico · no asumir implementado</small><p>{item.pending}</p></section>}
    <section><small>Regla funcional</small><p>{item.rule}</p></section>
    <section className="acceptance"><small>Criterio de aceptación</small><p>{item.acceptance}</p></section>
  </aside>;
}

function PosShell({ children, title, subtitle, compact = false }: { children: React.ReactNode; title: string; subtitle: string; compact?: boolean }) {
  return (
    <div className="product-shell pos-current-shell">
      <header className="zellship-topbar"><div className="zs-wordmark"><i>Z</i><strong>ZellShip</strong></div><div className="establishment"><b>FACEUP</b><span>SAN PEDRO</span></div><div className="top-time"><b>09:24 a.m.</b><span>martes, 25 de agosto</span></div><div className="top-round">♙</div><div className="top-round">▣</div></header>
      <div className="pos-main"><aside className="sidebar">
        {[["☰", "Menú"], ["♢", "Avisos"], ["▣", "Cuentas"], ["＋", "Nueva"], ["▤", "Servicios"], ["$", "Pagos"], ["▥", "Inventario"], ["◫", "Citas"], ["⚙", "Ajustes"]].map(([icon, label]) => (
          <div className={`side-item ${label === (title.includes("Cuenta") || title.includes("Cuentas") ? "Cuentas" : "Citas") ? "active" : ""}`} key={label}><span>{icon}</span></div>
        ))}<div className="side-bottom">›</div>
      </aside><section className={`workspace ${compact ? "pos-no-appbar" : ""}`}>{!compact && <header className="appbar"><div><b>{title}</b><span>{subtitle}</span></div></header>}{children}</section></div>
    </div>
  );
}

function AgendaScreen() {
  const [mode, setMode] = useState<"day" | "month">("month");
  const monthDays = [
    ["26", "muted"], ["27", "muted"], ["28", "muted"], ["29", "muted"], ["30", "muted"], ["31", "muted"], ["01", ""],
    ["02", ""], ["03", ""], ["04", ""], ["05", ""], ["06", ""], ["07", ""], ["08", ""],
    ["09", ""], ["10", ""], ["11", ""], ["12", ""], ["13", ""], ["14", ""], ["15", ""],
    ["16", ""], ["17", ""], ["18", ""], ["19", ""], ["20", ""], ["21", ""], ["22", ""],
    ["23", ""], ["24", ""], ["25", "today"], ["26", ""], ["27", ""], ["28", ""], ["29", ""],
    ["30", ""], ["31", ""], ["01", "muted"], ["02", "muted"], ["03", "muted"], ["04", "muted"], ["05", "muted"],
  ];
  return (
    <PosShell title="Citas" subtitle="Calendario actual" compact>
      <div className="current-appointments">
        <div className="appointments-toolbar">
          <div className="appointments-left"><button className="zs-primary">＋ Programar cita</button><button className="zs-filter">＋ Filtros</button></div>
          <div className="appointments-right">{mode === "day" && <button>25⌄</button>}<button>Ago⌄</button><button>2026⌄</button><div className="view-switch"><button className={mode === "day" ? "active" : ""} onClick={() => setMode("day")}>Día</button><button className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>Mes</button><button>Año</button></div></div>
        </div>
        {mode === "month" ? <div className="month-calendar">
          <div className="weekday-row">{["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map(x=><b key={x}>{x}</b>)}</div>
          <div className="month-grid">{monthDays.map((x,i)=><div key={`${x[0]}-${i}`} className={`month-day ${x[1]}`}><span>{x[0]}</span>{x[1] === "today" && <button className="month-event">Sofía Martínez, 11:30</button>}</div>)}</div>
        </div> : <div className="day-calendar">
          <div className="day-title"><button>‹</button><h2>Martes 25 de agosto</h2><button>›</button></div>
          <button className="day-event reserved"><b>Sofía Martínez, 11:30</b><span>Hydrafacial Premium · Valeria González · <EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta operativa del recurso canónico de Agenda.">Cabina 02</EntityHint></span><Status tone="blue">Reservada</Status></button>
          <button className="day-event confirmed"><b>Mariana Ríos, 14:00</b><span>Valoración facial · Ricardo Acosta</span><Status tone="yellow">Confirmada</Status></button>
          <button className="day-event attended"><b>Fernanda Cruz, 09:00</b><span>Limpieza facial · Daniela Salas · Cuenta abierta</span><Status tone="pink">Asistió</Status></button>
          <button className="day-event no-show"><b>Paola García, 10:15</b><span>Hydrafacial · Valeria González</span><Status tone="red">No asistió</Status></button>
          <button className="day-event canceled"><b>Laura Gómez, 16:30</b><span>Valoración facial · Ricardo Acosta</span><Status tone="gray">Cancelada</Status></button>
        </div>}
        <div className="preserve-note appointments-note"><Mark type="existing"/><span>La Agenda POS, sus filtros y vistas Día / Mes / Año ya existen. El MVP la extiende; no debe reconstruirse.</span></div>
      </div>
    </PosShell>
  );
}

function MobileCalendarScreen() {
  const [mobileMode, setMobileMode] = useState<"day" | "month">("month");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingSaved, setBookingSaved] = useState(false);

  return (
    <div className="mobile-calendar-spec">
      <section className="mobile-brief">
        <div>
          <span className="eyebrow">POS · Comportamiento responsive propuesto</span>
          <h2>En mobile sólo aparece Citas y la Agenda abre directamente</h2>
          <p>Los módulos sin adaptación mobile se ocultan por completo, incluso del menú. La Agenda conserva únicamente las vistas Día y Mes; Semana y Año quedan fuera del MVP. Desktop conserva su navegación actual.</p>
        </div>
        <Mark type="extend" />
      </section>

      <div className="mobile-spec-grid">
        <section className="phone-column">
          <div className="phone-label"><b>{bookingOpen ? "Programar cita" : "Agenda móvil"}</b><span>{bookingOpen ? "Registra el ejemplo para volver" : "Alterna entre Día y Mes"}</span></div>
          <div className="phone-frame">
            <div className="phone-status"><span>9:24</span><span>● ◒ ▰</span></div>
            <header className="mobile-zellship-header">
              <button aria-label={bookingOpen ? "Volver al calendario" : "Citas"} onClick={() => bookingOpen && setBookingOpen(false)}>{bookingOpen ? "‹" : "▣"}</button>
              <div><b>Citas</b><small>FACEUP · SAN PEDRO</small></div>
              <span className="mobile-user">♙</span>
            </header>
            <main className="mobile-calendar-body">
              <div className="mobile-page-title"><button className="mobile-program" onClick={() => setBookingOpen(true)}>＋ Programar cita</button><button className="mobile-filter">＋ Filtros</button></div>
              {bookingSaved && <div className="mobile-save-message">✓ Cita reservada · 16:00</div>}
              <div className="mobile-period-selectors"><button>Ago <span>⌄</span></button><button>2026 <span>⌄</span></button></div>
              <div className="mobile-view-switch"><button className={mobileMode === "day" ? "active" : ""} onClick={() => setMobileMode("day")}>Día</button><button className={mobileMode === "month" ? "active" : ""} onClick={() => setMobileMode("month")}>Mes</button></div>
              {mobileMode === "day" ? <div className="mobile-appointments-list">
                <button className="mobile-appointment reserved"><time>09:00</time><div><b>Fernanda Cruz</b><span>Limpieza facial · Daniela Salas</span></div><Status tone="blue">Reservada</Status></button>
                <button className="mobile-appointment confirmed"><time>11:30</time><div><b>Sofía Martínez</b><span>Hydrafacial Premium · Valeria González</span></div><Status tone="yellow">Confirmada</Status></button>
                <button className="mobile-appointment attended"><time>14:00</time><div><b>Mariana Ríos</b><span>Valoración facial · Ricardo Acosta</span></div><Status tone="pink">Asistió</Status></button>
              </div> : <div className="mobile-month current-style">
                <div>{["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d,i)=><b key={`${d}-${i}`}>{d}</b>)}</div>
                <div>{[["26","muted"],["27","muted"],["28","muted"],["29","muted"],["30","muted"],["31","muted"],["01",""] ,["02",""],["03",""],["04",""],["05",""],["06",""],["07",""],["08",""],["09",""],["10",""],["11",""],["12",""],["13",""],["14","today"],["15",""],["16",""],["17",""],["18",""],["19",""],["20",""],["21",""],["22",""],["23",""],["24",""],["25",""],["26",""],["27","has-events"],["28",""],["29",""]].map(([day,state],i)=><span key={`${day}-${i}`} className={state}>{day}</span>)}</div>
              </div>}
            </main>
            {bookingOpen && <section className="mobile-booking-sheet">
              <div className="mobile-booking-title"><div><small>Citas</small><h3>Programar cita</h3></div><button aria-label="Cerrar" onClick={() => setBookingOpen(false)}>×</button></div>
              <label>Cliente *</label><button className="mobile-field"><span>Sofía Martínez</span><i>⌄</i></button>
              <label>Servicio o Kit/Mix *</label><button className="mobile-field"><span>Hydrafacial Premium</span><i>⌄</i></button>
              <div className="mobile-duration"><span>Duración</span><b>60 min + 20 min</b><strong>80 min</strong></div>
              <label>Profesional *</label><button className="mobile-field"><span>Primer profesional disponible</span><i>⌄</i></button>
              <div className="mobile-booking-two"><div><label>Fecha *</label><button className="mobile-field"><span>27 ago 2026</span></button></div><div><label>Hora *</label><button className="mobile-field"><span>16:00</span></button></div></div>
              <div className="mobile-availability">✓ Disponible · Valeria González · <EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta operativa del recurso canónico de Agenda.">Cabina 02</EntityHint></div>
              <label>Comentarios</label><div className="mobile-comments">Agregar comentarios…</div>
              <div className="mobile-booking-result"><span>Se extenderá el registro de Appointment y su relación con Account.</span><b>$2,130.00</b></div>
              <button className="mobile-register" onClick={() => { setBookingOpen(false); setBookingSaved(true); }}>Registrar cita</button>
            </section>}
          </div>
        </section>

        <section className="mobile-rules">
          <div className="rules-title"><div><span className="eyebrow">Especificación funcional</span><h3>Reglas de comportamiento</h3></div><Status tone="gray">Sólo POS mobile</Status></div>
          <div className="rule-list">
            <article><strong>01</strong><div><b>Navegación exclusiva</b><p>En viewport mobile sólo aparece <em>Citas</em>. Los módulos no optimizados se ocultan por completo, incluso del menú.</p></div></article>
            <article><strong>02</strong><div><b>Acceso inicial</b><p>Después de iniciar sesión, el usuario entra directamente al calendario de Citas con el establecimiento autorizado activo.</p></div></article>
            <article><strong>03</strong><div><b>Rutas no optimizadas</b><p>Si se abre una URL interna no disponible en mobile, Zellship redirige a Citas; no muestra una pantalla rota ni un enlace sin función.</p></div></article>
            <article><strong>04</strong><div><b>Operación permitida</b><p>Desde la Agenda se conservan Día, Mes, consulta de detalle y Programar cita. Semana y Año no se muestran en mobile.</p></div></article>
            <article><strong>05</strong><div><b>Desktop sin cambios</b><p>La restricción es responsive. En escritorio se mantiene el menú completo actual y sus permisos.</p></div></article>
            <article><strong>06</strong><div><b>Permisos vigentes</b><p>Ocultar opciones es presentación, no autorización. Backend y rutas conservan las validaciones de sesión, establecimiento y permisos actuales.</p></div></article>
          </div>
          <div className="mobile-acceptance"><b>Condición de aceptación</b><p>En un dispositivo mobile, el usuario entra directamente a Citas, consulta Día o Mes y registra una cita completa. No ve opciones no optimizadas ni accesos a Semana o Año.</p></div>
          <div className="mobile-boundary"><Mark type="existing"/><span>Calendario y permisos actuales</span><Mark type="extend"/><span>Navegación responsive y redirección</span></div>
        </section>
      </div>
    </div>
  );
}

function AppointmentScreen() {
  const [registered, setRegistered] = useState(false);
  return (
    <PosShell title="Citas" subtitle="Programar cita" compact>
      <div className="current-appointment-stage">
        <div className="calendar-underlay"><div className="appointments-toolbar"><button className="zs-primary">＋ Programar cita</button><button className="zs-filter">＋ Filtros</button></div></div>
        <div className="current-appointment-modal inspection-target">
          <InspectionPin id="create"/>
          <div className="current-modal-title"><h3>{registered ? "Cita registrada" : "Registrar cita"}</h3>{registered ? <Status tone="green">Reservada</Status> : <button>×</button>}</div>
          {registered && <div className="scenario-success"><b>✓ Appointment CITA-2026-0184 creado</b><span>Account #03184 reservado · horario ocupado · pago pendiente opcional</span></div>}
          <div className="zs-field full-field"><span className="field-icon">＃</span><div className="zs-control muted">Título (opcional)</div></div>
          <div className="zs-field required"><span className="field-icon">♧</span><div className="zs-control">Sofía Martínez <span>⌄</span></div><Mark type="existing"/></div>
          <div className="zs-field required inspection-target"><span className="field-icon">▤</span><div className="zs-control strong">Hydrafacial Premium · Kit/Mix configurado <span>⌄</span></div><button className="inline-action">Ver configuración</button><Mark type="extend"/><InspectionPin id="offering"/></div>
          <div className="duration-result"><span>Duración base 60 min</span><b>+ Terapia LED 20 min</b><strong>Duración final 80 min</strong></div>
          <div className="zs-field required inspection-target"><span className="field-icon">♙</span><div className="zs-control"><EntityHint system="User" code="users" note="Profesional es la etiqueta visible del prestador en este caso de uso.">Primer profesional disponible</EntityHint> <span>⌄</span></div><div className="assigned-inline"><b>Valeria González</b><small>prioridad 1</small></div><Mark type="extend"/><InspectionPin id="worker"/></div>
          <div className="zs-field required inspection-target"><span className="field-icon">⌾</span><div className="zs-control">Faceup San Pedro <span>⌄</span></div><div className="assigned-inline"><b><EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta operativa; Appointment Location queda como legado durante la migración.">Cabina 02</EntityHint></b><small>asignada</small></div><Mark type="extend"/><InspectionPin id="location"/></div>
          <div className="zs-field required inspection-target"><span className="field-icon">▣</span><div className="date-controls"><div>25 ago 2026　▣</div><div>11:30　◷</div><span>–</span><div>12:50　◷</div><div>25 ago 2026　▣</div></div><Mark type="new"/><InspectionPin id="availability"/></div>
          <div className="appointment-result"><span>✓</span><div><b>Horario disponible · 80 minutos</b><small>Establishment abierto, User y Service Location sin conflicto.</small></div><strong>$2,130.00</strong></div>
          <div className="zs-field"><span className="field-icon">▧</span><div className="zs-control comments">Comentarios</div></div>
          <div className="zs-field inspection-target"><span className="field-icon">▣</span><div className="zs-control account-outcome"><b>Se ajustará la orquestación del Account reservado</b><small>Usará Command y Command Items actuales; la retención aplicable queda pendiente de diseño técnico.</small></div><Mark type="extend"/><InspectionPin id="account"/></div>
          <div className="current-modal-footer"><span>La cita ocupará el horario al registrarse. El pago es opcional.</span><div><button>Cancelar</button><button className="zs-primary" onClick={() => setRegistered(true)}>{registered ? "✓ Registrada" : "Registrar cita"}</button></div></div>
        </div>
      </div>
    </PosShell>
  );
}

type AppointmentViewState = "reserved" | "confirmed" | "attended" | "no_show" | "canceled";

function DetailScreen({ focus }: { focus?: ScenarioId }) {
  const [state, setState] = useState<AppointmentViewState>("reserved");
  const [rescheduled, setRescheduled] = useState(false);
  const labels: Record<AppointmentViewState, { label: string; tone: string; note: string }> = {
    reserved: { label: "Reservada", tone: "blue", note: "Reservada y Confirmada ocupan el horario. Confirmar no crea una segunda ocupación." },
    confirmed: { label: "Confirmada", tone: "yellow", note: "La confirmación conserva horario, profesional, cabina, cuenta e inventario retenido." },
    attended: { label: "Asistió", tone: "pink", note: "Registrar llegada marcó asistencia y abrió la cuenta. No registró pago ni cerró el servicio." },
    no_show: { label: "No asistió", tone: "red", note: "No asistió queda separado de Cancelada. No aplica penalización ni cobro automático en el piloto." },
    canceled: { label: "Cancelada", tone: "gray", note: "Cancelar libera disponibilidad e inventario; cualquier devolución financiera continúa por separado." },
  };
  const current = labels[state];
  const actionNote = rescheduled ? "La cita fue reprogramada. Conserva servicio y establecimiento; permanece Reservada hasta que recepción la confirme." : current.note;
  const accountOpened = state === "attended";
  return (
    <PosShell title="Citas" subtitle="Detalle de cita" compact>
      <div className="current-appointment-stage">
        <div className="calendar-underlay month-underlay" />
        <div className="current-detail-modal inspection-target">
          <div className="detail-title"><div><h3>Detalles de la cita</h3><Status tone={current.tone}>{current.label}</Status></div><button>×</button></div>
          <div className="detail-code"><span>＃</span><b>CITA-2026-0184</b><div><button title="Editar">✎</button><button title="Cancelar">⌫</button></div></div>
          <div className="detail-row"><span>▤</span><div><small>Servicio</small><b>Hydrafacial Premium · Kit/Mix configurado</b></div><strong>80 min</strong></div>
          <div className="detail-row"><span>▣</span><div><small>Fecha y hora</small><b>{rescheduled ? "26 de agosto de 2026 · 13:00–14:20" : "25 de agosto de 2026 · 11:30–12:50"}</b></div>{rescheduled && <Status tone="blue">Reprogramada</Status>}</div>
          <div className="detail-row"><span>♧</span><div><small>Cliente</small><b>Sofía Martínez</b></div></div>
          <div className="detail-row"><span>♙</span><div><small><EntityHint system="User" code="users" note="Profesional es la etiqueta visible del prestador.">Profesional</EntityHint></small><b>Valeria González</b></div><em>Prioridad 1</em></div>
          <div className="detail-row"><span>⌾</span><div><small>Establishment y recurso</small><b>Faceup San Pedro · <EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta operativa del recurso canónico de Agenda.">Cabina 02</EntityHint></b></div></div>
          <div className="detail-row muted-row"><span>▧</span><div><small>Comentarios</small><b>Preferencia: intensidad media</b></div></div>
          <div className="detail-account inspection-target"><div><small>Account relacionado</small><b>#03184 · {accountOpened ? "Abierto" : "Reservado"}</b><span>{accountOpened ? "Transición reserved → open mediante Registrar llegada" : "Command Items y retención aplicable · Pago opcional"}</span></div><strong>$2,130.00</strong><button>Ver Account</button><InspectionPin id="account"/></div>
          <div className="detail-actions five inspection-target"><button onClick={() => { setRescheduled(false); setState("confirmed"); }}>Confirmar</button><button className={`arrival-action ${focus === "arrival" ? "scenario-focus" : ""}`} onClick={() => { setRescheduled(false); setState("attended"); }}>Registrar llegada</button><button className={focus === "reschedule" ? "scenario-focus" : ""} onClick={() => { setState("reserved"); setRescheduled(true); }}>Reprogramar</button><button onClick={() => { setRescheduled(false); setState("no_show"); }}>No asistió</button><button className={`danger-text ${focus === "cancel" ? "scenario-focus" : ""}`} onClick={() => { setRescheduled(false); setState("canceled"); }}>Cancelar</button><InspectionPin id="actions"/></div>
          <div className="detail-foot"><Mark type="extend"/><span>{actionNote}</span></div>
        </div>
      </div>
    </PosShell>
  );
}

const reservedAccounts = [
  ["#03184", "Sofía Martínez", "$2,130.00", "Hoy, 11:30", "1"],
  ["#03183", "Mariana Ríos", "$850.00", "Hoy, 13:00", "1"],
  ["#03182", "Paola García", "$1,650.00", "Mañana, 10:00", "2"],
];

function AccountBoardScreen() {
  return <PosShell title="Cuentas" subtitle="Tablero operativo existente"><div className="current-board"><div className="board-toolbar"><button className="ghost-action">＋ Filtro</button><div><button>Descendente⌄</button><button>Tamaño　−　9　＋</button><button>Cols　−　3　＋</button><button>Estatus　5/5⌄</button></div></div><div className="kanban"><section className="kanban-col"><header className="orange">Reservado <span>□ Seleccionar todo</span></header>{reservedAccounts.map((x,i)=><div className="account-card" key={x[0]}><div><Status tone={i===0?"blue":"gray"}>{x[3]}</Status><strong>{x[2]}</strong><button>ⓘ</button></div><h3>{x[0]} - {x[1]} <i>i</i></h3><div><span className="green-dot"/><em>En establecimiento</em><em>Caja 1</em><span className="service-count">Servicios · {x[4]}</span></div></div>)}</section><section className="kanban-col"><header className="yellow-head">Requerido <span>□ Seleccionar todo</span></header>{[["#03180","Camila Pérez","$2,450.00"],["#03179","Laura Gómez","$1,980.00"]].map(x=><div className="account-card" key={x[0]}><div><Status tone="gray">Hace 2 días</Status><strong>{x[2]}</strong><button>ⓘ</button></div><h3>{x[0]} - {x[1]} <i>i</i></h3><div><span className="orange-dot"/><em>En establecimiento</em><em>Caja 1</em><span className="service-count">Servicios · 1</span></div></div>)}</section><section className="kanban-col"><header className="cyan">En atención</header><div className="account-card"><div><Status tone="gray">Hoy, 09:00</Status><strong>$1,450.00</strong><button>ⓘ</button></div><h3>#03176 - Fernanda C. <i>i</i></h3><div><span className="blue-dot"/><em>En establecimiento</em><em>Caja 2</em></div></div></section></div><div className="preserve-note"><Mark type="existing"/><span>Misma función y composición del tablero actual. Las etiquetas contextuales no cambian su comportamiento.</span></div></div></PosShell>;
}

function AccountScreen() {
  return (
    <PosShell title="Cuenta #03184" subtitle="Última actualización hace 10 minutos · Reservado">
      <div className="current-account-detail"><section className="current-account-main"><div className="account-title"><span>←</span><h2>#03184</h2><small>Última actualización hace 10 minutos</small><Status tone="gray">Reservado</Status></div><div className="current-info-grid"><div><span>Cliente</span><b>Sofía Martínez　ⓘ</b></div><div><span>Fecha de la cita</span><b>25 agosto 2026 · 11:30</b></div><div className="full"><span>Comentarios (Cliente)</span><b>Preferencia: intensidad media</b></div><div><span>Servicios</span><b>1</b></div><div><span>Tipo de servicio</span><b>En establecimiento</b></div><div><span>Prestador</span><b>Valeria González</b></div><div><span>Creador</span><b>Store Zellship</b></div><div><span>Recurso de la cita</span><b>Cabina 02</b></div><div><span>Cita relacionada</span><b>CITA-2026-0184　<u>Ver detalle</u></b></div></div><div className="current-tabs"><b>Servicios <i>3</i></b><span>Detalles</span><span>Historial</span><span>Aclaraciones</span></div><div className="current-table"><div className="current-row head"><span>□</span><span>Código</span><span>Nombre</span><span>Monto</span><span>Subtotal</span><span>Estatus</span><span>Modalidad</span><span>Caja</span></div><div className="current-row"><span>＋　□</span><span className="code-pill">KIT-14</span><span>Hydrafacial Premium</span><span>1</span><span>$1,850.00</span><span>● Reservado</span><span>En establecimiento</span><span>Caja 1</span></div><div className="current-row child"><span>　　□</span><span className="code-pill">SRV-LED</span><span>Terapia LED · +20 min</span><span>1</span><span>$0.00</span><span>● Reservado</span><span>Servicio</span><span>—</span></div><div className="current-row child"><span>　　□</span><span className="code-pill">AMP-C</span><span>Ampolleta vitamina C</span><span>1</span><span>$280.00</span><span>● Retenido</span><span>Producto</span><span>Caja 1</span></div></div></section><aside className="current-breakdown"><h2>Desglose</h2><div className="print-actions"><button>⋮</button><button>▧ Imprimir ticket</button><button>▧ Imprimir balance</button></div><div className="amount-lines"><div><span>Subtotal</span><b>$1,836.21</b></div><div><span>Descuentos</span><b>$0.00</b></div><div><span>Otros</span><b>$0.00</b></div><div><span>Impuestos</span><b>$293.79</b></div></div><div className="big-total"><span>Total</span><strong>$2,130.00</strong></div><div className="amount-lines"><div><span>Ingreso</span><b>$0.00</b></div><div><span>Balance</span><b className="balance">$2,130.00</b></div></div><div className="open-row"><span>Pagos registrados</span><button className="orange-button">Abrir cuenta　⋯</button></div><div className="payment-tabs"><b>Pagos</b><span>Descuentos</span><span>Cupones</span></div><button className="register-payment">＋ Registrar pago</button><div className="empty-payments">▤<span>No hay pagos registrados</span></div></aside><div className="preserve-note detail-note"><Mark type="existing"/><span>La cuenta conserva su flujo actual. La cita y su cabina se agregan como referencias, sin sustituir la caja.</span></div></div>
    </PosShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const icons = ["▣","◎","▥","$","▤","↔","▦","♧","▧","⌘","◫","▦","□","♙","▧","▦","⚙"];
  return <div className="real-admin-shell"><header className="real-admin-top"><button>☰</button><div className="real-zellship"><i>Z</i><b>ZellShip</b></div><div className="real-admin-meta"><span>USD <b>$16.97 MXN</b></span><i>↔</i><span>0/6 almacenes seleccionados <u>Cambiar</u></span><span>♧</span><span className="real-avatar"/> <span>Admin⌄</span></div></header><div className="real-admin-layout"><aside><small>Operati...</small>{icons.map((x,i)=><button className={i===7?"active":""} key={`${x}-${i}`}>{x}</button>)}</aside><section>{children}</section></div></div>;
}

function EstablishmentHeader() {
  return <><div className="real-breadcrumb">Establecimientos　/　Faceup San Pedro</div><section className="real-establishment-card"><div><h2>Faceup San Pedro <Status tone="green">Activo</Status></h2><b>Responsable</b><p><span className="real-person-icon">♙</span><strong>Admin</strong><u>admin@faceup.com</u><span>81 5555 5555</span></p></div><div><b>Dirección</b><p>Av. José Vasconcelos 210<br/>San Pedro Garza García, Nuevo León.</p></div><button>⋮</button></section></>;
}

function SettingsScreen() {
  const [tab, setTab] = useState<"users"|"locations"|"notices"|"availability">("availability");
  return <AdminShell><div className="real-admin-page"><EstablishmentHeader/><section className="real-config-card"><h2>Configuraciones</h2><nav className="real-config-tabs"><button>Products</button><button>Mixes (Kits)</button><button>Orígenes de venta</button><button>Personal</button><button className={tab==="users"?"active":""} onClick={()=>setTab("users")}>Users</button><button>Terminales</button><button className={tab==="locations"?"active":""} onClick={()=>setTab("locations")}>Service Locations</button><button className={tab==="notices"?"active":""} onClick={()=>setTab("notices")}>Conf. de notificación de Appointments</button><button className={tab==="availability"?"active":""} onClick={()=>setTab("availability")}>Disponibilidad</button></nav>
      {tab==="users" && <div className="real-tab-body"><div className="real-list-head"><span>Users habilitados para Agenda</span><div><button>＋ Administrar elegibilidad</button></div></div><div className="real-search">Buscar　　　　　　　　　　　　　　　　　　　　　　　　　⌕</div><div className="real-table workers"><b/><b>Nombre</b><b>Usuario</b><b>Teléfono</b><b>Estatus</b><b>Agenda</b>{[["VG","Valeria González","valeria","+52 81 1234 5678"],["RA","Ricardo Acosta","ricardo","+52 81 2345 6789"],["DS","Daniela Salas","daniela","+52 81 3456 7890"]].flatMap((x,i)=>[<span className="real-avatar small" key={`${i}-a`}/>,<span key={`${i}-n`}>{x[1]}</span>,<span key={`${i}-u`}>{x[2]}</span>,<span key={`${i}-p`}>{x[3]}</span>,<span key={`${i}-s`}><Status tone="green">Activo</Status></span>,<span key={`${i}-g`}><Status tone="blue">Prestador · prioridad {i+1}</Status></span>])}</div><div className="real-note"><Mark type="extend"/><span>User (users) se conserva como entidad. El cambio requerido agrega elegibilidad por oferta, Establishment y prioridad de asignación.</span></div></div>}
      {tab==="locations" && <div className="real-tab-body"><div className="real-list-head"><span>Listado de Service Locations habilitadas para Agenda</span><button>＋ Agregar Service Location</button></div><div className="real-search">Buscar　　　　　　　　　　　　　　　　　　　　　　　　　⌕</div><div className="real-table cabins"><b>Nombre</b><b>Fecha de creación</b><b>Capacidad</b><b>Uso en citas</b><b>Acciones</b>{[["Cabina 01","12 de marzo de 2025 14:08"],["Cabina 02","12 de marzo de 2025 20:07"],["Cabina 03","13 de marzo de 2025 09:30"]].flatMap((x,i)=>[<span key={`${i}-n`}>{x[0]}</span>,<span key={`${i}-d`}>{x[1]}</span>,<span key={`${i}-c`}>1</span>,<span key={`${i}-u`}><Status tone="blue">Disponible para Agenda</Status></span>,<span key={`${i}-a`}>⋮</span>])}</div><div className="real-note"><Mark type="extend"/><span>Service Location (service_locations) será el catálogo canónico. Appointment Location (appointment_locations) se conserva sólo durante la migración y no genera otro CRUD de cabinas.</span></div></div>}
      {tab==="notices" && <div className="real-tab-body"><div className="real-list-head"><span>Conf. de notificación de Appointments</span><button>＋ Crear configuración</button></div><div className="real-table notices"><b>Tiempo</b><b>Correo cliente</b><b>WhatsApp cliente</b><b>Correo responsable</b><b>WhatsApp responsable</b><b>Acciones</b>{[["24 Horas","✓","✓","✓","×"],["4 Horas","✓","✓","×","×"]].flatMap((x,i)=>x.map((v,j)=><span className={v==="✓"?"yes":v==="×"?"no":""} key={`${i}-${j}`}>{v}</span>).concat(<span key={`${i}-a`}>⋮</span>))}</div><div className="real-note"><Mark type="existing"/><span>La configuración actual se conserva. Sólo se desarrollará un cambio si el refinamiento demuestra un comportamiento requerido que hoy no existe.</span></div></div>}
      {tab==="availability" && <div className="real-tab-body availability-body"><div className="real-list-head"><span>Disponibilidad y política de reservación</span><Mark type="new"/></div><div className="real-availability-grid"><section><h3>Horario de atención</h3>{[["Lunes","09:00","19:00"],["Martes","09:00","19:00"],["Miércoles","09:00","19:00"],["Jueves","09:00","19:00"],["Viernes","09:00","19:00"],["Sábado","09:00","15:00"]].map(r=><div className="real-schedule" key={r[0]}><span className="switch on"/><b>{r[0]}</b><span>{r[1]}</span><i>—</i><span>{r[2]}</span></div>)}</section><section><h3>Política interna del MVP</h3><label>Zona horaria</label><div className="real-input">America/Monterrey⌄</div><label>Cancelar o reprogramar hasta</label><div className="real-input">24 horas antes⌄</div><label>Pago al reservar</label><div className="real-input">Opcional · no bloquea la cita⌄</div><p>Reprogramar conserva servicio y establecimiento; sólo cambia fecha, hora o prestador.</p></section></div><div className="real-list-head sub"><span>Prioridad para “Primer profesional disponible”</span><button>＋ Administrar prioridad</button></div><div className="priority-inline">{["1　Valeria González","2　Ricardo Acosta","3　Daniela Salas"].map(x=><span key={x}>⋮⋮　{x}</span>)}</div></div>}
    </section></div></AdminShell>;
}

function OfferingScreen() {
  const [kind,setKind]=useState<"kit"|"product">("kit");
  return <AdminShell><div className="real-admin-page editor-page"><div className="editor-switch"><button className={kind==="kit"?"active":""} onClick={()=>setKind("kit")}>Kit configurable</button><button className={kind==="product"?"active":""} onClick={()=>setKind("product")}>Producto individual</button></div>{kind==="kit"?<section className="real-editor"><h2>←　Editar kit: FACEUP-001</h2><nav><button className="active">Editar kit</button><button>Relaciones</button><button>Excepciones</button></nav><div className="editor-fields"><label>Código de agrupación<input value="FACEUP-001" readOnly/></label><label>Activo<span className="switch on"/></label><label>Alias<input value="Hydrafacial Premium" readOnly/></label><label>Destacado<span className="switch"/></label></div><h4>Español</h4><label className="wide">Nombre<input value="Hydrafacial Premium" readOnly/></label><label className="wide">Descripción<div className="editor-area">Tratamiento facial configurable</div></label><div className="kit-core"><label>Precio base<div className="real-input">$　1,850.00</div></label><label>Duración base <Mark type="extend"/><div className="real-input">60　minutos</div></label><label className="agendable-toggle"><span className="switch on"/> Oferta agendable</label></div><h3>Productos base</h3><div className="real-table product-base"><b>Nombre</b><b>SKU</b><b>Cantidad</b><b>Precio unitario</b><b>Acciones</b><span>Hydrafacial Base</span><span>SRV-001</span><span>1 u</span><span>$0.00</span><span>⋮</span></div><h3>Secciones</h3><div className="section-tabs"><button className="active">Complementos</button><button>Ampolletas</button><button>＋</button></div><div className="section-config"><label>Título<input value="Complementos" readOnly/></label><label>Límite inferior<div className="real-input">Requerido　1</div></label><label>Límite superior<div className="real-input">2</div></label><h3>Configuraciones: Complementos</h3><div className="section-tabs"><button className="active">Terapia LED</button><button>Mascarilla</button><button>＋</button></div><div className="component-fields"><label>Nombre<input value="Terapia LED" readOnly/></label><label>Precio<div className="real-input">Marginal / Adicional　$0.00</div></label><label>Duración adicional <Mark type="extend"/><div className="real-input">20　minutos</div></label></div></div><div className="authorized-workers"><div><h3>Users autorizados</h3><small>Elegibles para esta oferta y relacionados con el Establishment.</small></div><span>Valeria González ×</span><span>Ricardo Acosta ×</span><span>Daniela Salas ×</span><Mark type="extend"/></div><button className="real-save">Guardar</button></section>:<section className="real-editor product-editor"><h2>←　Editar producto: SRV-VAL</h2><nav><button>Editar producto</button><button className="active">Configuración</button><button>Publicar</button><button>Relaciones</button><button>Proveedores</button><button>Convertidores</button></nav><div className="inventory-switches">{[["Usar folios",false],["Vender sin inventario",true],["Restringir gestión de inventario",true],["Restringir visualización en inventario",true]].map(x=><div key={String(x[0])}><b>{x[0]}</b><span className={`switch ${x[1]?"on":""}`}/></div>)}</div><div className="product-agenda-block"><div><h3>Configuración agendable</h3><p>Extensión localizada del producto actual; no crea un catálogo de servicios.</p></div><Mark type="extend"/><label><span className="switch on"/> Producto agendable</label><label>Duración base<div className="real-input">30 minutos</div></label><label>Users autorizados<div className="real-input">Valeria González, Ricardo Acosta⌄</div></label><label>Tipo de ubicación requerido<div className="real-input">Cabina facial⌄</div></label></div><div className="real-note"><Mark type="existing"/><span>Relaciones conserva establecimientos, precio, visibilidad y tolerancia. No se duplica esa configuración aquí.</span></div><button className="real-save">Guardar</button></section>}</div></AdminShell>;
}

function BlockScreen() {
  return <AdminShell><div className="real-admin-page"><EstablishmentHeader/><section className="real-config-card block-background"><h2>Configuraciones</h2><nav className="real-config-tabs"><button>Users</button><button>Service Locations</button><button className="active">Disponibilidad</button></nav><div className="block-list"><div><b>Bloqueos de agenda</b><button>＋ Nuevo bloqueo</button></div><div className="real-table"><b>Elemento</b><b>Fecha</b><b>Horario</b><b>Motivo</b><b>Acciones</b><span>Valeria González</span><span>28 ago 2026</span><span>13:00–15:00</span><span>Capacitación</span><span>⋮</span></div></div><div className="real-modal"><header><h3>Nuevo bloqueo</h3><button>×</button></header><label>Elemento afectado *</label><div className="segmented"><button className="active">User</button><button>Establishment</button><button>Service Location</button></div><label>User *</label><div className="real-input">Valeria González⌄</div><div className="triple"><label>Fecha<div className="real-input">28 ago 2026</div></label><label>Desde<div className="real-input">13:00</div></label><label>Hasta<div className="real-input">15:00</div></label></div><label>Motivo</label><div className="real-input">Capacitación interna</div><p>✓ No existen citas en conflicto.</p><footer><button>Cancelar</button><button className="real-save">Guardar</button></footer></div></section></div></AdminShell>;
}

function StoreShell({ children, checkout=false }: { children: React.ReactNode; checkout?: boolean }) {
  return <div className={`real-store-shell ${checkout?"checkout":""}`}><header><div className="store-z">Z</div>{checkout?<><div className="checkout-total">Monto total: <b>$2,130.00</b></div><span>Mostrar detalles⌄</span></>:<><button className="hamburger">☰</button><div className="store-location"><small>Tu ubicación</small><b>⌖ Monterrey 64700</b><u>Cambiar ubicación</u></div><div className="store-search">Buscar　　　　　　　　　　　　　　　　⌕</div><div className="store-warehouse"><small>Tu clínica</small><b>Faceup San Pedro</b><em>Abierto</em><u>Otras ubicaciones</u></div><div className="store-cart-icon">🛒<i>1</i></div></>}</header>{children}<footer>© 2026 Zellship</footer></div>;
}

function CatalogScreen() {
  const cards=[["Hydrafacial Premium","$1,850.00","80 min"],["Valoración facial","$850.00","30 min"],["Limpieza profunda","$1,250.00","60 min"],["Terapia LED","$650.00","40 min"]];
  return <StoreShell><div className="store-catalog"><h2>Categorías destacadas</h2><div className="store-categories">{["Ver todos","Faciales","Valoraciones","Ver más"].map((x,i)=><button className={i===1?"active":""} key={x}><i>{i===0?"▦":i===3?"•••":"F"}</i><span>{x}</span></button>)}</div><div className="catalog-actions"><button>↕ Ordenar</button><button>☷ Filtros</button></div><div className="catalog-grid">{cards.map((x,i)=><article key={x[0]}><div className={`service-picture pic-${i}`}><span>{i===0?"FACEUP":"F"}</span></div><h3>{x[0]}</h3><p>{x[1]}</p><small>{x[2]} · Reservación en clínica</small><button>Ver tratamiento</button></article>)}</div><div className="real-note store-note"><Mark type="existing"/><span>Catálogo, ubicación, búsqueda, categorías y tarjetas conservan el Store actual. Sólo se identifica la oferta agendable.</span></div></div></StoreShell>;
}

function KitDetailScreen() {
  return <StoreShell><div className="store-product-detail"><section className="product-hero"><div className="product-gallery"><div className="main-service-image">FACEUP<small>Hydrafacial</small></div><button>F</button></div><aside><h2>Hydrafacial Premium</h2><small>SKU: FACEUP-001</small><strong>$1,850.00</strong><span>Duración desde 60 min</span><u>Ver en otras clínicas</u><div className="quantity">−　1　＋</div><button className="store-blue">Continuar para configurar</button><button>Agregar al carrito</button></aside></section><section className="kit-description"><h4>Descripción:</h4><h1>Hydrafacial Premium</h1><h4>Servicios base:</h4><span className="tag">[1 u] Hydrafacial Base</span>{[["Complementos","Mín. 1","Máx. 2","Obligatorio",["Terapia LED　+$0 · +20 min","Mascarilla calmante　+$150 · +15 min"]],["Ampolletas","","Máx. 1","Opcional",["Vitamina C　+$280 · +0 min","Ácido hialurónico　No disponible"]]].map(s=><div className="store-kit-section" key={String(s[0])}><header><b>{s[0] as string}</b><div><span>{s[1] as string}</span><span>{s[2] as string}</span><span>{s[3] as string}</span></div></header>{(s[4] as string[]).map((x,i)=><button className={i===0?"selected":""} key={x}><span>{x}</span><i>{i===0?"✓":"○"}</i></button>)}</div>)}</section><div className="real-note store-note"><Mark type="existing"/><span>El configurador del Kit permanece en el detalle. Precio y minutos adicionales se calculan antes de consultar disponibilidad.</span></div></div></StoreShell>;
}

function CartScreen() {
  return <StoreShell><div className="store-cart-page"><h1>Carrito de compras</h1><section className="cart-item"><div className="cart-thumb">F</div><div><h2>Hydrafacial Premium</h2><p>Terapia LED · Vitamina C</p><small>Duración final: 80 minutos</small></div><div><button>−　1　＋</button><strong>$2,130.00</strong><u>Eliminar</u></div></section><section className="cart-total"><div><span>Subtotal:</span><b>$2,130.00</b></div><div><h2>Total:</h2><strong>$2,130.00</strong></div><small>Precio con IVA</small><button className="store-blue">Continuar para programar</button></section><div className="service-cart-rule"><Mark type="extend"/><div><b>Carrito compuesto sólo por una oferta agendable</b><p>No se muestra “Entrega de mercancías”. Los componentes físicos forman parte del tratamiento y se reservan para su uso en la cita.</p></div></div><h2>Servicios relacionados</h2><div className="related-card">Valoración facial <span>30 min · $850.00</span></div></div></StoreShell>;
}

function SlotScreen() {
  return <StoreShell checkout><div className="checkout-page"><div className="checkout-step-title"><span>Programa tu cita</span><h1>Elige profesional y horario</h1><p>La información de contacto y el tratamiento configurado ya están guardados.</p></div><div className="checkout-contact-summary"><b>Sofía Martínez</b><span>sofia@email.com · +52 81 5555 5555</span><button>Editar contacto</button></div><div className="checkout-clinic"><span>Faceup San Pedro</span><b>Hydrafacial Premium · 80 minutos</b></div><h3>Especialista</h3><div className="professional-options"><button className="professional-card selected"><span className="avatar violet">PD</span><div><b>Primer profesional disponible</b><small>Asignación por prioridad</small></div><em>Recomendado</em></button><button className="professional-card"><span className="avatar violet">VG</span><div><b>Valeria González</b><small>Especialista facial</small></div></button><button className="professional-card"><span className="avatar violet">RA</span><div><b>Ricardo Acosta</b><small>Especialista facial</small></div></button></div><h3>Fecha y hora</h3><div className="date-strip">{["Vie 28","Sáb 29","Lun 31","Mar 01"].map((x,i)=><button key={x} className={i===0?"active":""}>{x}</button>)}</div><div className="slot-grid">{["09:00","10:30","11:30","13:00","15:30","17:00"].map((x,i)=><button key={x} className={i===2?"selected":""}>{x}<small>{i===2?"Valeria":"Disponible"}</small></button>)}</div><div className="availability-note">✓ 11:30–12:50 · Valeria González · Cabina 02</div><div className="checkout-nav"><button>Regresar al carrito</button><button className="store-blue">Continuar</button></div></div></StoreShell>;
}

function ReviewScreen() {
  return <StoreShell checkout><div className="checkout-page review-checkout"><div className="checkout-step-title"><span>Revisa tu reservación</span><h1>Resumen y pago opcional</h1><p>Reservar ocupa el horario; pagar y confirmar son acciones independientes.</p></div><div className="order-summary-real"><div><span>Tratamiento</span><b>Hydrafacial Premium · Kit configurado</b></div><div><span>Horario</span><b>Viernes 28 de agosto · 11:30–12:50</b></div><div><span>Especialista</span><b>Valeria González · Cabina 02</b></div><div><span>Total</span><strong>$2,130.00</strong></div></div><h2>Opciones de pago</h2><div className="payment-options"><button className="selected">○　Reservar sin pagar ahora <small>El horario queda apartado inmediatamente</small></button><button>○　Pagar ahora <small>Continúa a los métodos configurados en Zellship</small></button></div><label className="terms">☑ Acepto los términos de reservación</label><button className="store-blue reserve-button">Reservar horario</button><div className="reservation-effects"><Mark type="new"/><div><b>Se crean la cita Reservada y la cuenta reservada relacionada</b><small>Los productos físicos quedan retenidos; los servicios no generan movimientos de inventario.</small></div></div></div></StoreShell>;
}

function MyAppointmentScreen() {
  return <StoreShell><div className="order-detail-public"><header><h1>Detalles de orden</h1><Status tone="blue">Pendiente</Status><dl><dt>Fecha de orden:</dt><dd>08/28/2026</dd><dt>Número de orden:</dt><dd>58</dd><dt>Total de orden:</dt><dd>$2,130.00</dd></dl></header><section className="appointment-public-block"><div><h2>Detalles de la cita</h2><Status tone="blue">Reservada</Status></div><div className="appointment-public-grid"><span><small>Tratamiento</small><b>Hydrafacial Premium</b></span><span><small>Fecha y hora</small><b>28 ago 2026 · 11:30–12:50</b></span><span><small>Especialista</small><b>Valeria González</b></span><span><small>Clínica y cabina</small><b>Faceup San Pedro · Cabina 02</b></span></div><div className="public-actions-real"><button className="store-blue">Confirmar cita</button><button>Reprogramar</button><button className="danger-text">Cancelar cita</button></div><p>Puedes cancelar o reprogramar hasta 24 horas antes. Reprogramar conserva el tratamiento y la clínica.</p></section><section className="commercial-public-block"><h2>Cuenta relacionada</h2><div><span>Estado de pago</span><b>Sin pago · opcional</b><button>Pagar ahora</button></div></section><div className="real-note"><Mark type="extend"/><span>La orden/cuenta y la cita conservan estados separados. Confirmar asistencia no equivale a pagar.</span></div></div></StoreShell>;
}

function ScopeScreen() {
  return <div className="mvp-board">
    <section className="mvp-hero">
      <div><span className="mvp-kicker">DELTA FUNCIONAL PARA VALIDACIÓN</span><h2>Gestión de Appointments · MVP en POS y ADMIN</h2><p>El MVP extiende la Agenda y las entidades actuales de Zellship. Esta vista separa explícitamente lo que ya existe de lo que TI debe cambiar. Store queda fuera.</p></div>
      <div className="mvp-state"><b>MVP funcional</b><span>POS + ADMIN</span><small>Store sin cambios</small></div>
    </section>
    <div className="mvp-columns delta-grid">
      <section className="mvp-card as-is"><header><span>AS</span><div><b>AS-IS confirmado</b><small>Referencia · no construir de nuevo</small></div></header><ul><li>Agenda POS y Appointment (appointments).</li><li>User, Appointment Location, Service Location, Product, Mix, Account, Command y Command Item.</li><li>Relación Appointment → appointment_accounts → Account → Command → Command Item → Product/Mix.</li><li>Appointment Location está relacionada con Appointment, pero funciona como catálogo de etiquetas.</li><li>Estados y comportamiento actuales de Account y Command.</li><li>Configuración actual de notificaciones de Appointment y transición reserved → open.</li></ul></section>
      <section className="mvp-card included"><header><span>Δ</span><div><b>Cambios requeridos</b><small>Desarrollo sobre el AS-IS</small></div></header><ul><li>Migrar Appointment Location a Service Location sin perder históricos.</li><li>Configurar Product/Mix como oferta agendable.</li><li>Calcular disponibilidad conjunta de User y Service Location.</li><li>Revalidar y reservar de forma atómica.</li><li>Ajustar la orquestación con Account, Command y Command Items existentes.</li><li>Agregar disponibilidad y bloqueos excepcionales en ADMIN.</li><li>Adaptar sólo la Agenda POS a mobile.</li></ul></section>
      <section className="mvp-card excluded"><header><span>—</span><div><b>Fuera del MVP</b><small>No incluir en estimación</small></div></header><ul><li>Store y reservación pública.</li><li>Carrito, checkout y flujo de pago.</li><li>Rediseño móvil del resto del POS.</li><li>Vistas Semana y Año en mobile.</li><li>Nuevas entidades de especialista o cabina.</li><li>Conservar Appointment Location como catálogo paralelo después de la migración.</li><li>Bloqueos recurrentes o un engine independiente.</li></ul></section>
    </div>
    <section className="mvp-flow"><h3>Recorrido del delta</h3><div><span><i>1</i><b>Configurar</b><small>Product/Mix, duración, User y Service Location</small></span><em>→</em><span><i>2</i><b>Calcular</b><small>Disponibilidad y bloqueos aplicables</small></span><em>→</em><span><i>3</i><b>Reservar</b><small>Revalidación atómica e integración comercial</small></span><em>→</em><span><i>4</i><b>Operar</b><small>Efectos sobre recursos y reserved → open</small></span></div></section>
    <section className="mvp-entity-map"><h3>Entidades canónicas de Zellship</h3><p className="entity-map-note">El término del sistema aparece como nombre principal. Coloca el cursor sobre <i>i</i> para consultar su nombre técnico y cualquier alias visible.</p><div><span><b><EntityHint system="Appointment" code="appointments">Appointment</EntityHint></b><small>Entidad actual de la Agenda POS</small></span><span><b><EntityHint system="User" code="users" note="Profesional o especialista son etiquetas visibles.">User</EntityHint></b><small>Prestador canónico del piloto</small></span><span><b><EntityHint system="Appointment Location" code="appointment_locations" note="Entidad actual relacionada con Appointment; se conserva temporalmente para migración e históricos.">Appointment Location</EntityHint></b><small>Legado a migrar</small></span><span><b><EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta visible en Faceup.">Service Location</EntityHint></b><small>Recurso canónico del MVP</small></span><span><b><EntityHint system="Product" code="products" note="Hacerlo agendable es un cambio del MVP.">Product</EntityHint></b><small>Oferta simple propuesta</small></span><span><b><EntityHint system="Mix" code="mixes" note="Kit es su etiqueta visible.">Mix</EntityHint></b><small>Oferta configurable propuesta</small></span><span><b><EntityHint system="Account" code="accounts" note="Se relaciona con Appointment mediante appointment_accounts.">Account</EntityHint></b><small>Entidad comercial actual</small></span><span><b><EntityHint system="Command / Command Item" code="commands / command_items" note="Se alcanzan desde Account; no existe relación directa con Appointment.">Command / Command Item</EntityHint></b><small>Encabezado y renglones comerciales actuales</small></span></div></section>
  </div>;
}

function RulesScreen() {
  const rules = [
    ["Disponibilidad", "Agregar la coincidencia entre horario del Establishment, User autorizado y Service Location libre durante toda la duración."],
    ["Duración", "Agregar duración base a Product y duración base más minutos adicionales a Mix."],
    ["Concurrencia", "Revalidar y reservar User y Service Location de forma atómica; si otro proceso gana el intervalo, rechazar el segundo."],
    ["Reprogramación", "Al reprogramar, revalidar recursos y conservar la oferta configurada y el Establishment."],
    ["Registrar llegada", "Presentar la transición actual reserved → open con esta etiqueta; no crear otro estado ni registrar pago o cierre."],
    ["Cancelación", "Agregar la liberación de User, Service Location e inventario retenido aplicable; lo financiero permanece separado."],
  ];
  return <div className="mvp-board"><section className="rules-heading"><span className="mvp-kicker">REGLAS DEL DELTA</span><h2>Cambios que el dummy representa</h2><p>Las funciones actuales sólo aparecen como contexto cuando son necesarias para entender el cambio requerido.</p></section><div className="rule-grid">{rules.map((rule,index)=><article key={rule[0]}><i>{String(index+1).padStart(2,"0")}</i><div><h3>{rule[0]}</h3><p>{rule[1]}</p></div></article>)}</div><section className="mvp-acceptance"><div><h3>Criterio de cierre del MVP</h3><p>Un Appointment no puede producir doble ocupación de User o Service Location, y sus efectos deben ser consistentes con Account, Command y Command Items actuales.</p></div><Status tone="green">Delta listo para TI</Status></section></div>;
}

function PendingScreen() {
  const pending = [
    ["Appointment ↔ Product/Mix", "Definir la relación persistente de la oferta agendable con Appointment."],
    ["Migración a Service Location", "Definir mapeo histórico, compatibilidad temporal y retiro controlado de appointment_locations; validar el significado de service_locations.capability."],
    ["Concurrencia", "Definir transacción y restricciones que impidan dobles asignaciones de User o Service Location."],
    ["Bloqueos", "Definir persistencia para excepciones por fecha y horario específico; sin recurrencia."],
    ["Account / Command", "Definir cuándo se crea o actualiza Command y cómo se retiene o libera inventario."],
    ["Notificaciones", "Confirmar únicamente el delta requerido sobre la configuración actual de Appointment."],
  ];
  return <div className="mvp-board"><section className="rules-heading"><span className="mvp-kicker">NO ASUMIR IMPLEMENTADO</span><h2>Pendientes técnicos para refinamiento</h2><p>Son decisiones de implementación que TI debe resolver antes de comprometer la estimación final; no representan funciones ya existentes.</p></section><div className="pending-grid">{pending.map(([title,detail],index)=><article key={title}><span>{String(index+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{detail}</p></div><Status tone="yellow">Por definir</Status></article>)}</div></div>;
}

function ReviewPanel({ tab, onTab, inspectionMode, onToggleInspection, onScenario, onRequirement, onClose }: { tab: "journeys" | "requirements"; onTab: (tab: "journeys" | "requirements") => void; inspectionMode: boolean; onToggleInspection: () => void; onScenario: (id: ScenarioId) => void; onRequirement: (id: InspectionId) => void; onClose: () => void }) {
  return <aside className="review-panel" aria-label="Modo revisión">
    <header><div><small>MODO REVISIÓN</small><h2>Validar el contrato visual</h2></div><button aria-label="Cerrar modo revisión" onClick={onClose}>×</button></header>
    <nav className="review-panel-tabs"><button className={tab === "journeys" ? "active" : ""} onClick={() => onTab("journeys")}>Recorridos</button><button className={tab === "requirements" ? "active" : ""} onClick={() => onTab("requirements")}>Requerimientos</button></nav>
    {tab === "journeys" ? <section className="review-panel-list">{scenarios.map((item,index)=><button key={item.id} onClick={() => onScenario(item.id)}><i>{index+1}</i><span><b>{item.label}</b><small>{item.instruction}</small></span><em>›</em></button>)}</section> : <section className="review-panel-list requirements-list">{(Object.keys(requirements) as InspectionId[]).map(id=><button key={id} onClick={() => onRequirement(id)}><span><b>{requirements[id].title}</b><small>{requirements[id].technical}</small></span><Mark type={requirements[id].change}/></button>)}</section>}
    <footer><button className={inspectionMode ? "active" : ""} onClick={onToggleInspection}>{inspectionMode ? "✓ Ocultar marcadores" : "＋ Mostrar marcadores"}</button><div className="review-legend"><Mark type="existing"/><Mark type="extend"/><Mark type="new"/></div></footer>
  </aside>;
}

function ConflictsScreen() {
  const [resolved, setResolved] = useState(false);
  return <PosShell title="Citas" subtitle="Programar cita · revalidación final" compact>
    <div className="conflict-context-stage">
      <div className="conflict-origin"><b>Dónde aparece</b><span>Programar cita → Registrar cita → Revalidación final</span><small>También puede mostrarse al guardar una reprogramación.</small></div>
      <section className="conflict-form-underlay" aria-hidden="true">
        <header><h3>Registrar cita</h3><span>×</span></header>
        <div><span>Cliente</span><b>Sofía Martínez</b></div>
        <div><span>Servicio</span><b>Hydrafacial Premium · 80 minutos</b></div>
        <div><span>Profesional y cabina</span><b>Valeria González · Cabina 02</b></div>
        <div><span>Horario solicitado</span><b>25 ago 2026 · 11:30–12:50</b></div>
        <footer><button>Cancelar</button><button className="zs-primary">Registrar cita</button></footer>
      </section>
      <div className="conflict-context-dim"/>
      <section className="conflict-panel conflict-modal inspection-target" role="dialog" aria-modal="true" aria-label="Conflicto de disponibilidad">
        <InspectionPin id="conflict"/>
        <header><div><span className="mvp-kicker">MODAL CONTEXTUAL · REVALIDACIÓN AL GUARDAR</span><h2>{resolved ? "Siguiente horario disponible" : "El horario ya no está disponible"}</h2></div><Status tone={resolved ? "green" : "red"}>{resolved ? "Alternativa" : "Conflicto"}</Status></header>
        {resolved ? <div className="conflict-success"><b>✓ 12:50–14:10 disponible</b><span>Valeria González · <EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta operativa del recurso canónico de Agenda.">Cabina 02</EntityHint> · 80 minutos</span><small>Al usarlo se actualiza el formulario original; Appointment todavía no se registra.</small></div> : <><div className="conflict-summary"><span>25 ago 2026</span><b>11:30–12:50</b><small>Otra operación reservó el intervalo después de que fue consultado y antes de guardar.</small></div><div className="conflict-reasons"><article><i>♙</i><div><b><EntityHint system="User" code="users" note="Profesional es la etiqueta visible del prestador.">Valeria González</EntityHint></b><small>Ocupada hasta las 12:50</small></div><Status tone="red">No disponible</Status></article><article><i>⌾</i><div><b><EntityHint system="Service Location" code="service_locations" note="Cabina es la etiqueta operativa del recurso canónico de Agenda.">Cabina 02</EntityHint></b><small>Ocupada hasta las 12:50</small></div><Status tone="red">No disponible</Status></article></div></>}
        <div className="conflict-behavior"><b>Resultado de esta validación</b><span>No quedan parcialmente modificados Appointment, Account, Command, Command Items ni la retención. Los datos capturados se conservan.</span></div>
        <footer><button>Volver al formulario</button><button className="zs-primary" onClick={()=>setResolved(true)}>{resolved ? "Usar este horario" : "Buscar siguiente horario"}</button></footer>
      </section>
    </div>
  </PosShell>;
}

export default function Home() {
  const [surface, setSurface] = useState<Surface>("MVP");
  const [screen, setScreen] = useState("scope");
  const [scenario, setScenario] = useState<ScenarioId | null>(null);
  const [inspectionMode, setInspectionMode] = useState(false);
  const [activeInspection, setActiveInspection] = useState<InspectionId | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState<"journeys" | "requirements">("journeys");
  const available = screens[surface];
  const activeScenario = scenarios.find(item => item.id === scenario);
  const view = useMemo(() => {
    if (surface === "MVP") {
      if (screen === "rules") return <RulesScreen />;
      if (screen === "pending") return <PendingScreen />;
      return <ScopeScreen />;
    }
    if (surface === "POS") {
      if (screen === "mobile-calendar") return <MobileCalendarScreen />;
      if (screen === "appointment") return <AppointmentScreen />;
      if (screen === "detail") return <DetailScreen key={scenario ?? "detail"} focus={scenario ?? undefined} />;
      if (screen === "conflicts") return <ConflictsScreen />;
      return <AgendaScreen />;
    }
    if (surface === "Admin") {
      if (screen === "offering") return <OfferingScreen />;
      if (screen === "block") return <BlockScreen />;
      return <SettingsScreen />;
    }
    return <SettingsScreen />;
  }, [surface, screen, scenario]);

  const switchSurface = (next: Surface) => { setSurface(next); setScreen(screens[next][0].id); setScenario(null); };
  const chooseScenario = (id: ScenarioId) => {
    const next = scenarios.find(item => item.id === id)!;
    setScenario(id);
    setSurface("POS");
    setScreen(next.screen);
    setReviewOpen(false);
  };
  const toggleInspection = () => {
    setInspectionMode(current => !current);
    if (inspectionMode) setActiveInspection(null);
  };

  return (
    <InspectionContext.Provider value={{ enabled: inspectionMode, open: setActiveInspection }}><main className={inspectionMode ? "inspection-mode" : ""}>
      <header className="review-header">
        <div className="brand-lockup"><div className="brand-mark">ZS</div><div><small>Contrato visual MVP</small><h1>Faceup · Citas en Zellship</h1></div></div>
        <div className="surface-tabs">{(["MVP","POS","Admin"] as Surface[]).map(item=><button key={item} className={surface===item?"active":""} onClick={()=>switchSurface(item)}>{item === "MVP" ? "Alcance MVP" : item}</button>)}</div>
        <div className="review-state"><span className="state-dot"/>POS + ADMIN</div>
      </header>
      <section className="context-bar">
        <div><b>MVP sobre Zellship actual</b><span>Store, reservación pública, carrito y checkout quedan fuera de esta etapa. El único recorrido móvil del POS es Agenda.</span></div>
        <button className={`review-mode-button ${reviewOpen ? "active" : ""}`} onClick={() => setReviewOpen(current => !current)}>☷ Modo revisión</button>
      </section>
      {activeScenario && <section className="active-journey"><span>{scenarios.findIndex(item => item.id === activeScenario.id)+1}</span><div><b>{activeScenario.label}</b><small>{activeScenario.instruction}</small></div><button onClick={() => setScenario(null)}>×</button></section>}
      <nav className="screen-nav">{available.map(item=><button key={item.id} className={screen===item.id?"active":""} onClick={()=>{ setScreen(item.id); setScenario(null); }}>{item.label}</button>)}</nav>
      <section className="canvas">{view}</section>
      <footer><span>Datos de simulación · Dummy funcional para validar requerimientos, no implementación productiva</span><span>Faceup × Zellship · MVP POS + ADMIN</span></footer>
      <RequirementDrawer id={activeInspection} onClose={()=>setActiveInspection(null)}/>
      {reviewOpen && <ReviewPanel tab={reviewTab} onTab={setReviewTab} inspectionMode={inspectionMode} onToggleInspection={toggleInspection} onScenario={chooseScenario} onRequirement={(id) => { setActiveInspection(id); setReviewOpen(false); }} onClose={() => setReviewOpen(false)}/>} 
    </main></InspectionContext.Provider>
  );
}
