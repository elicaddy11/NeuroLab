import "./BrainVisualization.css";

/**
 * Stylized abstract brain placeholder — a wireframe silhouette with
 * cortical fold hints, nodes, and connection lines. This is NOT an
 * anatomically accurate model; it signals that a 3D model will load here.
 */
export function BrainVisualization() {
  return (
    <svg
      className="brainSvg"
      viewBox="0 0 360 300"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Brain visualization placeholder — wireframe silhouette"
    >
      {/* Midline axis */}
      <line className="axis" x1="180" y1="20" x2="180" y2="280" />

      {/* Left hemisphere wireframe outline */}
      <path
        className="wireframe"
        d="M180 60 C 150 45, 110 50, 85 75 C 60 100, 50 135, 55 165 C 60 195, 78 220, 105 235 C 130 248, 160 245, 180 235"
      />
      {/* Left hemisphere secondary contour */}
      <path
        className="wireframeDim"
        d="M180 75 C 155 62, 122 67, 100 88 C 78 108, 70 138, 75 165 C 80 190, 95 212, 118 222 C 142 232, 165 228, 180 220"
      />
      {/* Left inner contour */}
      <path
        className="wireframeDim"
        d="M180 92 C 160 82, 135 87, 118 104 C 100 121, 94 145, 98 165 C 102 185, 115 202, 132 210"
      />

      {/* Right hemisphere wireframe outline */}
      <path
        className="wireframe"
        d="M180 60 C 210 45, 250 50, 275 75 C 300 100, 310 135, 305 165 C 300 195, 282 220, 255 235 C 230 248, 200 245, 180 235"
      />
      <path
        className="wireframeDim"
        d="M180 75 C 205 62, 238 67, 260 88 C 282 108, 290 138, 285 165 C 280 190, 265 212, 242 222 C 218 232, 195 228, 180 220"
      />
      <path
        className="wireframeDim"
        d="M180 92 C 200 82, 225 87, 242 104 C 260 121, 266 145, 262 165 C 258 185, 245 202, 228 210"
      />

      {/* Sulcus hints — left */}
      <path className="sulcus" d="M95 90 C 110 100, 115 130, 105 160" />
      <path className="sulcus" d="M130 65 C 135 95, 130 140, 120 175" />
      <path className="sulcus" d="M160 55 C 162 90, 158 140, 150 185" />
      <path className="sulcus" d="M80 130 C 110 125, 150 122, 175 120" />

      {/* Sulcus hints — right */}
      <path className="sulcus" d="M265 90 C 250 100, 245 130, 255 160" />
      <path className="sulcus" d="M230 65 C 225 95, 230 140, 240 175" />
      <path className="sulcus" d="M200 55 C 198 90, 202 140, 210 185" />
      <path className="sulcus" d="M280 130 C 250 125, 210 122, 185 120" />

      {/* Corpus callosum bridge */}
      <path
        className="corpusCallosum"
        d="M180 130 C 150 118, 120 120, 108 132 C 100 142, 105 152, 120 150 C 145 148, 165 140, 180 138"
      />
      <path
        className="corpusCallosum"
        d="M180 130 C 210 118, 240 120, 252 132 C 260 142, 255 152, 240 150 C 215 148, 195 140, 180 138"
      />

      {/* Cerebellum hint */}
      <path className="cerebellum" d="M180 232 C 170 245, 150 250, 138 248 C 130 246, 128 238, 135 234" />
      <path className="cerebellum" d="M180 232 C 190 245, 210 250, 222 248 C 230 246, 232 238, 225 234" />
      <path className="cerebellum" d="M140 236 C 145 240, 152 242, 158 240" />
      <path className="cerebellum" d="M220 236 C 215 240, 208 242, 202 240" />

      {/* Brainstem */}
      <path className="brainstem" d="M180 235 C 178 250, 176 262, 178 275" />
      <path className="brainstem" d="M172 238 C 170 252, 170 264, 174 274" />
      <path className="brainstem" d="M188 238 C 190 252, 190 264, 186 274" />

      {/* Network nodes — left hemisphere */}
      <circle className="nodeGlow" cx="115" cy="105" r="6" />
      <circle className="nodeActive" cx="115" cy="105" r="2" />
      <circle className="node" cx="145" cy="130" r="1.8" />
      <circle className="node" cx="100" cy="150" r="1.8" />
      <circle className="node" cx="155" cy="175" r="1.8" />
      <circle className="node" cx="120" cy="200" r="1.8" />

      {/* Network nodes — right hemisphere */}
      <circle className="nodeGlow" cx="245" cy="105" r="6" />
      <circle className="node" cx="245" cy="105" r="1.8" />
      <circle className="node" cx="215" cy="130" r="1.8" />
      <circle className="node" cx="260" cy="150" r="1.8" />
      <circle className="node" cx="205" cy="175" r="1.8" />
      <circle className="nodeActive" cx="240" cy="200" r="2" />

      {/* Connection lines */}
      <path className="connection" d="M115 105 L 145 130 L 100 150 L 155 175 L 120 200" />
      <path className="connection" d="M245 105 L 215 130 L 260 150 L 205 175 L 240 200" />
      <path className="connection" d="M115 105 C 180 95, 180 95, 245 105" />
      <path className="connection" d="M145 130 C 180 125, 180 125, 215 130" />
      <path className="connection" d="M120 200 C 180 215, 180 215, 240 200" />

      {/* Cross-hemisphere callosal connection */}
      <path className="connection" d="M115 105 C 160 112, 200 112, 245 105" opacity="0.6" />

      {/* Labels */}
      <text className="label" x="178" y="18" textAnchor="middle">A</text>
      <text className="label" x="178" y="294" textAnchor="middle">P</text>
      <text className="label" x="40" y="170" textAnchor="middle">L</text>
      <text className="label" x="322" y="170" textAnchor="middle">R</text>

      <text className="label" x="115" y="92" textAnchor="middle">DLPFC</text>
      <text className="label" x="245" y="92" textAnchor="middle">DLPFC</text>
      <text className="label" x="180" y="128" textAnchor="middle" opacity="0.5">CC</text>
    </svg>
  );
}
