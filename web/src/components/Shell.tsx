import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { api } from "../api";
import * as I from "./Icons";

function Item({ to, icon, children, disabled }: { to: string; icon: JSX.Element; children: string; disabled?: boolean }) {
  return (
    <NavLink to={to} end className={({ isActive }) => `nav-item${isActive ? " active" : ""}${disabled ? " disabled" : ""}`}>
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}

export function Shell() {
  const { runId } = useParams();
  const runs = useQuery({ queryKey: ["runs"], queryFn: api.runs });
  const fallback = runs.data?.find((r) => r.status === "done")?.id;
  const id = runId ?? fallback;
  const run = useQuery({ queryKey: ["run", id], queryFn: () => api.run(id!), enabled: !!id, refetchInterval: (q) => (q.state.data?.status === "running" ? 2000 : false) });
  const status = useQuery({ queryKey: ["status"], queryFn: api.status, staleTime: 60_000 });
  const r = run.data;

  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Main navigation">
        <NavLink to="/" className="brand" aria-label="Flame home">
          <I.Flame /> Flame
        </NavLink>
        <div className="nav-group">
          <div className="nav-label">Analyse</div>
          <Item to="/new" icon={<I.Plus />}>New analysis</Item>
          <Item to="/runs" icon={<I.Clock />}>Runs</Item>
        </div>
        <div className="nav-group">
          <div className="nav-label">Results</div>
          <Item to={id ? `/runs/${id}` : "/runs"} icon={<I.List />} disabled={!id}>Requirements</Item>
          <Item to={id ? `/runs/${id}/profile` : "/runs"} icon={<I.Cube />} disabled={!id}>Product profile</Item>
        </div>
        <div className="nav-group">
          <div className="nav-label">Explore</div>
          <Item to={id ? `/runs/${id}/ask` : "/runs"} icon={<I.Chat />} disabled={!id}>Ask</Item>
          <Item to={id ? `/runs/${id}/graph` : "/runs"} icon={<I.Graph />} disabled={!id}>Graph: structure</Item>
          <Item to={id ? `/runs/${id}/graph/meaning` : "/runs"} icon={<I.Spark />} disabled={!id}>Graph: meaning</Item>
        </div>
        <div className="sidebar-foot">
          {status.data && (
            <>
              Model {status.data.model ? "connected" : "not configured"} · Voice {status.data.voice ? "on" : "off"}
            </>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="statusbar">
          {r ? (
            <>
              <span className={`status-dot ${r.status === "running" ? "live" : r.status === "done" ? "ok" : r.status === "failed" ? "bad" : ""}`} aria-hidden />
              <span className="run-title">{r.title}</span>
              <span className="muted detail">
                {r.status === "running"
                  ? `Running · ${r.stages.find((s) => s.status === "running")?.label ?? "starting"}`
                  : r.status === "done"
                    ? `Complete · ${r.counts.requirements ?? 0} requirements from ${r.counts.regulations ?? 0} regulations`
                    : r.status === "failed"
                      ? "Failed"
                      : "Queued"}
                {r.cost_usd > 0 && ` · $${r.cost_usd.toFixed(2)}`}
              </span>
              <span className="spacer" />
              {r.status === "done" && (
                <a className="btn btn-ghost btn-sm export" href={`/api/runs/${r.id}/export?format=csv`}>
                  <I.Download size={16} /> CSV
                </a>
              )}
              {r.status === "done" && (
                <a className="btn btn-ghost btn-sm export" href={`/api/runs/${r.id}/export`}>
                  <I.Download size={16} /> submission.json
                </a>
              )}
            </>
          ) : (
            <span className="muted">No analysis open</span>
          )}
        </header>
        <Outlet />
      </div>
    </div>
  );
}
