import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../api";

export function Profile() {
  const { runId } = useParams();
  const data = useQuery({ queryKey: ["profile", runId], queryFn: () => api.profile(runId!) });
  const p = data.data?.profile;
  const regs = data.data?.regulations;
  const drawing = data.data?.inputs.find((n) => /^exploded_view\.(png|jpe?g)$/i.test(n));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Product profile</h1>
          <p>What Flame understood from the specification and drawing, and why each regulation was chosen or left out.</p>
        </div>
      </div>
      {data.isLoading && <div className="skeleton" style={{ height: 300 }} />}
      {data.isError && <div className="notice warn">{(data.error as Error).message}</div>}
      {p && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 32 }}>
          <div className="card">
            <div className="small muted">Product</div>
            <h2 style={{ fontSize: "var(--t-20)", marginTop: 4 }}>{p.product_name}</h2>
            <p className="muted" style={{ marginTop: 6 }}>{p.product_type}</p>
            <dl style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "8px 12px", marginTop: 16 }}>
              <dt className="muted">Vehicle categories</dt>
              <dd style={{ margin: 0 }}>{p.vehicle_categories.join(", ")}</dd>
              <dt className="muted">Mounted</dt>
              <dd style={{ margin: 0 }}>{p.mounting_location}</dd>
              <dt className="muted">Electronics</dt>
              <dd style={{ margin: 0 }}>{p.electronics.join("; ") || "none"}</dd>
            </dl>
          </div>
          {drawing && (
            <div className="card" style={{ display: "grid", placeItems: "center" }}>
              <img src={`/api/runs/${runId}/input/${drawing}`} alt="Exploded-view drawing of the part" style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain" }} />
            </div>
          )}
          <div className="card">
            <div className="small muted">Functions</div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {p.functions.map((f) => (
                <li key={f.name} style={{ marginBottom: 6 }}>
                  <b style={{ fontWeight: 500 }}>{f.name}</b>
                  <div className="small muted">{f.description}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <div className="small muted">Parts</div>
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              {p.parts.map((x) => (
                <li key={x.name} style={{ marginBottom: 6 }}>
                  <b style={{ fontWeight: 500 }}>{x.name}</b> <span className="muted">{x.material}</span>
                  <div className="small muted">{x.role}</div>
                </li>
              ))}
            </ul>
          </div>
          {(p.drawing_observations.length > 0 || p.uncertainties.length > 0) && (
            <div className="card">
              {p.drawing_observations.length > 0 && (
                <>
                  <div className="small muted">Seen only in the drawing</div>
                  <ul style={{ margin: "8px 0 12px", paddingLeft: 18 }}>
                    {p.drawing_observations.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
              {p.uncertainties.length > 0 && (
                <>
                  <div className="small muted">Assumed or unclear</div>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                    {p.uncertainties.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {regs && regs.rows.length > 0 && (
        <>
          <h2 style={{ fontSize: "var(--t-20)", marginBottom: 12 }}>Regulations considered</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Regulation</th>
                <th>Decision</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {regs.rows.map((r) => (
                <tr key={r.regulation}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <b style={{ fontWeight: 500 }}>{r.regulation}</b>
                    <div className="small muted">{r.title}</div>
                  </td>
                  <td>{r.selected ? <span className="chip" style={{ background: "var(--ink)", color: "var(--surface)" }}>Applies</span> : r.superseded_by ? `Replaced by ${r.superseded_by}` : "Not applicable"}</td>
                  <td className="muted">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
