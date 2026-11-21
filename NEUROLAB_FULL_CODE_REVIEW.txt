NEUROLAB FULL APPLICATION PRE-COMMIT CODE AUDIT
Read-only review of the working directory and uncommitted changes

Scope and method
----------------
Reviewed application source, configuration, relevant tracked diffs, untracked source files, generated assets, tests, and recent Git history. The tests and build were run from an isolated snapshot containing the current tracked and untracked source, with the existing node_modules linked into that snapshot. This avoided running build commands against the actual checkout. No application source or Git state was changed during the audit. The two requested review reports are the only files created by the audit.

The review is based on code inspection and software tests. Scientific references linked or named in the application were not independently reviewed or experimentally validated as part of this audit. No browser-based interaction, visual regression, accessibility automation, or external biological benchmark was run.

1. EXECUTIVE SUMMARY
--------------------
Final recommendation: READY TO COMMIT AFTER SPECIFIC FIXES.

The current source builds and the existing automated suite passes. The three broad computational engines are separated from React, use explicit units and typed parameters, integrate with RK4, validate many input/state bounds, and make important model limitations visible in the Lab. The Brain viewer continues to use its existing BodyParts3D asset and includes an accessible region-tree alternative to selecting the mesh.

One high-priority scientific correctness concern should be resolved before committing the computational synapse/network work: the point-source calcium implementation omits the calcium valence factor z that its own documented equation includes. With the stated Ca2+ current and parameters, the computed point-source calcium increment appears to be twice the value implied by that equation. The current tests check qualitative trends, not the numerical equation, so they do not detect this discrepancy.

Other material concerns are that the knowledge validator accepts source-checked claims with no evidence, the UI hardcodes status labels and shows an aggregate bibliography rather than citations attached to each claim, and the new knowledge registry still derives most anatomy entities from legacy Brain presentation data. Simulation results also retain every step and are computed synchronously in the UI event handler; this is acceptable for the fixed, small demo but is not a scalable large-network execution design.

No CRITICAL finding was identified. Resolve the high-priority equation issue before commit, confirm intentional inclusion of the untracked implementation files, and strengthen the source-provenance guardrails before expanding the registry. The project makes no claim that the coupled network has been independently biologically validated, and the current interface correctly discloses that limitation.

2. OVERALL PROJECT ARCHITECTURE
-------------------------------
Application shell and workspaces
- React 18, TypeScript, Vite, Three.js, React Three Fiber, and Drei are used by the browser application.
- The application has Brain, Systems, Activity, and Lab workspaces, with shared navigation/search in src/App.tsx, src/components/Toolbar/Toolbar.tsx, and src/config/searchIndex.ts.
- Brain region descriptions, functions, connections, and system tags are held in src/workspaces/Brain/brainData.ts. Neural-system narratives, region membership, interactions, and diagram edges are separately hardcoded in src/workspaces/Systems/systemsData.ts.
- Activity generates animated synthetic traces directly in src/workspaces/Activity/ActivityWorkspace.tsx. The interface labels these as simulated/illustrative and does not present them as recordings.
- Lab contains both conceptual educational models and computational models. Model selection and disclaimers are in src/workspaces/Lab/ExperimentModels.tsx; the new HH, synapse, and network views are in separate components.

Brain visualization and knowledge flow
- The existing BodyParts3D GLB remains the sole 3D brain renderer. src/workspaces/Brain/BrainVisualization.tsx finds the atlas root and named groups, clones their mesh materials, and maps selected groups to BrainRegion entries. src/workspaces/Brain/brainVisualizationData.ts contains display-group IDs, source mesh IDs, colors, and coverage notes.
- public/models/brain/ATTRIBUTION.txt documents the BodyParts3D CC BY 4.0 attribution, adult human male model, grouped meshes, and incomplete lobe coverage. The regeneration script is scripts/build-brain-atlas.mjs.
- src/knowledge contains branded IDs, entity/claim/relationship types, scientific statuses, confidence, species/context metadata, evidence/source records, validation, an in-memory registry, a Brain adapter, and an evidence-backed occipital-lobe pilot.
- src/knowledge/adapters/brainKnowledgeAdapter.ts currently imports legacy BrainRegion data and converts regions with details into registry entities. It registers the occipital claims, relationships, evidence, and sources. BrainWorkspace obtains the selected profile through this adapter and uses legacy detail fields as fallback.
- All 11 current display-group IDs map to same-ID knowledge entities, with no unmatched display-group IDs. This is identity coverage, not scientific-content coverage: the knowledge entities mostly have no migrated claims. Prefrontal cortex is the one information-only entity without its own mesh. Mesh groups are not complete anatomical masks.

