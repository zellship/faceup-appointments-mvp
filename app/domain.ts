export type Surface = "MVP" | "POS" | "ADMIN" | "JOURNEYS" | "INSPECT";
export type AppointmentStatus = "scheduled" | "confirmed" | "canceled" | "completed";
export type AccountStatus = "reserved" | "open" | "close";
export type CommandItemStatus = "reserved" | "in_progress" | "completed" | "canceled";
export type InventoryStatus = "not_applicable" | "held" | "consumed" | "released";
export type EvidenceKind = "as-is" | "to-be" | "pending";

export type PaymentContributionRecord = {
  id: string;
  amount: number;
  method: "Efectivo" | "TDC" | "TDD" | "Transferencia" | "Otros";
  createdAt: string;
};

export type AccountServiceRecord = {
  appointmentId: string;
  commandId: string;
  commandItemId: string;
  offer: string;
  offerKind: "Servicio" | "Kit";
  provider: string;
  providerKind: "User" | "Worker";
  operativeLocation: string;
  location: string;
  date: string;
  time: string;
  endTime: string;
  status: AppointmentStatus;
  commandItemStatus: CommandItemStatus;
  price: number;
  inventoryStatus: InventoryStatus;
  bufferBefore: number;
  bufferAfter: number;
};

export type AppointmentRecord = {
  id: string;
  accountId: string;
  accountOrigin: "new" | "existing";
  commandId: string;
  commandItemId: string;
  client: string;
  offer: string;
  offerKind: "Servicio" | "Kit";
  provider: string;
  providerKind: "User" | "Worker";
  operativeLocation: string;
  location: string;
  date: string;
  time: string;
  endTime: string;
  occupied: string;
  status: AppointmentStatus;
  accountStatus: AccountStatus;
  price: number;
  paymentContributions: PaymentContributionRecord[];
  inventoryHeld: boolean;
  noShowLogged: boolean;
  events: string[];
  accountServices: AccountServiceRecord[];
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
  accountOrigin: "new",
  commandId: "CMD-2026-0184",
  commandItemId: "CI-2026-0184",
  client: "Sofía Martínez",
  offer: "Hydrafacial Premium",
  offerKind: "Kit",
  provider: "Valeria González",
  providerKind: "User",
  operativeLocation: "Cabinas Faceup",
  location: "Cabina 02",
  date: "25 ago 2026",
  time: "11:30",
  endTime: "12:50",
  occupied: "11:20–13:00",
  status: "scheduled",
  accountStatus: "reserved",
  price: 2130,
  paymentContributions: [],
  inventoryHeld: true,
  noShowLogged: false,
  events: ["Cita creada · hoy, 09:42", "Cuenta reservada generada · CTA-03184"],
  accountServices: [{
    appointmentId: "CITA-2026-0184",
    commandId: "CMD-2026-0184",
    commandItemId: "CI-2026-0184",
    offer: "Hydrafacial Premium",
    offerKind: "Kit",
    provider: "Valeria González",
    providerKind: "User",
    operativeLocation: "Cabinas Faceup",
    location: "Cabina 02",
    date: "25 ago 2026",
    time: "11:30",
    endTime: "12:50",
    status: "scheduled",
    commandItemStatus: "reserved",
    price: 2130,
    inventoryStatus: "held",
    bufferBefore: 10,
    bufferAfter: 10,
  }],
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
  { id: "R-01", title: "Servicio simple", description: "Selecciona Servicio, prestador específico, cabina y horario; registra la cita.", surface: "POS", screen: "booking", scenario: "simple", issue: "ZEL-2768 · ZEL-2769" },
  { id: "R-02", title: "Kit configurable", description: "Selecciona Kit, agrega componentes y registra con retención aplicable.", surface: "POS", screen: "booking", scenario: "mix", issue: "ZEL-2767 · ZEL-2768" },
  { id: "R-03", title: "Primer prestador", description: "Selecciona Primer prestador disponible y valida la resolución por prioridad.", surface: "POS", screen: "booking", scenario: "first", issue: "ZEL-2767 · ZEL-2769" },
  { id: "R-04", title: "Ubicación General", description: "Selecciona un servicio sin ubicación física y verifica la asignación General.", surface: "POS", screen: "booking", scenario: "general", issue: "ZEL-2766 · ZEL-2769" },
  { id: "R-05", title: "Concurrencia", description: "Completa una cita válida; al registrar se simula la ocupación concurrente.", surface: "POS", screen: "booking", scenario: "concurrency", issue: "ZEL-2768 · ZEL-2769" },
  { id: "R-06", title: "Reprogramación exitosa", description: "Define un intervalo disponible y confirma conservando la misma cita y cuenta.", surface: "POS", screen: "reschedule", scenario: "reschedule-ok", issue: "ZEL-2769" },
  { id: "R-07", title: "Reprogramación fallida", description: "Define un intervalo válido; al confirmar se simula un conflicto concurrente.", surface: "POS", screen: "reschedule", scenario: "reschedule-fail", issue: "ZEL-2769" },
  { id: "R-08", title: "Registrar llegada", description: "Confirma la cita y después registra la llegada para abrir la Cuenta.", surface: "POS", screen: "detail", scenario: "arrival", issue: "ZEL-2769" },
  { id: "R-09", title: "Cancelar", description: "Selecciona Cancelar y confirma la liberación de recursos y retención.", surface: "POS", screen: "detail", scenario: "cancel", issue: "ZEL-2769" },
  { id: "R-10", title: "No-show", description: "Registra no-show y revisa las opciones posteriores sin crear otro estado.", surface: "POS", screen: "detail", scenario: "no-show", issue: "ZEL-2769" },
  { id: "R-11", title: "Completar", description: "Completa la cita y verifica que la Cuenta no se cierre automáticamente.", surface: "POS", screen: "detail", scenario: "complete", issue: "ZEL-2769" },
  { id: "R-12", title: "Experiencia móvil", description: "Alterna Día/Mes y abre Programar cita para completar el flujo móvil.", surface: "POS", screen: "mobile", scenario: "mobile", issue: "ZEL-2770" },
  { id: "R-13", title: "Dos citas, una Cuenta", description: "Agrega otro servicio a la misma Cuenta con cita, prestador y ubicación independientes, sin traslapar intervalos.", surface: "POS", screen: "booking", scenario: "multi-account", issue: "ZEL-2768 · ZEL-2769" },
];

