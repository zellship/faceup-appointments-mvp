export type Surface = "MVP" | "POS" | "ADMIN" | "JOURNEYS" | "INSPECT";
export type AppointmentStatus = "scheduled" | "confirmed" | "canceled" | "completed";
export type AccountStatus = "reserved" | "open";
export type EvidenceKind = "as-is" | "to-be" | "pending";

export type AppointmentRecord = {
  id: string;
  accountId: string;
  client: string;
  offer: string;
  offerKind: "Servicio" | "Kit";
  provider: string;
  providerKind: "User" | "Worker";
  location: string;
  date: string;
  time: string;
  endTime: string;
  occupied: string;
  status: AppointmentStatus;
  accountStatus: AccountStatus;
  price: number;
  inventoryHeld: boolean;
  noShowLogged: boolean;
  events: string[];
};

export type Journey = {
  id: string;
  title: string;
  description: string;
  surface: Surface;
  screen: string;
  scenario: string;
  issue: string;
};

export const initialAppointment: AppointmentRecord = {
  id: "CITA-2026-0184",
  accountId: "CTA-03184",
  client: "Sofía Martínez",
  offer: "Hydrafacial Premium",
  offerKind: "Kit",
  provider: "Valeria González",
  providerKind: "User",
  location: "Cabina 02",
  date: "25 ago 2026",
  time: "11:30",
  endTime: "12:50",
  occupied: "11:20–13:00",
  status: "scheduled",
  accountStatus: "reserved",
  price: 2130,
  inventoryHeld: true,
  noShowLogged: false,
  events: ["Cita creada · hoy, 09:42", "Cuenta reservada generada · CTA-03184"],
};

export const agendaAppointments: AppointmentRecord[] = [
  initialAppointment,
  {
    ...initialAppointment,
    id: "CITA-2026-0185",
    accountId: "CTA-03185",
    client: "Mariana Ríos",
    offer: "Valoración facial",
    offerKind: "Servicio",
    provider: "Ricardo Acosta",
    providerKind: "Worker",
    location: "General",
    time: "14:00",
    endTime: "14:30",
    occupied: "13:50–14:40",
    status: "confirmed",
    price: 850,
    inventoryHeld: false,
    events: ["Cita creada · ayer, 16:15", "Cita confirmada · hoy, 08:30"],
  },
  {
    ...initialAppointment,
    id: "CITA-2026-0186",
    accountId: "CTA-03186",
    client: "Fernanda Cruz",
    offer: "Limpieza profunda",
    provider: "Daniela Salas",
    providerKind: "User",
    location: "Cabina 01",
    time: "09:00",
    endTime: "10:00",
    occupied: "08:50–10:10",
    status: "completed",
    accountStatus: "open",
    price: 1250,
    inventoryHeld: false,
    events: ["Cita creada · 24 ago", "Llegada registrada · 08:57", "Cita completada · 10:04"],
  },
  {
    ...initialAppointment,
    id: "CITA-2026-0187",
    accountId: "CTA-03187",
    client: "Laura Gómez",
    offer: "Terapia LED",
    provider: "Mónica Herrera",
    providerKind: "Worker",
    location: "Cabina 03",
    time: "16:30",
    endTime: "17:10",
    occupied: "16:20–17:20",
    status: "canceled",
    price: 650,
    inventoryHeld: false,
    events: ["Cita creada · 23 ago", "Cita cancelada · 24 ago"],
  },
];