Computational model flow
- src/simulation/neuron/hodgkinHuxley.ts is a reusable single-compartment classical squid-axon HH engine. It exposes membrane potential, ionic currents, gates, parameters, and a square current pulse.
- src/simulation/synapse/chemicalSynapse.ts accepts an explicit terminal-voltage waveform, models effective CaV activation/current, local calcium, deterministic Hill release, and an unreplenished finite expected vesicle pool. src/simulation/synapse/hodgkinHuxleyTerminalInput.ts adapts an HH trace; its comments explicitly disclaim spatial axonal propagation.
- src/simulation/network/threeNeuronNetwork.ts composes HH, the calcium/release state, cleft glutamate, and an effective two-state AMPA model. It advances the configured neurons and connections on a shared RK4 clock and applies computed synaptic currents to postsynaptic membrane equations.
- React components call these engines synchronously and render computed samples in SVG charts. The UI offers bounded parameter controls and model-specific caveats. The current network UI fixes the run at 40 ms and defaults to three neurons and two directed connections.

3. GIT STATE AND UNCOMMITTED CHANGES
------------------------------------
At the start of the audit, git status showed branch main tracking origin/main, no staged changes, and these tracked changes:

Deleted:
- dist/assets/index-VabsIiep.css
- dist/assets/index-cTWFkBEv.js

Modified:
- dist/index.html
- package-lock.json
- package.json
- src/workspaces/Brain/BrainWorkspace.tsx
- src/workspaces/Lab/ExperimentModels.css
- src/workspaces/Lab/ExperimentModels.tsx
- src/workspaces/Lab/LabWorkspace.tsx
- src/workspaces/Lab/experimentData.ts
- tsconfig.tsbuildinfo

Untracked at audit start:
- NEUROLAB_UPDATE.txt
- dist/assets/index-C2zjmXoS.css
- dist/assets/index-jKO6lq0G.js
- src/knowledge/README.md
- src/knowledge/adapters/brainKnowledgeAdapter.test.ts
- src/knowledge/adapters/brainKnowledgeAdapter.ts
- src/knowledge/adapters/brainRegionAdapter.test.ts
- src/knowledge/adapters/brainRegionAdapter.ts
- src/knowledge/adapters/index.ts
- src/knowledge/anatomy/README.md
- src/knowledge/anatomy/occipitalLobe.ts
- src/knowledge/biology/README.md
- src/knowledge/circuits/README.md
- src/knowledge/cognition/README.md
- src/knowledge/core/ids.ts
- src/knowledge/core/index.ts
- src/knowledge/core/types.ts
- src/knowledge/evidence/index.ts
- src/knowledge/evidence/scientificEvidence.ts
- src/knowledge/evidence/sources.ts
- src/knowledge/index.ts
- src/knowledge/learning/README.md
- src/knowledge/registry/KnowledgeRegistry.test.ts
- src/knowledge/registry/KnowledgeRegistry.ts
- src/knowledge/registry/index.ts
- src/knowledge/registry/validation.ts
- src/simulation/network/threeNeuronNetwork.test.ts
- src/simulation/network/threeNeuronNetwork.ts
- src/simulation/neuron/hodgkinHuxley.test.ts
- src/simulation/neuron/hodgkinHuxley.ts
- src/simulation/synapse/chemicalSynapse.test.ts
- src/simulation/synapse/chemicalSynapse.ts
- src/simulation/synapse/hodgkinHuxleyTerminalInput.test.ts
- src/simulation/synapse/hodgkinHuxleyTerminalInput.ts
- src/workspaces/Lab/ChemicalSynapseModel.css
- src/workspaces/Lab/ChemicalSynapseModel.tsx
- src/workspaces/Lab/HodgkinHuxleyModel.tsx
- src/workspaces/Lab/NetworkModel.css
- src/workspaces/Lab/NetworkModel.tsx

