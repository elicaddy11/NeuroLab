# NeuroLab

An interactive neuroscience learning interface with four workspaces:

- **Brain** — an interactive, color-coded atlas assembled from segmented BodyParts3D meshes, with searchable anatomy and 360° camera controls.
- **Systems** — interactive regional relationship maps and functional system summaries.
- **Activity** — synthetic, animated network and signal visualizations.
- **Lab** — reward-learning, memory, and stress/performance teaching models, plus a local protocol timeline preview.

The Brain workspace uses selected anatomical segments from BodyParts3D v4.0 (CC BY 4.0); cortical lobe colors group selected source gyri and do not represent complete lobe masks. Prefrontal cortex remains information-only because this asset does not provide a dedicated segment. See [the model attribution](./public/models/brain/ATTRIBUTION.txt).

Network relationships, activity traces, and Lab experiments are illustrative educational models. They are not physiological recordings, clinical measurements, or validated research simulations.

## Development

```sh
npm install
npm run dev
```

Run `npm run build` to type-check and create a production build.
