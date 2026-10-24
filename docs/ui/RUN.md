# Running Flame locally

One-time data build (needs the kit's PDFs linked at `regulations/`):
```bash
ln -sfn industrial-ai-hackathon/regulations regulations
uv run python -m pipeline.ingest          # PDFs -> data/corpus.jsonl (with line boxes), ~2.5 min
uv run python -m pipeline.graph           # -> data/graph.json, ~5 s
uv run python -m pipeline.index           # -> data/index/ (BM25 + local embeddings), ~5 min
```

Client and server:
```bash
cd web && npm install && npm run build && cd ..
uv run uvicorn app.main:app --port 8000     # open http://127.0.0.1:8000
```
For client development, run `npm run dev` in `web/` (http://localhost:5173, proxies `/api` and `/files` to :8000).

Keys go in `.env` (see `.env.template`): `CLAUDE_KEY` for new analyses, the enrich agent, the assistant and graph chat;
`ELEVENLABS_KEY` for voice; optional `FLAME_PASSWORD`. Without keys, finished runs, the PDF viewer, both graphs and
search-based fallbacks still work.

Bring in a finished pipeline output (e.g. Sunday's held-out case) and rate it:
```bash
uv run python -m app.runs import out/heldout-front-bumper --title "Front bumper"
uv run python -m pipeline.enrich out/runs/heldout-front-bumper      # model if a key is set, else rules
```