The tracked diff summary was 11 files changed, 649 insertions, and 4,377 deletions; most deletions are the replaced hashed minified bundle. That summary does not include the substantial untracked knowledge/simulation source, so it is not a complete measure of the pending implementation. The updated dist/index.html points at the new hashed assets, which are untracked at audit start. The build performed in the isolated snapshot generated those same asset names. The tracked TypeScript build-info file is also modified and is generated metadata.

Recent commits inspected:
- 30c9949 Update NeuroLab application
- 121a55d update from bolt agent
- 24b0963 Add package-lock.json
- 26c16ca Add .gitignore
- a4858f3 Initial commit

NEUROLAB_CODE_EXPORT.txt is a tracked 5,577-line snapshot, not a live source of truth. Its embedded package manifest has no test script and it contains no current simulation/knowledge code. Do not treat it as the current implementation.

The audit did not stage, commit, reset, or otherwise alter Git state. The requested Markdown and TXT review reports were not present in the baseline and are created by this audit.

4. REVIEW OF MAJOR SUBSYSTEMS
-----------------------------
Brain anatomy and viewer
- The viewer preserves BodyParts3D and selects by existing semantic group IDs. Coverage notes correctly warn that frontal/parietal/temporal groups use selected gyri and are not complete lobe masks. Prefrontal cortex is explicitly information-only.
- BrainWorkspace routes profile lookup through the knowledge adapter and falls back to legacy description/functions/connections for unmigrated regions. Current selection behavior and existing region-tree controls are preserved.
- The adapter coverage tests verify all 11 display IDs resolve and that the prefrontal entity has no mesh. They verify IDs and fixture lookups, not actual rendering/loading of the GLB in a browser.
- The selected-claim display currently exposes only the occipital pilot's migrated claims. Other displayed profiles remain legacy material rather than being silently reclassified as evidence-backed.

Knowledge registry and scientific provenance
- The core is modular and provides runtime validation, duplicate-ID checks, and missing entity/evidence/source reference checks. Registration failures are explicit result values.
- All current occipital claims have nonempty evidence references; evidence records point to source records; the adapter tests assert source/evidence coverage. The current migrated data is not implicated by the empty-array validator issue below.
- The registry is in-memory and populated at module initialization. There is no persistence/import pipeline, versioning, migration mechanism, or full application-wide registry integration yet. These are future implementation needs, not necessarily blockers for this pilot.
- Claims and sources are linked in data, but the Brain UI presents the selected profile's sources as one bibliography list. It does not show which bibliography item supports each displayed claim.

Hodgkin-Huxley neuron
- The implementation uses the classical squid-axon conductance equations, mV, uA/cm2 and uF/cm2, inward-positive applied current, outward-positive ionic currents, steady-state initial gates, Q10=3 temperature scaling around 6.3 C, and RK4.
- It is explicitly single-compartment and disclaims morphology, spatial propagation, synapses, and a complete human neuron. Its equations and numerical singularity handling are understandable and tested.
- Source provenance in the engine is less complete than the knowledge records: the code comments name Hodgkin and Huxley (1952) and NEURON's squid implementation but do not provide full bibliographic metadata adjacent to all parameter defaults.

Presynaptic calcium and release
- A voltage-dependent, linear activation approximation drives a single-channel conductance current. The engine converts inward current to a local point-source calcium target, relaxes calcium with a first-order time constant, and computes Hill-dependent expected release against a finite one-site pool.
- It clearly labels the event as an explicit terminal-voltage input, and clearly excludes propagation, stochastic release, full SNARE kinetics, transmitter diffusion, and postsynaptic response.
- The point-source conversion has the high-priority valence discrepancy described in Finding HIGH-1. The tests establish qualitative monotonicity and deterministic refinement, but not a reference concentration calculation.

