"use client";

/**
 * Interactive educational visual for every lesson.
 * Works with pure SVG/CSS — no GLB file required.
 * Optional modelSrc still enables model-viewer AR when a real .glb exists.
 */

type Props = {
  lessonId: string;
  title: string;
  topic: string;
  modelSrc?: string;
};

export default function LessonVisual({
  lessonId,
  title,
  topic,
  modelSrc,
}: Props) {
  return (
    <div className="lesson-visual">
      <div className="visual-canvas" aria-label={`Interactive scene: ${title}`}>
        {renderScene(lessonId, topic)}
      </div>
      <p className="scene-note">
        Explore the picture above — tap or look at the highlighted parts.
        {modelSrc
          ? " On a supported phone you can also open the 3D model in AR below."
          : ""}
      </p>
    </div>
  );
}

function renderScene(id: string, topic: string) {
  switch (id) {
    case "fractions-halves":
      return <FractionPizza slices={2} highlight={1} label="1/2" />;
    case "fractions-quarters":
      return <FractionPizza slices={4} highlight={1} label="1/4" />;
    case "fractions-compare":
      return <CompareBars />;
    case "fractions-add-same":
      return <FractionPizza slices={7} highlight={5} label="5/7" />;
    case "geometry-shapes":
      return <ShapesScene />;
    case "geometry-perimeter":
      return <RectScene mode="perimeter" />;
    case "geometry-area":
      return <RectScene mode="area" />;
    case "geometry-angles":
      return <AnglesScene />;
    case "decimals-tenths":
      return <NumberLine value={0.7} />;
    case "percentages-basics":
    case "percentages-increase":
      return <PercentBar percent={50} />;
    case "ratios-simplify":
      return <RatioCounters red={2} blue={3} />;
    default:
      return topic === "fractions" ? (
        <FractionPizza slices={4} highlight={1} label="?" />
      ) : (
        <ShapesScene />
      );
  }
}

function FractionPizza({
  slices,
  highlight,
  label,
}: {
  slices: number;
  highlight: number;
  label: string;
}) {
  const r = 90;
  const cx = 120;
  const cy = 110;
  const paths = [];
  for (let i = 0; i < slices; i++) {
    const a0 = (i / slices) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / slices) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = slices === 2 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
    paths.push(
      <path
        key={i}
        d={d}
        fill={i < highlight ? "var(--viz-hot)" : "var(--viz-cool)"}
        stroke="var(--viz-stroke)"
        strokeWidth="2"
      />,
    );
  }
  return (
    <svg viewBox="0 0 240 220" className="viz-svg">
      {paths}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--viz-stroke)"
        strokeWidth="3"
      />
      <text
        x={cx}
        y={cy + 6}
        textAnchor="middle"
        className="viz-label"
        fontSize="22"
        fontWeight="700"
      >
        {label}
      </text>
    </svg>
  );
}

function CompareBars() {
  return (
    <svg viewBox="0 0 280 160" className="viz-svg">
      <text x="20" y="28" className="viz-label" fontSize="14">
        1/2
      </text>
      <rect
        x="60"
        y="12"
        width="160"
        height="28"
        rx="6"
        fill="var(--viz-hot)"
      />
      <text x="20" y="78" className="viz-label" fontSize="14">
        1/4
      </text>
      <rect
        x="60"
        y="62"
        width="80"
        height="28"
        rx="6"
        fill="var(--viz-cool)"
      />
      <text x="60" y="120" className="viz-label" fontSize="15" fontWeight="600">
        1/2 is larger than 1/4
      </text>
    </svg>
  );
}

function ShapesScene() {
  return (
    <svg viewBox="0 0 320 180" className="viz-svg">
      <polygon
        points="50,140 90,50 130,140"
        fill="var(--viz-hot)"
        stroke="var(--viz-stroke)"
      />
      <text x="90" y="165" textAnchor="middle" className="viz-label" fontSize="12">
        Triangle
      </text>
      <rect
        x="150"
        y="60"
        width="70"
        height="70"
        fill="var(--viz-cool)"
        stroke="var(--viz-stroke)"
      />
      <text x="185" y="165" textAnchor="middle" className="viz-label" fontSize="12">
        Square
      </text>
      <circle
        cx="270"
        cy="95"
        r="40"
        fill="#a78bfa"
        stroke="var(--viz-stroke)"
      />
      <text x="270" y="165" textAnchor="middle" className="viz-label" fontSize="12">
        Circle
      </text>
    </svg>
  );
}

