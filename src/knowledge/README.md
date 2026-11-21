# Knowledge architecture

The knowledge layer contains typed scientific records and registry access. UI presentation data
(including atlas meshes, layout, colors, synthetic traces, and model equations) remains outside it.
Existing workspace data is not migrated by this foundation.

- `core/`: shared IDs, entity, claim, relationship, species, context, confidence, and status types.
- `anatomy/`, `biology/`, `circuits/`, `cognition/`, `learning/`: domain extension points; no new
  scientific content or mechanisms are implemented yet.
- `evidence/`: source and evidence metadata types.
- `registry/`: in-memory registration, lookup, and relationship queries.
- `adapters/`: compatibility conversion helpers for existing workspace data.
