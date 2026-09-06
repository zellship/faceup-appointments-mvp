import React, { useState } from "react";
import {
  AimOutlined,
  AppstoreOutlined,
  BellOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  MenuOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Toggle } from "./ui";

type AdminSpace = "service-locations" | "operative-locations" | "appointments" | "notifications";
type LegacySpace = "resources" | "offers" | "reminders";
type Props = {
  initialSpace?: AdminSpace | LegacySpace;
  initialSection?: string;
  onHelp: (id: string) => void;
};

type Location = {
  name: string;
  createdAt: string;
  capability: number;
  appointmentEnabled: boolean;
  appointmentCapacity: number;
  general?: boolean;
};

type DayMode = "ranges" | "24h" | "unavailable";
type DaySchedule = { mode: DayMode; ranges: { from: string; to: string }[] };

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const antIcon = (component: unknown) => React.createElement(component as React.ComponentType);

const currentTabs: { id?: AdminSpace; label: string }[] = [
  { label: "General" },
  { id: "appointments", label: "Citas" },
  { label: "Reportes" },
  { label: "Trabajadores" },
  { label: "Terminales" },
  { id: "service-locations", label: "Ubicaciones de servicio" },
  { id: "operative-locations", label: "Ubicaciones operativas" },
  { label: "Categoría de aclaraciones" },
  { label: "Tipos de aclaraciones" },
  { id: "notifications", label: "Conf. de notificaciones" },
];

function resolveSpace(initialSpace?: AdminSpace | LegacySpace, initialSection?: string): AdminSpace {
  if (!initialSpace || initialSpace === "resources") {
    return initialSection === "locations" || !initialSection ? "service-locations" : "appointments";
  }
  if (initialSpace === "offers") return initialSection === "eligibility" ? "operative-locations" : "appointments";
  if (initialSpace === "reminders") return "notifications";
  return initialSpace;
}

function AdminFrame({ space, onSpace, children }: { space: AdminSpace; onSpace: (space: AdminSpace) => void; children: React.ReactNode }) {
  const rail = [AppstoreOutlined, AimOutlined, FileTextOutlined, DollarOutlined, SwapOutlined, CalendarOutlined, TeamOutlined, SettingOutlined];
  return <div className="zs-product-frame zs-admin-frame">
    <aside className="zs-admin-rail">
      <a className="zs-admin-home" aria-label="Inicio"><span className="zs-current-mark"><i/><i/></span><strong>ZellShip</strong></a>
      <small>Operativo</small>
      {rail.slice(0, 5).map((icon, index) => <button key={`op-${index}`}>{antIcon(icon)}</button>)}
      <small>Administración</small>
      {rail.slice(5).map((icon, index) => <button key={`admin-${index}`} className={index === 1 ? "active" : ""}>{antIcon(icon)}</button>)}
    </aside>
    <main>
      <header className="zs-product-top zs-admin-top">
        <button className="zs-menu-button" aria-label="Abrir menú">{antIcon(MenuOutlined)}</button>
        <div className="zs-admin-context"><i>{antIcon(SwapOutlined)}</i><span>1/1 almacén seleccionado</span><button>Cambiar</button></div>
        <button className="zs-admin-bell" aria-label="Notificaciones">{antIcon(BellOutlined)}</button>
        <div className="zs-user"><span>{antIcon(UserOutlined)}</span><b>Admin⌄</b></div>
      </header>
      <div className="zs-admin-body">
        <div className="zs-admin-breadcrumb">Establecimientos <span>/</span> Faceup San Pedro</div>
        <section className="zs-establishment-card">
          <header><h1>Faceup San Pedro</h1><span className="zs-live">Activo</span><button aria-label="Acciones">{antIcon(MoreOutlined)}</button></header>
          <dl>
            <div><dt>Responsable</dt><dd><span className="zs-admin-avatar">{antIcon(UserOutlined)}</span><span><b>Admin Faceup</b><a>admin@faceup.mx</a><small>81 5555 0101</small></span></dd></div>
            <div><dt>Dirección</dt><dd><span><b>San Pedro Garza García, Nuevo León</b><small>America/Monterrey</small></span></dd></div>
          </dl>
        </section>
        <section className="zs-admin-config">
          <h2>Configuraciones</h2>
          <nav className="zs-current-admin-tabs">{currentTabs.map((tab, index) => <button disabled={!tab.id} className={tab.id === space ? "active" : ""} onClick={() => tab.id && onSpace(tab.id)} key={`${tab.label}-${index}`}>{tab.label}</button>)}</nav>
          {children}
        </section>
      </div>
    </main>
  </div>;
}

