type SkylineProps = {
  /** density tier — 0 empty plot, 1 town, 2 metropolis */
  density?: 0 | 1 | 2;
  /** show twinkling windows */
  alive?: boolean;
  /** color tint for buildings */
  tint?: "ink" | "amber";
  className?: string;
};

/**
 * A stylized city silhouette built from parametric rects with optional
 * twinkling windows. Three density tiers map to the trailer beats:
 * 0 = empty plot of land, 1 = early town, 2 = full metropolis.
 */
export function Skyline({
  density = 2,
  alive = true,
  tint = "ink",
  className = "",
}: SkylineProps) {
  const stroke = tint === "amber" ? "#b97a1f" : "#0a0e14";
  const fill = tint === "amber" ? "#1a1208" : "#070a0e";

  // Each building: [x, width, height, hasSmokestack]
  const buildings: Array<[number, number, number, boolean]> = [];
  if (density >= 1) {
    // village/town layer
    buildings.push(
      [60, 38, 60, false],
      [110, 30, 48, false],
      [150, 44, 72, false],
      [206, 34, 56, true],
      [250, 50, 88, false],
      [310, 28, 52, false],
      [345, 40, 70, false],
      [395, 32, 60, false],
      [435, 48, 96, true],
      [495, 30, 56, false],
      [535, 36, 72, false],
      [580, 28, 52, false],
      [615, 44, 80, false],
      [665, 30, 60, false],
    );
  }
  if (density >= 2) {
    // metropolis skyscrapers, overlaid
    buildings.push(
      [120, 28, 160, false],
      [180, 36, 220, false],
      [232, 32, 180, false],
      [284, 44, 260, false],
      [340, 28, 200, false],
      [378, 36, 240, false],
      [428, 30, 210, false],
      [468, 50, 290, false],
      [530, 32, 230, false],
      [576, 40, 270, false],
      [630, 28, 190, false],
      [672, 36, 250, false],
      [720, 30, 200, false],
      [758, 42, 280, false],
    );
  }

  const baseY = 360;
  const groundY = 372;

  return (
    <svg
      viewBox="0 0 820 380"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      role="img"
      aria-label="city silhouette"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b1422" />
          <stop offset="38%" stopColor="#1b2638" />
          <stop offset="68%" stopColor="#3a3a4d" />
          <stop offset="86%" stopColor="#c47a3a" />
          <stop offset="100%" stopColor="#f0b66a" />
        </linearGradient>
        <linearGradient id="amberHaze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(232,163,61,0)" />
          <stop offset="100%" stopColor="rgba(232,163,61,0.45)" />
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(239,234,224,0.05)" strokeWidth="0.5" />
        </pattern>
      </defs>

      {/* Sky */}
      <rect x="0" y="0" width="820" height="380" fill="url(#sky)" />

      {/* Sun disk at golden hour */}
      <circle cx="640" cy="320" r="28" fill="#f6c976" opacity="0.95" />
      <circle cx="640" cy="320" r="60" fill="#f6c976" opacity="0.18" />

      {/* Distant haze ridge */}
      <path
        d="M0 320 L 80 308 L 160 318 L 240 304 L 320 314 L 400 300 L 480 310 L 560 298 L 640 308 L 720 296 L 820 306 L 820 380 L 0 380 Z"
        fill="#28324a"
        opacity="0.55"
      />

      {/* Buildings */}
      {buildings.map(([x, w, h, hasStack], i) => {
        const y = baseY - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth="0.5" />
            {/* simple roofline detail */}
            <rect x={x + 2} y={y - 2} width={w - 4} height={2} fill={fill} />
            {hasStack && (
              <>
                <rect x={x + w - 8} y={y - 22} width="4" height="22" fill={fill} />
                <ellipse cx={x + w - 6} cy={y - 28} rx="10" ry="3" fill="rgba(239,234,224,0.08)" />
              </>
            )}
            {/* twinkling windows on tall buildings */}
            {alive && h > 100 &&
              Array.from({ length: Math.floor(h / 18) }).map((_, row) =>
                Array.from({ length: Math.max(1, Math.floor(w / 8)) }).map((_, col) => {
                  const wx = x + 3 + col * 8;
                  const wy = y + 8 + row * 18;
                  const lit = (i + row + col) % 5 < 3;
                  if (!lit || wx > x + w - 4 || wy > y + h - 6) return null;
                  return (
                    <rect
                      key={`${row}-${col}`}
                      x={wx}
                      y={wy}
                      width="2"
                      height="3"
                      fill="#f6c976"
                      opacity={0.4 + ((i * 7 + row * 3 + col) % 6) / 10}
                      className="animate-twinkle"
                      style={{ animationDelay: `${((i + row + col) % 6) * 0.4}s` }}
                    />
                  );
                }),
              )}
          </g>
        );
      })}

      {/* Foreground silhouette: trees / land */}
      {density === 0 && (
        <>
          <path
            d="M0 360 L 820 360 L 820 380 L 0 380 Z"
            fill="#0e1a14"
          />
          <g fill="#0a1410" opacity="0.9">
            <ellipse cx="180" cy="356" rx="18" ry="8" />
            <ellipse cx="220" cy="354" rx="22" ry="10" />
            <ellipse cx="540" cy="356" rx="14" ry="6" />
            <ellipse cx="620" cy="352" rx="26" ry="12" />
            <rect x="178" y="346" width="2" height="14" />
            <rect x="218" y="344" width="3" height="16" />
            <rect x="538" y="346" width="2" height="14" />
            <rect x="618" y="340" width="3" height="20" />
          </g>
        </>
      )}

      {/* Ground line */}
      <rect x="0" y={groundY} width="820" height="8" fill="#040608" />
      <rect x="0" y={groundY + 8} width="820" height={380 - (groundY + 8)} fill="#070a0e" />

      {/* Amber haze layer over base */}
      <rect x="0" y="280" width="820" height="100" fill="url(#amberHaze)" opacity="0.25" />

      {/* Subtle grid floor */}
      <rect x="0" y={groundY} width="820" height="380" fill="url(#grid)" />
    </svg>
  );
}
