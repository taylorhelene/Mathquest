"use client";

/**
 * Interactive diagrams for 3D shape lessons (SVG fallback).
 * Real rotation/AR comes from model-viewer + .glb files.
 */

type Props = {
  lessonId: string;
  title: string;
  topic: string;
  modelSrc?: string;
  shapeHint?: string;
};

export default function LessonVisual({
  lessonId,
  title,
  modelSrc,
  shapeHint,
}: Props) {
  return (
    <div className="lesson-visual">
      <div className="visual-canvas" aria-label={`3D diagram: ${title}`}>
        {renderScene(lessonId, shapeHint)}
      </div>
      <p className="scene-note">
        Diagram preview of the solid. Use the <strong>3D model below</strong> to
        rotate, zoom, and open AR on a supported phone.
        {modelSrc ? ` Model file: ${modelSrc}` : ""}
      </p>
    </div>
  );
}

function renderScene(id: string, hint?: string) {
  const key = hint || id;
  if (key.includes("sphere") && !key.includes("hemi")) return <SphereDiagram />;
  if (key.includes("hemi")) return <HemisphereDiagram />;
  if (key.includes("cylinder")) return <CylinderDiagram />;
  if (key.includes("cone")) return <ConeDiagram />;
  if (key.includes("pyramid")) return <PyramidDiagram />;
  if (key.includes("compass")) return <CompassDiagram />;
  if (key.includes("cuboid")) return <CuboidDiagram />;
  if (key.includes("cube") || key.includes("volume") || key.includes("surface") || key.includes("edges"))
    return <CubeDiagram />;
  switch (id) {
    case "3d-sphere":
    case "3d-sphere-radius":
      return <SphereDiagram />;
    case "3d-cylinder":
      return <CylinderDiagram />;
    case "3d-cone":
      return <ConeDiagram />;
    case "3d-pyramid":
      return <PyramidDiagram />;
    case "3d-compass":
      return <CompassDiagram />;
    case "3d-hemisphere":
      return <HemisphereDiagram />;
    case "3d-cuboid":
      return <CuboidDiagram />;
    default:
      return <CubeDiagram />;
  }
}

function CubeDiagram() {
  return (
    <svg viewBox="0 0 240 200" className="viz-svg">
      {/* back face */}
      <polygon
        points="70,50 150,50 150,130 70,130"
        fill="var(--viz-cool)"
        opacity="0.5"
        stroke="var(--viz-stroke)"
      />
      {/* top */}
      <polygon
        points="70,50 100,30 180,30 150,50"
        fill="var(--viz-hot)"
        opacity="0.85"
        stroke="var(--viz-stroke)"
      />
      {/* side */}
      <polygon
        points="150,50 180,30 180,110 150,130"
        fill="#a78bfa"
        opacity="0.75"
        stroke="var(--viz-stroke)"
      />
      <text x="120" y="175" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Cube — 6 faces · 12 edges · 8 corners
      </text>
    </svg>
  );
}

function CuboidDiagram() {
  return (
    <svg viewBox="0 0 260 200" className="viz-svg">
      <polygon
        points="40,60 160,60 160,140 40,140"
        fill="var(--viz-cool)"
        opacity="0.5"
        stroke="var(--viz-stroke)"
      />
      <polygon
        points="40,60 70,35 190,35 160,60"
        fill="var(--viz-hot)"
        opacity="0.85"
        stroke="var(--viz-stroke)"
      />
      <polygon
        points="160,60 190,35 190,115 160,140"
        fill="#a78bfa"
        opacity="0.75"
        stroke="var(--viz-stroke)"
      />
      <text x="130" y="175" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Cuboid — rectangular box
      </text>
    </svg>
  );
}

function SphereDiagram() {
  return (
    <svg viewBox="0 0 220 200" className="viz-svg">
      <defs>
        <radialGradient id="sph" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#0284c7" />
        </radialGradient>
      </defs>
      <circle
        cx="110"
        cy="90"
        r="60"
        fill="url(#sph)"
        stroke="var(--viz-stroke)"
        strokeWidth="2"
      />
      <ellipse
        cx="110"
        cy="90"
        rx="60"
        ry="18"
        fill="none"
        stroke="var(--viz-stroke)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <line
        x1="110"
        y1="90"
        x2="160"
        y2="60"
        stroke="var(--viz-hot)"
        strokeWidth="2"
      />
      <text x="155" y="55" className="viz-label" fontSize="12">
        radius
      </text>
      <text x="110" y="175" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Sphere — no faces or edges
      </text>
    </svg>
  );
}