export function AdminView({ initialSpace, initialSection, onHelp }: Props) {
  const [space, setSpace] = useState<AdminSpace>(() => resolveSpace(initialSpace, initialSection));
  return <AdminFrame space={space} onSpace={setSpace}>
    {space === "service-locations" && <ServiceLocations/>}
    {space === "operative-locations" && <OperativeLocations/>}
    {space === "appointments" && <AppointmentSettings initialSection={initialSection} onHelp={onHelp}/>}
    {space === "notifications" && <NotificationSettings onHelp={onHelp}/>}
  </AdminFrame>;
}

function ServiceLocations() {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([
    { name: "General", createdAt: "13 de junio de 2026 12:35", capability: 10000, appointmentEnabled: true, appointmentCapacity: 50, general: true },
    { name: "Cabina 01", createdAt: "24 de julio de 2026 13:17", capability: 5, appointmentEnabled: true, appointmentCapacity: 1 },
    { name: "Cabina 02", createdAt: "6 de agosto de 2026 23:45", capability: 10, appointmentEnabled: true, appointmentCapacity: 1 },
    { name: "Cabina 03", createdAt: "6 de agosto de 2026 23:45", capability: 10, appointmentEnabled: false, appointmentCapacity: 1 },
  ]);
  const visible = locations.map((location, index) => ({ location, index })).filter(({ location }) => location.name.toLowerCase().includes(query.toLowerCase()));
  const selected = editing === null ? null : locations[editing];
  const update = (change: Partial<Location>) => editing !== null && setLocations(current => current.map((item, index) => index === editing ? { ...item, ...change } : item));

  return <div className="zs-current-admin-content">
    <header className="zs-current-list-head"><div><h3>Listado de ubicaciones de servicio</h3><p>Se conserva el módulo actual; la configuración de citas se agrega dentro de cada ubicación.</p></div><button>{antIcon(PlusOutlined)} Agregar ubicación de servicio</button></header>
    <label className="zs-current-search"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar"/><span>{antIcon(SearchOutlined)}</span></label>
    <div className="zs-current-admin-table zs-service-location-table">
      <div className="head"><b>Nombre</b><b>Fecha de creación</b><b>Capacidad</b><b>Acciones</b></div>
      {visible.map(({ location, index }) => <div key={location.name}>
        <span><b>{location.name}</b>{location.general && <em>Por defecto</em>}</span>
        <span>{location.createdAt}</span>
        <span>{location.capability}</span>
        <button className="zs-dots" aria-label={`Editar ${location.name}`} onClick={() => setEditing(index)}>{antIcon(MoreOutlined)}</button>
      </div>)}
    </div>
    <p className="zs-current-footnote">La tabla permanece As-Is. Desde Acciones se configura si la ubicación admite citas y cuántas reservas simultáneas permite.</p>
    {selected && <div className="zs-admin-modal-layer" onMouseDown={event => event.currentTarget === event.target && setEditing(null)}>
      <section className="zs-admin-modal" role="dialog" aria-modal="true" aria-label={`Editar ${selected.name}`}>
        <header><div><h3>Editar ubicación de servicio</h3><span>{selected.name}</span></div><button onClick={() => setEditing(null)}>×</button></header>
        <div className="zs-admin-modal-body">
          <label>Nombre<input value={selected.name} readOnly/></label>
          <label>Capacidad comercial<input value={selected.capability} readOnly/></label>
          <fieldset><legend>Configuración para citas</legend>
            <Toggle checked={selected.appointmentEnabled} onChange={appointmentEnabled => update({ appointmentEnabled })} label="Habilitar para citas"/>
            <label>Capacidad de citas<input type="number" min="1" value={selected.appointmentCapacity} disabled={!selected.appointmentEnabled} onChange={event => update({ appointmentCapacity: Number(event.target.value) })}/><small>Citas simultáneas; es independiente de capability.</small></label>
            {selected.general && <p>{antIcon(EnvironmentOutlined)} General es una ubicación de sistema y no aparece entre las cabinas seleccionables.</p>}
          </fieldset>
        </div>
        <footer><button onClick={() => setEditing(null)}>Cancelar</button><button className="zs-primary" onClick={() => setEditing(null)}>Guardar</button></footer>
      </section>
    </div>}
  </div>;
}