function RectScene({ mode }: { mode: "perimeter" | "area" }) {
  return (
    <svg viewBox="0 0 280 180" className="viz-svg">
      <rect
        x="40"
        y="40"
        width="180"
        height="90"
        fill={mode === "area" ? "var(--viz-hot)" : "transparent"}
        stroke="var(--viz-stroke)"
        strokeWidth="4"
      />
      <text x="130" y="30" textAnchor="middle" className="viz-label" fontSize="13">
        length = 6
      </text>
      <text
        x="230"
        y="90"
        textAnchor="start"
        className="viz-label"
        fontSize="13"
      >
        width = 4
      </text>
      <text x="130" y="165" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="600">
        {mode === "perimeter"
          ? "Perimeter = 2 × (6 + 4) = 20"
          : "Area = 6 × 4 = 24"}
      </text>
    </svg>
  );
}

function AnglesScene() {
  return (
    <svg viewBox="0 0 300 160" className="viz-svg">
      {/* right angle */}
      <path
        d="M 40 120 L 40 50 L 110 50"
        fill="none"
        stroke="var(--viz-hot)"
        strokeWidth="4"
      />
      <rect x="40" y="50" width="14" height="14" fill="none" stroke="var(--viz-hot)" />
      <text x="55" y="140" className="viz-label" fontSize="12">
        Right 90°
      </text>
      {/* acute */}
      <path
        d="M 150 120 L 150 50 L 200 100"
        fill="none"
        stroke="var(--viz-cool)"
        strokeWidth="4"
      />
      <text x="155" y="140" className="viz-label" fontSize="12">
        Acute
      </text>
      {/* obtuse */}
      <path
        d="M 230 120 L 230 50 L 280 90"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="4"
      />
      <text x="235" y="140" className="viz-label" fontSize="12">
        Obtuse
      </text>
    </svg>
  );
}

function NumberLine({ value }: { value: number }) {
  const x = 30 + value * 200;
  return (
    <svg viewBox="0 0 260 100" className="viz-svg">
      <line
        x1="30"
        y1="50"
        x2="230"
        y2="50"
        stroke="var(--viz-stroke)"
        strokeWidth="3"
      />
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line
            x1={30 + t * 200}
            y1="42"
            x2={30 + t * 200}
            y2="58"
            stroke="var(--viz-stroke)"
            strokeWidth="2"
          />
          <text
            x={30 + t * 200}
            y="78"
            textAnchor="middle"
            className="viz-label"
            fontSize="12"
          >
            {t}
          </text>
        </g>
      ))}
      <circle cx={x} cy="50" r="10" fill="var(--viz-hot)" />
      <text x={x} y="28" textAnchor="middle" className="viz-label" fontSize="14" fontWeight="700">
        {value}
      </text>
    </svg>
  );
}

function PercentBar({ percent }: { percent: number }) {
  return (
    <svg viewBox="0 0 280 100" className="viz-svg">
      <rect
        x="20"
        y="30"
        width="240"
        height="36"
        rx="8"
        fill="var(--viz-cool)"
      />
      <rect
        x="20"
        y="30"
        width={(percent / 100) * 240}
        height="36"
        rx="8"
        fill="var(--viz-hot)"
      />
      <text x="140" y="54" textAnchor="middle" className="viz-label" fontSize="16" fontWeight="700">
        {percent}%
      </text>
      <text x="140" y="88" textAnchor="middle" className="viz-label" fontSize="13">
        {percent} out of 100
      </text>
    </svg>
  );
}

function RatioCounters({ red, blue }: { red: number; blue: number }) {
  const dots = [];
  for (let i = 0; i < red; i++) {
    dots.push(
      <circle
        key={`r${i}`}
        cx={40 + i * 36}
        cy={50}
        r="14"
        fill="var(--viz-hot)"
      />,
    );
  }
  for (let i = 0; i < blue; i++) {
    dots.push(
      <circle
        key={`b${i}`}
        cx={40 + i * 36}
        cy={100}
        r="14"
        fill="var(--viz-cool)"
      />,
    );
  }
  return (
    <svg viewBox="0 0 220 140" className="viz-svg">
      {dots}
      <text x="110" y="130" textAnchor="middle" className="viz-label" fontSize="15" fontWeight="600">
        {red}:{blue}
      </text>
    </svg>
  );
}
