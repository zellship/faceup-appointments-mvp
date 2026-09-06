import React from "react";
import type { EvidenceKind } from "./domain";
import { helpContent } from "./domain";

export function Evidence({ kind, children }: { kind: EvidenceKind; children?: React.ReactNode }) {
  const labels: Record<EvidenceKind, string> = { "as-is": "As-Is confirmado", "to-be": "To-Be propuesto", pending: "Pendiente técnico" };
  return <span className={`zs-evidence ${kind}`}>{children ?? labels[kind]}</span>;
}

export function Help({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  return <button className="zs-help" aria-label={`Abrir apoyo: ${helpContent[id]?.title ?? id}`} onClick={(event) => { event.stopPropagation(); onOpen(id); }}>i</button>;
}

export function ContextPanel({ id, onClose }: { id: string | null; onClose: () => void }) {
  if (!id || !helpContent[id]) return null;
  const item = helpContent[id];
  return <div className="zs-context-layer" role="presentation" onMouseDown={onClose}>
    <aside className="zs-context-panel" role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={(event) => event.stopPropagation()}>
      <header><div><Evidence kind={item.kind} /><h2>{item.title}</h2></div><button className="zs-icon" onClick={onClose} aria-label="Cerrar apoyo">×</button></header>
      <p>{item.body}</p>
      {item.tech && <div className="zs-tech"><span>Entidad real</span><code>{item.tech}</code></div>}
    </aside>
  </div>;
}

export function Modal({ title, eyebrow, children, onClose, className = "" }: { title: string; eyebrow?: string; children: React.ReactNode; onClose: () => void; className?: string }) {
  return <div className="zs-modal-layer" role="presentation" onMouseDown={onClose}>
    <section className={`zs-modal ${className}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
      <header>{<div>{eyebrow && <span className="zs-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>}<button className="zs-icon" onClick={onClose} aria-label="Cerrar">×</button></header>
      {children}
    </section>
  </div>;
}

export function Status({ status }: { status: string }) {
  const label: Record<string, string> = { scheduled: "Programada", confirmed: "Confirmada", canceled: "Cancelada", completed: "Completada", reserved: "Reservada", open: "Abierta" };
  return <span className={`zs-status ${status}`}>{label[status] ?? status}</span>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return <button type="button" className={`zs-toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><span /><b>{label}</b></button>;
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div className="zs-empty-note">{children}</div>;
}