function OperativeLocations() {
  const [editing, setEditing] = useState(false);
  const [allProviders, setAllProviders] = useState(true);
  const [selected, setSelected] = useState(["Valeria González", "Ricardo Acosta"]);
  const people = ["Valeria González · User", "Ricardo Acosta · Worker", "Daniela Salas · User", "Mónica Herrera · Worker"];
  const toggle = (name: string) => setSelected(current => current.includes(name) ? current.filter(item => item !== name) : [...current, name]);
  return <div className="zs-current-admin-content">
    <header className="zs-current-list-head"><div><h3>Listado de ubicaciones operativas</h3><p>Productos, Kits y prestadores se resuelven desde la misma ubicación operativa.</p></div><button>{antIcon(PlusOutlined)} Agregar ubicación operativa</button></header>
    <label className="zs-current-search"><input placeholder="Buscar"/><span>{antIcon(SearchOutlined)}</span></label>
    <div className="zs-current-admin-table zs-operative-table">
      <div className="head"><b>Nombre</b><b>Productos y Kits</b><b>Users y Workers</b><b>Fecha de creación</b><b>Acciones</b></div>
      <div><span><b>Facial</b></span><span>8 relacionados</span><span><em className="blue">Todos</em></span><span>24 de julio de 2026 13:17</span><button className="zs-dots" onClick={() => setEditing(true)}>{antIcon(MoreOutlined)}</button></div>
      <div><span><b>Corporal</b></span><span>5 relacionados</span><span>3 seleccionados</span><span>6 de agosto de 2026 23:45</span><button className="zs-dots" onClick={() => setEditing(true)}>{antIcon(MoreOutlined)}</button></div>
    </div>
    <p className="zs-current-footnote">No existe una relación directa Product/Mix–prestador: la intersección de sus ubicaciones operativas determina quién puede ejecutar cada Command Item.</p>
    {editing && <div className="zs-admin-modal-layer" onMouseDown={event => event.currentTarget === event.target && setEditing(false)}>
      <section className="zs-admin-modal zs-operative-modal" role="dialog" aria-modal="true" aria-label="Editar ubicación operativa">
        <header><div><h3>Facial</h3><span>Editar ubicación operativa</span></div><button onClick={() => setEditing(false)}>×</button></header>
        <div className="zs-admin-modal-body">
          <fieldset><legend>Productos y Kits</legend><p className="zs-preserved-relation"><b>8 relacionados</b><span>Se conserva la relación existente de la ubicación operativa con Productos y Kits.</span></p><button className="zs-outline-action">Administrar productos y kits</button></fieldset>
          <fieldset><legend>Users y Workers</legend>
            <label className="zs-radio-row"><input type="radio" checked={allProviders} onChange={() => setAllProviders(true)}/><span><b>Todos</b><small>Incluye automáticamente prestadores actuales y nuevos.</small></span></label>
            <label className="zs-radio-row"><input type="radio" checked={!allProviders} onChange={() => setAllProviders(false)}/><span><b>Seleccionar prestadores</b><small>Restringe la operación a la lista indicada.</small></span></label>
            {!allProviders && <div className="zs-provider-list">{people.map(person => { const [name, kind] = person.split(" · "); return <label key={person}><input type="checkbox" checked={selected.includes(name)} onChange={() => toggle(name)}/><span><b>{name}</b><small>{kind}</small></span></label>; })}</div>}
          </fieldset>
        </div>
        <footer><button onClick={() => setEditing(false)}>Cancelar</button><button className="zs-primary" onClick={() => setEditing(false)}>Guardar</button></footer>
      </section>
    </div>}
  </div>;
}

function AppointmentSettings({ initialSection, onHelp }: { initialSection?: string; onHelp: (id: string) => void }) {
  const [section, setSection] = useState(initialSection === "priority" || initialSection === "blocks" || initialSection === "rules" ? initialSection : "schedule");
  return <div className="zs-current-admin-content">
    <nav className="zs-current-inner-tabs">
      <button className={section === "schedule" ? "active" : ""} onClick={() => setSection("schedule")}>Horarios</button>
      <button className={section === "priority" ? "active" : ""} onClick={() => setSection("priority")}>Prioridad</button>
      <button className={section === "blocks" ? "active" : ""} onClick={() => setSection("blocks")}>Bloqueos</button>
      <button className={section === "rules" ? "active" : ""} onClick={() => setSection("rules")}>Reglas de agenda</button>
    </nav>
    {section === "schedule" && <ScheduleEditor/>}
    {section === "priority" && <Priority/>}
    {section === "blocks" && <Blocks/>}
    {section === "rules" && <AppointmentRules onHelp={onHelp}/>}
  </div>;
}

