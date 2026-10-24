// Typed access to the Flame backend (app/main.py). Shapes follow docs/ui/LLD.md §2.

export type Stage = { key: string; label: string; status: "pending" | "running" | "done" | "failed"; detail: string; seconds: number | null };

export type Run = {
  id: string;
  title: string;
  created: string;
  status: "queued" | "running" | "done" | "failed";
  stage: string | null;
  preloaded: boolean;
  error: string | null;
  cost_usd: number;
  counts: { requirements?: number; regulations?: number };
  stages: Stage[];
};

export type Source = { regulation: string; version: string; page: number; paragraph?: string };

export type Requirement = {
  id: string;
  priority: number;
  text: string;
  summary: string;
  source: Source;
  node: string | null;
  severity: 1 | 2 | 3 | 4 | 5;
  severity_label: string;
  severity_reason: string;
  phase: 1 | 2 | 3 | 4 | 5;
  phase_label: string;
  phase_reason: string;
  rated_by: "model" | "rules";
  applies_to?: string | null;
  test_case?: string | null;
  kind?: string | null;
  regulation_title?: string;
};

export type Box = { page: number; bbox: [number, number, number, number] };

export type Paragraph = {
  node: string;
  regulation: string;
  version: string;
  role: string;
  label: string;
  section: string;
  pages: number[];
  text: string;
  boxes: Box[];
  pdf: string | null;
  pdf_sha256: string | null;
  title: string;
  definitions: { term: string; node: string; label: string }[];
  references: { node: string; label: string; regulation: string }[];
};

export type Citation = { tag: string; node: string; regulation: string; version: string; label: string; page: number };

export type AskFinal = { answer: string; spoken: string; citations: Citation[]; not_in_sources: boolean; offline?: boolean };

export type GraphNode = {
  id: string;
  kind: "regulation" | "section" | "paragraph";
  label: string;
  regulation: string;
  title?: string;
  page?: number;
  x: number;
  y: number;
  requirement_ids?: string[];
  severity?: number;
  phase?: number;
  summaries?: string[];
  priority?: number;
  excerpt?: string;
};
export type GraphEdge = { source: string; target: string; kind: "child" | "refers" | "cites_reg" | "similar"; weight?: number };
export type GraphPayload = { view: string; regulations: string[]; nodes: GraphNode[]; edges: GraphEdge[]; centroids?: Record<string, [number, number]> };

export type Profile = {
  profile: null | {
    product_name: string;
    product_type: string;
    vehicle_categories: string[];
    mounting_location: string;
    functions: { name: string; description: string }[];
    parts: { name: string; role: string; material: string; electrical: boolean }[];
    electronics: string[];
    vehicle_interfaces: string[];
    drawing_observations: string[];
    uncertainties: string[];
  };
  regulations: { selected: string[]; rows: { regulation: string; title: string; selected: boolean; superseded_by: string | null; reason: string }[] };
  inputs: string[];
};

export type Status = { model: boolean; voice: boolean; busy: string | null };

export class ApiError extends Error {}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body?.error?.message ?? message;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  status: () => fetch("/api/status").then((r) => json<Status>(r)),
  runs: () => fetch("/api/runs").then((r) => json<Run[]>(r)),
  run: (id: string) => fetch(`/api/runs/${id}`).then((r) => json<Run>(r)),
  requirements: (id: string) => fetch(`/api/runs/${id}/requirements`).then((r) => json<Requirement[]>(r)),
  profile: (id: string) => fetch(`/api/runs/${id}/profile`).then((r) => json<Profile>(r)),
  paragraph: (node: string) => fetch(`/api/paragraphs/${encodeURIComponent(node)}`).then((r) => json<Paragraph>(r)),
  graph: (id: string, view: "structure" | "meaning") => fetch(`/api/runs/${id}/graph?view=${view}`).then((r) => json<GraphPayload>(r)),
  graphChat: (id: string, question: string, selection: string | null) =>
    fetch(`/api/runs/${id}/graph/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, selection }),
    }).then((r) => json<{ answer: string; highlight: string[]; focus: string | null; offline?: boolean }>(r)),
  createRun: (form: FormData) => fetch("/api/runs", { method: "POST", body: form }).then((r) => json<Run>(r)),
  transcribe: (audio: Blob, runId: string) => {
    const form = new FormData();
    form.append("audio", audio, audio.type.includes("mp4") ? "question.mp4" : "question.webm");
    form.append("run_id", runId);
    return fetch("/api/voice/stt", { method: "POST", body: form }).then((r) => json<{ text: string }>(r));
  },
};

/** Parse a Server-Sent Events stream from a fetch response (used for POST /ask, which EventSource can't send). */
export async function* sse(res: Response): AsyncGenerator<{ event: string; data: any }> {
  if (!res.ok || !res.body) {
    await json(res);
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      let event = "message";
      let data = "";
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        else if (line.startsWith("data: ")) data += line.slice(6);
      }
      if (data) yield { event, data: JSON.parse(data) };
    }
  }
}

export function ask(runId: string, question: string, focus: string | null, history: { role: string; content: string }[]) {
  return fetch(`/api/runs/${runId}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, focus, history }),
  });
}

export const PHASES: Record<number, string> = {
  1: "Concept and architecture",
  2: "Detailed design",
  3: "Design verification",
  4: "Type approval",
  5: "Series production",
};
export const PHASE_HINT: Record<number, string> = {
  1: "Decide before the part is packaged on the vehicle",
  2: "Get right before design freeze",
  3: "Pass in testing before submitting for approval",
  4: "Needed for the approval itself",
  5: "Keep true in production",
};
export const SEVERITY: Record<number, string> = {
  5: "Safety-critical",
  4: "Blocks approval",
  3: "Installation",
  2: "Marking",
  1: "Optional",
};
