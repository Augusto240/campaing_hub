# Architecture Principles

## 1. Isolate The Demo

The live demo lives at `frontend/src/app/features/workshop` and is routed only
through `/workshop`. It does not reuse campaign pages, auth guards, sockets, or
HTTP API services.

## 2. Prefer Local View Models

Workshop components consume small local types and Signals. Backend API types are
legacy implementation detail and must not leak into the sandbox.

## 3. Make State Derivable

Backlinks, timeline entries, and graph edges are derived from seed data plus
local in-memory edits. Avoid duplicated mutable state unless it is the source of
truth for a direct user edit.

## 4. Keep Components Focused

Each component owns one job:

- tree navigation
- block editing
- backlinks/timeline display
- graph visualization
- shell orchestration

## 5. No Hidden Demo Dependencies

The workshop must keep working when backend containers are stopped.