Network and AMPA
- The engine supports configurable neuron and connection definitions, validates IDs/endpoints and parameters, synchronizes state advances, applies a sign conversion from outward-positive AMPA current to the HH inward-positive applied-current convention, and samples neuron/synapse outputs together.
- The default A-to-B-to-C test checks that activity depends on calculated synaptic coupling and disappears when edges are removed; this is stronger than checking a prerecorded trace.
- Glutamate release is converted to a well-mixed cleft concentration with a first-order clearance constant. AMPA uses an effective closed/open state with association/dissociation rates, maximum conductance density, and reversal potential. These are disclosed approximations; receptor binding-site complexity, desensitization, subtypes, morphology, and spatial axonal delay are not represented.
- The three-neuron network composes squid HH parameters with calyx-of-Held calcium-channel parameters described for P8-P12 mouse, plus explicitly illustrative transmitter/AMPA defaults. The UI correctly says that the combined model/default parameters have not had independent quantitative or domain-expert validation. This is a scientific boundary, not evidence that the implementation is a validated biological circuit.

Systems, Activity, search, and Lab
- Systems and most anatomical explanatory content remain static and separately authored; they are not yet claims/relationships in the knowledge registry.
- Activity is a synthetic animated waveform and illustrative network diagram, not a signal processing or recording subsystem. Its disclaimer is appropriate, but its displayed sample-rate metadata is not the sampling rate of the generated point set (Finding LOW-1).
- Search indexes legacy Brain data, systems, Lab concepts/protocols, and an Activity overview. It does not index knowledge claims/evidence or simulation parameters/results.
- Lab's three new model controls call the engines directly in click handlers. Existing conceptual models and protocol preview remain in place. There are no React DOM/component or end-to-end tests, so build success does not establish that the workspace behaves correctly in a browser.

Dependencies, configuration, and generated output
- The dependency change adds Vitest as a dev dependency and an npm test script; this is directly used and not unnecessary.
- TypeScript strict mode and no-unused checks are enabled. npm run build invokes tsc -b and Vite.
- The isolated production build emits a 1,276.03 kB minified JS chunk (353.17 kB gzip) and Vite's over-500-kB chunk advisory. The single bundle includes the large 3D/rendering dependency tree and application; no lazy loading or manual chunking is configured.
- The project tracks dist assets and tsconfig.tsbuildinfo. The current Git delta contains a replaced bundle and build metadata. Commit the new source files and matching hashed dist assets together if the repository's existing tracked-dist deployment workflow is intentional; otherwise clarify the repository's generated-artifact policy before staging.

5. SCIENTIFIC AND COMPUTATIONAL MODELING REVIEW
------------------------------------------------
The HH sign conventions and current equations are internally consistent with the code comment: C_m dV/dt = I_app - I_Na - I_K - I_L, with conductance-form ionic currents outward-positive. The classic parameters and rate equations are implemented in a single isopotential squid-axon compartment. The integration uses a bounded RK4 step and limits steps further with temperature scaling. Tests cover resting stability, evoked spiking, current signs, gates, deterministic repetition, refinement, and parameter changes.

The synapse has clear unit-bearing fields and separates pA current from uM local calcium. However, the documented steady point-source relationship is [Ca]target = [Ca]rest + max(0,-ICa)/(4*pi*z*F*D*r); pointSourceCalciumUm divides by 4*pi*F*D*r and has no z term. Because the modeled ion is Ca2+, the charge valence is 2. Given the code's pA current and stated equation, the computed calcium increment appears doubled. This remains a code-level derivation finding; the original paper's detailed derivation/conventions were not independently reviewed in this audit.

The release Hill curve and deterministic expected vesicle pool are phenomenological rather than a molecular release model. The code says so. The network's glutamate, cleft-volume, clearance, and AMPA defaults are educational assumptions rather than fitted or universal biological values; its interface also says so. There is no simulation of spatial propagation from an HH compartment to a terminal. The explicit waveform coupling is an input abstraction.

Automated tests demonstrate numerical software properties and expected qualitative behavior. They do not compare exact traces or release values against an independently implemented reference simulator, experimental data, or expert-reviewed benchmark. No independent biological validation should be claimed.