export const helpContent: Record<string, { title: string; kind: EvidenceKind; body: string; tech?: string }> = {
  appointment: { title: "Cita", kind: "as-is", body: "La Agenda y Appointment existen. El MVP amplía su operación y disponibilidad.", tech: "Appointment · appointments" },
  account: { title: "Cuenta de la visita", kind: "to-be", body: "Una cita puede crear una Account reservada o agregarse a una Account elegible de la misma visita. Cada servicio conserva su propia cita, Command y Command Item. La Cuenta abierta sólo se cierra cuando todos los Command Items están resueltos, no hay inventario retenido y el balance está liquidado.", tech: "Account · Commands · Command Items · Appointments · Payment Contributions" },
  consumption: { title: "Consumo", kind: "as-is", body: "Se conserva el enum global actual. Define qué ubicaciones de servicio pueden participar en este flujo sin relacionar Product o Mix directamente con ellas.", tech: "SERVICE_TYPE.InPlace = 'consumo' · Service Type ↔ Service Location" },
  provider: { title: "Prestador", kind: "to-be", body: "Puede ser User, Worker o resolverse como primer prestador disponible.", tech: "User · users / Worker · workers" },
  identity: { title: "Identidad compartida", kind: "pending", body: "TI debe definir cómo detectar que un User y un Worker representan a la misma persona." },
  location: { title: "Cabina", kind: "to-be", body: "Es el Service Location físico reservado por cada cita. Una misma Account puede reunir citas con cabinas distintas.", tech: "Appointment · Service Location · service_locations" },
  general: { title: "Ubicación General", kind: "to-be", body: "Se asigna automáticamente cuando el servicio no requiere recurso físico y no aparece entre las cabinas.", tech: "Service Location de sistema" },
  capacity: { title: "Capacidad", kind: "to-be", body: "Se reutiliza la capacidad actual como máximo de ocupaciones simultáneas de la ubicación. En Agenda, cada cita consume una unidad durante su duración y buffers.", tech: "service_locations.capacity" },
  offer: { title: "Servicio o Kit", kind: "to-be", body: "Product es el servicio simple; Mix es el kit configurable. No se relacionan directamente con Service Location.", tech: "Product · products / Mix · mixes" },
  duration: { title: "Duración ocupada", kind: "to-be", body: "Incluye duración base, adicionales y buffers antes/después. Mix reutiliza handlingTime. En el MVP, las citas de una misma Cuenta son secuenciales y no pueden traslaparse." },
  inventory: { title: "Retención aplicable", kind: "as-is", body: "El flujo actual de Command/Command Item retiene inventario. Sólo aplica a componentes que lo requieren." },
  concurrency: { title: "Concurrencia", kind: "pending", body: "El dummy demuestra el resultado funcional; TI define transacciones y restricciones." },
  reminder: { title: "Recordatorios", kind: "pending", body: "El primero ocurre 24 horas antes y el segundo es configurable. Email y WhatsApp requieren validación técnica." },
};

export const money = (value: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);