function ScheduleEditor() {
  const [owner, setOwner] = useState("Faceup San Pedro · Establishment");
  const [day, setDay] = useState(0);
  const [schedule, setSchedule] = useState<DaySchedule[]>(days.map((_, index) => ({ mode: index === 6 ? "unavailable" : "ranges", ranges: [{ from: "09:00", to: index === 5 ? "15:00" : "19:00" }] })));
  const [saved, setSaved] = useState(false);
  const current = schedule[day];
  const updateDay = (change: Partial<DaySchedule>) => setSchedule(value => value.map((item, index) => index === day ? { ...item, ...change } : item));
  const updateRange = (index: number, key: "from" | "to", value: string) => updateDay({ ranges: current.ranges.map((range, rangeIndex) => rangeIndex === index ? { ...range, [key]: value } : range) });
  const invalidRanges = current.mode === "ranges" && current.ranges.some((range, index) => {
    if (!range.from || !range.to || range.from >= range.to) return true;
    return current.ranges.some((other, otherIndex) => otherIndex !== index && range.from < other.to && range.to > other.from);
  });
  return <section className="zs-schedule-editor">
    <header className="zs-schedule-title"><div>{antIcon(ClockCircleOutlined)}<span><h3>Horario de citas</h3><small>Disponibilidad del establecimiento y de cada prestador.</small></span></div><label>Horario de<select value={owner} onChange={event => setOwner(event.target.value)}><option>Faceup San Pedro · Establishment</option><option>Valeria González · User</option><option>Ricardo Acosta · Worker</option></select></label></header>
    {saved && <div className="zs-current-success">Horario guardado para {owner}</div>}
    <nav className="zs-day-tabs">{days.map((item, index) => <button className={day === index ? "active" : ""} onClick={() => setDay(index)} key={item}>{item}</button>)}</nav>
    <div className="zs-schedule-options">
      <label><input type="checkbox" checked={current.mode === "24h"} onChange={() => updateDay({ mode: current.mode === "24h" ? "ranges" : "24h" })}/> Disponible 24 hrs</label>
      <label><input type="checkbox" checked={current.mode === "unavailable"} onChange={() => updateDay({ mode: current.mode === "unavailable" ? "ranges" : "unavailable" })}/> No disponible</label>
    </div>
    <div className="zs-time-ranges">
      {current.mode === "ranges" && current.ranges.map((range, index) => <div className="zs-time-range" key={`${day}-${index}`}><label><input type="time" value={range.from} onChange={event => updateRange(index, "from", event.target.value)}/><span>→</span><input type="time" value={range.to} onChange={event => updateRange(index, "to", event.target.value)}/></label><button aria-label="Eliminar rango" disabled={current.ranges.length === 1} onClick={() => updateDay({ ranges: current.ranges.filter((_, rangeIndex) => rangeIndex !== index) })}>{antIcon(DeleteOutlined)}</button></div>)}
      {current.mode === "ranges" && <button className="zs-add-range" onClick={() => updateDay({ ranges: [...current.ranges, { from: "", to: "" }] })}>{antIcon(PlusOutlined)} Agregar rango</button>}
      {current.mode === "24h" && <p className="zs-schedule-state">{antIcon(ClockCircleOutlined)} Disponible de 00:00 a 23:59.</p>}
      {current.mode === "unavailable" && <p className="zs-schedule-state">No se ofrecerán citas este día.</p>}
    </div>
    {invalidRanges && <p className="zs-schedule-error">Corrige rangos vacíos, invertidos o superpuestos antes de guardar.</p>}
    <footer><button>Anterior</button><button className="zs-primary" disabled={invalidRanges} onClick={() => setSaved(true)}>Guardar</button></footer>
  </section>;
}

function Priority() {
  const [people, setPeople] = useState(["Valeria González · User", "Ricardo Acosta · Worker", "Daniela Salas · User", "Mónica Herrera · Worker"]);
  const move = (index: number, delta: number) => setPeople(current => { const next = [...current]; const target = index + delta; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next; });
  return <section className="zs-current-form-page"><header><div><h3>Prioridad de primer prestador disponible</h3><p>Sólo desempata entre Users y Workers elegibles por ubicación operativa y disponibles.</p></div><button className="zs-primary">Guardar</button></header><div className="zs-current-order-list">{people.map((person, index) => <div key={person}><strong>{index + 1}</strong><span><b>{person.split(" · ")[0]}</b><small>{person.split(" · ")[1]}</small></span><button disabled={index === 0} onClick={() => move(index, -1)}>↑</button><button disabled={index === people.length - 1} onClick={() => move(index, 1)}>↓</button></div>)}</div></section>;
}