export const journeys: Journey[] = [
  { id: "R-01", title: "Servicio simple", description: "Cabina y prestador específico.", surface: "POS", screen: "booking", scenario: "simple", issue: "ZEL-2768 · ZEL-2769" },
  { id: "R-02", title: "Kit configurable", description: "Duración adicional y retención aplicable.", surface: "POS", screen: "booking", scenario: "mix", issue: "ZEL-2767 · ZEL-2768" },
  { id: "R-03", title: "Primer prestador", description: "Resolución por disponibilidad y prioridad.", surface: "POS", screen: "booking", scenario: "first", issue: "ZEL-2767 · ZEL-2769" },
  { id: "R-04", title: "Ubicación General", description: "Servicio sin recurso físico.", surface: "POS", screen: "booking", scenario: "general", issue: "ZEL-2766 · ZEL-2769" },
  { id: "R-05", title: "Concurrencia", description: "Conflicto detectado al guardar.", surface: "POS", screen: "booking", scenario: "concurrency", issue: "ZEL-2768 · ZEL-2769" },
  { id: "R-06", title: "Reprogramación exitosa", description: "Mismos IDs, nuevo intervalo reservado.", surface: "POS", screen: "reschedule", scenario: "reschedule-ok", issue: "ZEL-2769" },
  { id: "R-07", title: "Reprogramación fallida", description: "La reserva original se conserva.", surface: "POS", screen: "reschedule", scenario: "reschedule-fail", issue: "ZEL-2769" },
  { id: "R-08", title: "Registrar llegada", description: "Appointment confirmado y Account abierta.", surface: "POS", screen: "detail", scenario: "arrival", issue: "ZEL-2769" },
  { id: "R-09", title: "Cancelar", description: "Libera recursos y retención aplicable.", surface: "POS", screen: "detail", scenario: "cancel", issue: "ZEL-2769" },
  { id: "R-10", title: "No-show", description: "Evento operativo con opciones posteriores.", surface: "POS", screen: "detail", scenario: "no-show", issue: "ZEL-2769" },
  { id: "R-11", title: "Completar", description: "La Account no se cierra automáticamente.", surface: "POS", screen: "detail", scenario: "complete", issue: "ZEL-2769" },
  { id: "R-12", title: "Experiencia móvil", description: "Día, Mes y alta completa con scroll.", surface: "POS", screen: "mobile", scenario: "mobile", issue: "ZEL-2770" },
];

export const helpContent: Record<string, { title: string; kind: EvidenceKind; body: string; tech?: string }> = {
  appointment: { title: "Cita", kind: "as-is", body: "La Agenda y Appointment existen. El MVP amplía su operación y disponibilidad.", tech: "Appointment · appointments" },
  account: { title: "Cuenta reservada", kind: "to-be", body: "Cada cita nueva crea una Account nueva en reserved; no se elige una existente.", tech: "Account · accounts · appointment_accounts" },
  consumption: { title: "Consumo", kind: "as-is", body: "Se conserva el enum global actual. Agenda no modifica su semántica.", tech: "SERVICE_TYPE.InPlace = 'consumo'" },
  provider: { title: "Prestador", kind: "to-be", body: "Puede ser User, Worker o resolverse como primer prestador disponible.", tech: "User · users / Worker · workers" },
  identity: { title: "Identidad compartida", kind: "pending", body: "TI debe definir cómo detectar que un User y un Worker representan a la misma persona." },
  location: { title: "Cabina", kind: "to-be", body: "Es un Service Location físico habilitado para citas. Appointment, Account y Command comparten la ubicación.", tech: "Service Location · service_locations" },
  general: { title: "Ubicación General", kind: "to-be", body: "Se asigna automáticamente cuando el servicio no requiere recurso físico y no aparece entre las cabinas.", tech: "Service Location de sistema" },
  capacity: { title: "Capacidad de citas", kind: "pending", body: "Es independiente de la capacidad comercial actual. TI definirá su representación técnica." },
  offer: { title: "Servicio o Kit", kind: "to-be", body: "Product es el servicio simple; Mix es el kit configurable. No se relacionan directamente con Service Location.", tech: "Product · products / Mix · mixes" },
  duration: { title: "Duración ocupada", kind: "to-be", body: "Incluye duración base, adicionales y buffers antes/después. Mix reutiliza handlingTime." },
  inventory: { title: "Retención aplicable", kind: "as-is", body: "El flujo actual de Command/Command Item retiene inventario. Sólo aplica a componentes que lo requieren." },
  concurrency: { title: "Concurrencia", kind: "pending", body: "El dummy demuestra el resultado funcional; TI define transacciones y restricciones." },
  reminder: { title: "Recordatorios", kind: "pending", body: "El primero ocurre 24 horas antes y el segundo es configurable. Email y WhatsApp requieren validación técnica." },
};

export const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