6. ENGINEERING AND CODE-QUALITY REVIEW
--------------------------------------
Strengths include strict TypeScript configuration; modular engines free of React imports; explicit inputs/results and units; parameter/state validation; bounded integration step counts; clear error throws for malformed simulation inputs; typed topology and missing-endpoint checks; same-clock RK4 integration; deterministic output; and caveats in the Lab that identify model boundaries.

The largest structural coupling is that the Brain knowledge adapter imports Brain workspace data and uses it to construct most entities. In parallel, Systems and Search still consume their own legacy data structures. The registry therefore is a useful pilot layer, not yet the canonical source of scientific data across the app.

All simulation results are retained sample-by-sample. The network step ceiling is two million, and each integration sample is pushed into arrays for every neuron and connection. This ceiling bounds CPU steps but does not bound total result memory as network size and duration grow. The Lab calls the simulator synchronously on the browser main thread. The current UI fixes the demo at 40 ms, but larger future runs/networks need profiling, bounded output sampling/streaming, or worker execution before exposure.

There are no configured lint, browser-test, accessibility-test, or visual-regression scripts in package.json. The existing suite has seven test files, all covering engines, registry, and adapters; it does not mount React UI or load/render the GLB. The existing tests are useful behavioral tests, especially the network topology and parameter-response cases, but their science checks are qualitative and cannot validate the point-source equation.

7. TEST AND PRODUCTION-BUILD RESULTS
------------------------------------
Commands actually run:
- npm test (in /tmp/neurolab-precommit-audit-20261121, an isolated copy of the current source with existing node_modules linked)
- npm run build (in the same isolated copy)
- git diff --check (read-only against the actual checkout)

Results:
- Vitest 2.1.9: 7 test files passed; 53 tests passed; 0 failed. Total test duration reported: 8.34 seconds.
- TypeScript build and Vite production build passed. Vite transformed 665 modules and wrote the production bundle.
- Build warning: one minified JavaScript chunk is 1,276.03 kB, above Vite's 500 kB advisory threshold; gzip size reported as 353.17 kB.
- git diff --check passed with no whitespace error output.
- No package installation was performed.

Not run:
- Browser/manual interaction or rendering test.
- Component/DOM, end-to-end, visual-regression, or accessibility test.
- External literature/source audit, independent numerical reference comparison, or experimental validation.

8. FINDINGS BY SEVERITY
-----------------------

HIGH-1 - Point-source calcium calculation omits Ca2+ valence
File: src/simulation/synapse/chemicalSynapse.ts:6-8, 205-215
The file's own documented equation contains z in the 4*pi*z*F*D*r denominator. The implementation at lines 213-214 divides only by 4*pi*F*D*r. The current is a pA current and the modeled ion is calcium, so the valence term is not otherwise accounted for. The calculated local calcium increment therefore appears to be twice the documented value. The network reuses this synapse derivative, so the same discrepancy propagates into network release and downstream output.
Why it matters: calcium is the input to the nonlinear release law. A factor-of-two error in calcium changes release probability and every downstream synaptic response; this is the central quantitative mechanism in the new synapse model.
Recommended correction: verify the derivation and units against the cited source/convention, include the appropriate valence factor (or revise and justify the model equation if a different convention is intended), and add a numerical unit/expected-value test that would fail if z is omitted. Re-run the suite and build after fixing.

MEDIUM-1 - Source-checked records can pass with no evidence/source
Files: src/knowledge/registry/validation.ts:90-118, 198-205; src/knowledge/registry/KnowledgeRegistry.ts:60-111; src/knowledge/registry/KnowledgeRegistry.test.ts:105-116
Validation checks that evidenceIds/sourceIds are arrays of valid IDs but does not require nonempty arrays. The registry's missing-reference checks also accept empty arrays. The test suite explicitly registers a source-checked claim with evidenceIds: [] and expects success.
Why it matters: future data can be marked source-checked without any supporting evidence or bibliography, weakening the scientific provenance contract. Current occipital records do have evidence; this is an enforcement gap, not an observed missing citation in the pilot.
Recommended correction: define and validate the policy between review status and evidence requirements (at minimum, require evidence for source-checked claims/relationships and sources for evidence records), then add negative tests for empty and unresolved references. Do not imply that source-checked means expert-reviewed.