function Blocks() {
  const [showForm, setShowForm] = useState(false);
  return <section className="zs-current-form-page"><header><div><h3>Bloqueos no recurrentes</h3><p>Excepciones por fecha y horario para Establishment, User, Worker o ubicación de servicio.</p></div><button onClick={() => setShowForm(true)}>{antIcon(PlusOutlined)} Nuevo bloqueo</button></header><div className="zs-current-admin-table zs-blocks-current"><div className="head"><b>Recurso</b><b>Tipo</b><b>Fecha</b><b>Horario</b><b>Motivo</b></div><div><span>Valeria González</span><span>User</span><span>28 ago 2026</span><span>13:00–15:00</span><span>Capacitación</span></div><div><span>Cabina 02</span><span>Ubicación de servicio</span><span>30 ago 2026</span><span>09:00–11:00</span><span>Mantenimiento</span></div></div>{showForm && <div className="zs-current-inline-editor"><label>Tipo<select><option>User</option><option>Worker</option><option>Establishment</option><option>Ubicación de servicio</option></select></label><label>Recurso<select><option>Ricardo Acosta</option><option>Valeria González</option><option>Cabina 01</option></select></label><label>Fecha<input type="date" defaultValue="2026-08-29"/></label><label>Desde<input type="time" defaultValue="13:00"/></label><label>Hasta<input type="time" defaultValue="14:00"/></label><label>Motivo<input defaultValue="Capacitación interna"/></label><footer><button onClick={() => setShowForm(false)}>Cancelar</button><button className="zs-primary" onClick={() => setShowForm(false)}>Guardar bloqueo</button></footer></div>}</section>;
}

function AppointmentRules({ onHelp }: { onHelp: (id: string) => void }) {
  return <section className="zs-current-form-page"><header><div><h3>Reglas de agenda</h3><p>Reglas explícitas del MVP para evitar combinaciones ambiguas.</p></div></header><div className="zs-rules-list"><article><b>Una cita, un prestador</b><span>Todos los servicios deben compartir al menos un User o Worker elegible.</span></article><article><b>Ejecución secuencial</b><span>Las duraciones se suman. El paralelismo no se ofrece en este MVP.</span></article><article><b>Una ubicación de servicio</b><span>La cabina elegida debe ser válida para todos los servicios; si ninguno requiere espacio físico se asigna General.</span></article><article><b>Buffers exteriores</b><span>Se aplican una vez antes y después; las transiciones internas forman parte de la duración adicional.</span></article></div><button className="zs-outline-action" onClick={() => onHelp("duration")}>Ver apoyo de duración</button></section>;
}

function NotificationSettings({ onHelp }: { onHelp: (id: string) => void }) {
  const [second, setSecond] = useState(true);
  const [saved, setSaved] = useState(false);
  return <div className="zs-current-admin-content"><section className="zs-current-form-page"><header><div><h3>Recordatorios de citas</h3><p>Extensión del módulo actual de notificaciones; correo y WhatsApp permanecen sujetos a validación técnica.</p></div><button className="zs-primary" onClick={() => setSaved(true)}>Guardar</button></header>{saved && <div className="zs-current-success">Configuración guardada en el dummy.</div>}<div className="zs-notification-form"><fieldset><legend>Primer recordatorio</legend><label>Anticipación<input value="24 horas antes" readOnly/></label><Channel name="Correo cliente" initial/><Channel name="WhatsApp cliente" initial/><Channel name="Correo prestador" initial/><Channel name="WhatsApp prestador"/></fieldset><fieldset><legend>Segundo recordatorio</legend><Toggle checked={second} onChange={setSecond} label={second ? "Activo" : "Inactivo"}/><label>Anticipación<select disabled={!second} defaultValue="4"><option value="4">4 horas antes</option><option value="2">2 horas antes</option><option value="1">1 hora antes</option></select></label><Channel name="Correo cliente" initial={second}/><Channel name="WhatsApp cliente" initial={second}/><Channel name="Correo prestador"/><Channel name="WhatsApp prestador"/></fieldset></div><p className="zs-current-footnote"><button onClick={() => onHelp("reminder")}>ⓘ</button> Scheduling, plantillas, destinatarios, reintentos y entrega real siguen pendientes de validación técnica.</p></section></div>;
}

function Channel({ name, initial = false }: { name: string; initial?: boolean }) {
  const [checked, setChecked] = useState(initial);
  return <Toggle checked={checked} onChange={setChecked} label={name}/>;
}