function HemisphereDiagram() {
  return (
    <svg viewBox="0 0 220 180" className="viz-svg">
      <path
        d="M 40 100 A 70 70 0 0 1 180 100 L 40 100"
        fill="var(--viz-cool)"
        stroke="var(--viz-stroke)"
        strokeWidth="2"
      />
      <ellipse
        cx="110"
        cy="100"
        rx="70"
        ry="16"
        fill="var(--viz-hot)"
        opacity="0.7"
        stroke="var(--viz-stroke)"
      />
      <text x="110" y="155" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Hemisphere — half a sphere
      </text>
    </svg>
  );
}

function CylinderDiagram() {
  return (
    <svg viewBox="0 0 200 200" className="viz-svg">
      <ellipse
        cx="100"
        cy="45"
        rx="50"
        ry="16"
        fill="var(--viz-hot)"
        stroke="var(--viz-stroke)"
      />
      <rect
        x="50"
        y="45"
        width="100"
        height="90"
        fill="var(--viz-cool)"
        opacity="0.7"
      />
      <ellipse
        cx="100"
        cy="135"
        rx="50"
        ry="16"
        fill="#38bdf8"
        stroke="var(--viz-stroke)"
      />
      <line x1="50" y1="45" x2="50" y2="135" stroke="var(--viz-stroke)" />
      <line x1="150" y1="45" x2="150" y2="135" stroke="var(--viz-stroke)" />
      <text x="100" y="175" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Cylinder — 2 circular faces
      </text>
    </svg>
  );
}

function ConeDiagram() {
  return (
    <svg viewBox="0 0 200 200" className="viz-svg">
      <polygon
        points="100,30 40,140 160,140"
        fill="var(--viz-cool)"
        opacity="0.75"
        stroke="var(--viz-stroke)"
        strokeWidth="2"
      />
      <ellipse
        cx="100"
        cy="140"
        rx="60"
        ry="16"
        fill="var(--viz-hot)"
        opacity="0.8"
        stroke="var(--viz-stroke)"
      />
      <circle cx="100" cy="30" r="4" fill="var(--viz-stroke)" />
      <text x="115" y="28" className="viz-label" fontSize="12">
        apex
      </text>
      <text x="100" y="175" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Cone — tip + circular base
      </text>
    </svg>
  );
}

function PyramidDiagram() {
  return (
    <svg viewBox="0 0 220 200" className="viz-svg">
      <polygon
        points="110,25 40,150 180,150"
        fill="var(--viz-cool)"
        opacity="0.6"
        stroke="var(--viz-stroke)"
        strokeWidth="2"
      />
      <polygon
        points="110,25 180,150 200,120 110,25"
        fill="var(--viz-hot)"
        opacity="0.75"
        stroke="var(--viz-stroke)"
      />
      <polygon
        points="40,150 70,130 200,120 180,150"
        fill="#a78bfa"
        opacity="0.5"
        stroke="var(--viz-stroke)"
      />
      <text x="110" y="180" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        Square pyramid — 5 faces
      </text>
    </svg>
  );
}

function CompassDiagram() {
  return (
    <svg viewBox="0 0 220 220" className="viz-svg">
      <circle
        cx="110"
        cy="110"
        r="75"
        fill="var(--surface-2)"
        stroke="var(--viz-stroke)"
        strokeWidth="3"
      />
      <circle cx="110" cy="110" r="8" fill="var(--viz-hot)" />
      {/* N needle */}
      <polygon points="110,40 100,110 120,110" fill="#ef4444" />
      <polygon points="110,180 100,110 120,110" fill="#94a3b8" />
      <polygon points="40,110 110,100 110,120" fill="#64748b" />
      <polygon points="180,110 110,100 110,120" fill="#64748b" />
      <text x="110" y="32" textAnchor="middle" className="viz-label" fontSize="16" fontWeight="700" fill="#ef4444">
        N
      </text>
      <text x="110" y="205" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        S
      </text>
      <text x="22" y="115" className="viz-label" fontSize="14" fontWeight="700">
        W
      </text>
      <text x="188" y="115" className="viz-label" fontSize="14" fontWeight="700">
        E
      </text>
    </svg>
  );
}