MEDIUM-2 - Knowledge layer is not yet the canonical cross-workspace source
Files: src/knowledge/adapters/brainKnowledgeAdapter.ts:1-3, 48-61; src/workspaces/Brain/brainData.ts; src/workspaces/Systems/systemsData.ts; src/config/searchIndex.ts:2, 20, 93
The adapter imports presentation-oriented BrainRegion records and constructs most registry entities from them. Systems content remains separately hardcoded, and global search indexes legacy region/system/learning data rather than knowledge claims, evidence, or relationships.
Why it matters: adding a scientific claim to the registry does not make it searchable everywhere; anatomy and system information can diverge between independent data sources. This is a migration/architecture limitation, not a reason to discard the current compatibility adapter.
Recommended correction: migrate incrementally, keep the adapter as a compatibility boundary, make registry entities/data the canonical source only when their records have been curated, and extend search/system adapters from that source. Do not bulk-migrate legacy statements as established facts.

MEDIUM-3 - UI status labels are hardcoded and citations are not claim-specific
File: src/workspaces/Brain/BrainWorkspace.tsx:65-80, 272-315, 323-340
The panel retrieves claims, but renders fixed text such as "Established · source-checked · not expert-reviewed" instead of formatting each claim's status/reviewStatus. This happens to match the currently displayed migrated functions and relationships; it will mislabel future simplified, hypothetical, simulated, unreviewed, or differently reviewed records. Sources are rendered as one profile-level bibliography, not next to or linked from the individual claim they support.
Why it matters: the app's scientific-status and evidence distinctions are a core data contract; hardcoded labels can silently make future UI content scientifically misleading.
Recommended correction: render status and review metadata from each record, and expose its evidence/source references alongside the claim. Preserve current profile layout.

MEDIUM-4 - Network output memory and synchronous UI execution limit scaling
Files: src/simulation/network/threeNeuronNetwork.ts:24, 383-385, 736-773; src/workspaces/Lab/NetworkModel.tsx:16, 43-47
The simulator permits up to two million integration steps and stores a full object sample for every neuron and connection at every step. The Lab invokes it synchronously in the click handler. The UI's current fixed 40 ms run is small, but the engine's step ceiling does not bound result memory as neuron/connection count increases.
Why it matters: larger runs can consume substantial memory and block browser interaction; the current approach is not a production-scale network execution architecture.
Recommended correction: before exposing larger networks, define a memory/output budget, profile in browser, and consider a Web Worker plus optional decimated/streamed output while preserving exact integration where needed. Keep the current small educational case simple.

MEDIUM-5 - Production bundle exceeds Vite's chunk advisory
Files: vite.config.ts; package.json; isolated build output
The production build succeeds but emits a single 1,276.03 kB minified JS chunk (353.17 kB gzip), above Vite's 500 kB advisory. There is no dynamic import/manual chunk configuration.
Why it matters: first-load performance may suffer, particularly on mobile or slower connections.
Recommended correction: measure startup in the target environment; if material, lazy-load the Brain/Lab workspaces or split heavy Three.js and model code. Do not add chunking solely to silence the warning.

LOW-1 - Activity sample-rate metadata does not describe generated samples
File: src/workspaces/Activity/ActivityWorkspace.tsx:16, 55-67, 204-208
The chart generates 150 points per channel and interpolates them over the visual window, but displays "SAMPLE RATE 250 Hz". It is explicitly a synthetic demo, so this is not a real recording claim, but the displayed rate is not the actual generated point density/timing.
Why it matters: users may interpret a visual metadata label as a property of the simulated signal.
Recommended correction: label it as illustrative display metadata or generate timestamps/sample count consistent with 250 Hz and the selected window.

