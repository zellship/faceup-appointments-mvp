"use client";

import React, { useEffect, useMemo, useState } from "react";
import "./mvp.css";
import { AdminView } from "./AdminViews";
import { InspectionView, JourneysView, ScopeView } from "./MvpViews";
import { AccountView, AgendaView, BookingView, DetailView, MobileAgendaView, RescheduleView, ResultView } from "./PosViews";
import { initialAppointment, type AppointmentRecord, type Journey, type Surface } from "./domain";
import { ContextPanel } from "./ui";

const mainNav: { id: Surface; label: string }[] = [
  { id: "MVP", label: "Alcance MVP" },
  { id: "POS", label: "POS" },
  { id: "ADMIN", label: "Admin" },
  { id: "JOURNEYS", label: "Recorridos críticos" },
  { id: "INSPECT", label: "Inspección del requerimiento" },
];

const posNav = [
  ["agenda", "Agenda escritorio"],
  ["mobile", "Agenda móvil"],
  ["booking", "Programar cita"],
  ["detail", "Detalle y operación"],
];

export default function Home() {
  const [surface, setSurface] = useState<Surface>("MVP");
  const [screen, setScreen] = useState("scope");
  const [scenario, setScenario] = useState<string>();
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [help, setHelp] = useState<string | null>(null);
  const [contractMenu, setContractMenu] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentRecord>(initialAppointment);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHelp(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigate = (nextScreen: string, nextScenario?: string) => {
    setHelp(null);
    setScreen(nextScreen);
    setScenario(nextScenario);
  };

  const chooseSurface = (next: Surface) => {
    setSurface(next);
    setContractMenu(false);
    setHelp(null);
    setScenario(undefined);
    setActiveJourney(null);
    setScreen(next === "POS" ? "agenda" : next === "ADMIN" ? "admin" : next === "MVP" ? "scope" : next === "JOURNEYS" ? "journeys" : "inspect");
  };

  const runJourney = (journey: Journey) => {
    setActiveJourney(journey);
    setSurface(journey.surface);
    setScreen(journey.screen);
    setScenario(journey.scenario);
    setHelp(null);
  };

  const view = useMemo(() => {
    const shared = { appointment, setAppointment, onNavigate: navigate, onHelp: setHelp, scenario };
    if (surface === "MVP") return <ScopeView onHelp={setHelp} />;
    if (surface === "JOURNEYS") return <JourneysView onRun={runJourney} />;
    if (surface === "INSPECT") return <InspectionView onHelp={setHelp} />;
    if (surface === "ADMIN") {
      const journeyAdmin = scenario === "availability" ? { initialSpace: "resources" as const, initialSection: "establishment" } : scenario === "eligibility" ? { initialSpace: "offers" as const, initialSection: "eligibility" } : scenario === "reminders" ? { initialSpace: "reminders" as const } : {};
      return <AdminView key={`${scenario ?? "admin"}`} onHelp={setHelp} {...journeyAdmin} />;
    }
    if (screen === "mobile") return <MobileAgendaView {...shared} />;
    if (screen === "booking") return <BookingView {...shared} />;
    if (screen === "result") return <ResultView {...shared} />;
    if (screen === "detail") return <DetailView {...shared} />;
    if (screen === "reschedule") return <RescheduleView {...shared} />;
    if (screen === "account") return <AccountView {...shared} />;
    return <AgendaView {...shared} />;
  }, [surface, screen, scenario, appointment]);

  return <div className="zs-app" onClick={() => help && setHelp(null)}>
    <header className="zs-review-header">
      <div className="zs-brand"><span>Z</span><div><small>Contrato visual MVP</small><b>Faceup · Citas en Zellship</b></div></div>
      <button className="zs-contract-toggle" aria-label="Abrir navegación del contrato visual" aria-expanded={contractMenu} onClick={(event)=>{event.stopPropagation();setContractMenu(open=>!open)}}>☰</button>
      <nav className={contractMenu?"open":""}>{mainNav.map(item => <button key={item.id} className={surface === item.id ? "active" : ""} onClick={(event) => { event.stopPropagation(); chooseSurface(item.id); }}>{item.label}</button>)}</nav>
      <div className="zs-scope-state"><i/>POS + ADMIN</div>
    </header>
    <section className="zs-context-bar"><div><b>Ruta 1 congelada</b><span>Consumo As-Is · POS + Admin · Appointment Location retirado</span></div><div><span className="as-is">As-Is</span><span className="to-be">To-Be</span><span className="pending">Pendiente técnico</span></div></section>
    {activeJourney && <section className="zs-active-journey"><span>{activeJourney.id}</span><div><b>{activeJourney.title}</b><small>{activeJourney.description} · {activeJourney.issue}</small></div><button onClick={() => { setActiveJourney(null); setScenario(undefined); }}>×</button></section>}
    {surface === "POS" && <nav className="zs-screen-nav">{posNav.map(([id,label]) => <button key={id} className={screen === id || (id === "detail" && ["result","reschedule","account"].includes(screen)) ? "active" : ""} onClick={() => navigate(id)}>{label}</button>)}</nav>}
    <section className="zs-canvas">{view}</section>
    <footer className="zs-review-footer"><span>Datos simulados · contrato funcional, no implementación productiva</span><span>Ruta 1 · ZEL-2766—ZEL-2770</span></footer>
    <ContextPanel id={help} onClose={() => setHelp(null)} />
  </div>;
}