LOW-2 - Committed code-export snapshot is stale
File: NEUROLAB_CODE_EXPORT.txt
The tracked 5,577-line export contains an earlier package manifest without the test script and has no current knowledge or simulation modules.
Why it matters: a reader or future AI assistant can mistake the snapshot for current source and reason from missing or obsolete code.
Recommended correction: regenerate it when the project's export workflow is next used, or clearly mark/document it as historical. Do not use it as the source of truth.

9. ARCHITECTURAL STRENGTHS WORTH PRESERVING
-------------------------------------------
- Keep scientific computation in React-independent modules with explicit parameter and result types.
- Keep the existing BodyParts3D brain viewer primary; preserve visualization-specific segment/color/coverage metadata separately from scientific claims.
- Preserve legacy fallbacks during staged knowledge migration; do not silently relabel old prose as reviewed evidence.
- Keep explicit distinctions among established, simplified, hypothetical, and simulated status, and among unreviewed, source-checked, and expert-reviewed.
- Preserve species/context/limitations/confidence and source/evidence links in scientific records.
- Preserve the explicit "no spatial propagation" coupling boundary between the single-compartment HH cell and terminal input.
- Preserve the shared-clock network integration, sign-convention documentation, deterministic tests, and user-facing disclaimers.
- Continue using the current small-scale model as an educational mechanism pilot, not as a validated biological network.

10. PRIORITIZED RECOMMENDED FIXES
---------------------------------
Before commit:
1. Resolve HIGH-1: verify and correct the Ca2+ valence in the point-source concentration formula; add an exact quantitative test. Re-run npm test and npm run build.
2. Confirm staging will include all required untracked knowledge/simulation/Lab source and the matching generated assets referenced by dist/index.html. Decide whether tsconfig.tsbuildinfo and dist are intentionally committed under current repository policy. Do not stage unrelated historical/generated files by accident.

Before expanding the evidence-backed registry:
3. Close MEDIUM-1 with review-status/evidence validation and negative tests.
4. Close MEDIUM-3 by rendering claim-specific status and evidence/source relationships.
5. Plan MEDIUM-2 migration boundaries so Systems, Brain, and Search do not drift into parallel authorities.

Before increasing network size or duration:
6. Address MEDIUM-4 with a measured memory/runtime budget and browser profiling; consider worker/streamed output only when justified.
7. Measure the MEDIUM-5 bundle in the target environment and split code only if user impact warrants it.
8. Resolve LOW-1's sample-rate label; refresh or mark LOW-2's export snapshot when appropriate.

11. OUTSTANDING SCIENTIFIC VALIDATION REQUIREMENTS
-------------------------------------------------
- Independently verify the calcium point-source derivation, valence, unit conversions, and parameter conventions against the cited source.
- Compare HH traces and calcium/release behavior against trusted reference implementations or published quantitative results, with explicit tolerances and preparation/temperature context.
- Validate the coupled model as a combination, not merely each component source: current defaults mix the classical squid-axon HH model, mouse calyx-of-Held CaV parameters, and illustrative glutamate/AMPA parameters. The application explicitly says this combination has not been independently validated.
- Establish species, preparation, temperature, compartment, and parameter provenance for every future biological default. Treat unknown or illustrative defaults as such.
- Add evidence and review-status workflows that distinguish source checking from expert review and keep limitations visible in the user interface.
- No claims should be made about human-neuron completeness, spatial axonal conduction, full molecular vesicle fusion, or a biologically validated network based on the current models.

12. FINAL COMMIT-READINESS RECOMMENDATION
-----------------------------------------
READY TO COMMIT AFTER SPECIFIC FIXES.

The application type-checks, builds, and passes all 53 current automated tests. The audit found no critical software failure and the current demos are careful to disclose major biological simplifications. However, the point-source calcium equation has a likely factor-of-two Ca2+ valence error that directly affects synapse and network outputs. That should be resolved with a quantitative test before committing these model changes. The scientific provenance validator and the UI's hardcoded status labels should also be addressed before treating the knowledge layer as a scalable scientific source of truth.

The working tree is not commit-ready merely by virtue of the successful build: important implementation files remain untracked, and the generated dist index/assets and build metadata need intentional staging decisions. This report does not stage or modify any of those files.
