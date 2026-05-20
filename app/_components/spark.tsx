type SparkProps = {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  /** show a horizontal baseline at 0 */
  baseline?: boolean;
};

/** Tiny sparkline SVG. data is normalized to fit the view. */
export function Spark({
  data,
  width = 160,
  height = 44,
  stroke = "#e8a33d",
  fill,
  className = "",
  baseline = false,
}: SparkProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padX = 2;
  const padY = 4;
  const stepX = (width - padX * 2) / Math.max(1, data.length - 1);

  const points = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const area =
    `M ${points[0][0]} ${height - padY} ` +
    points.map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ") +
    ` L ${points[points.length - 1][0]} ${height - padY} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="trend"
    >
      {baseline && (
        <line
          x1="0"
          x2={width}
          y1={height - padY}
          y2={height - padY}
          stroke="rgba(239,234,224,0.1)"
          strokeWidth="0.5"
        />
      )}
      {fill && <path d={area} fill={fill} opacity="0.35" />}
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
      {/* terminal dot */}
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r="2"
        fill={stroke}
      />
    </svg>
  );
}

/**
 * Bar / histogram for supply-demand style displays.
 */
export function MicroBars({
  data,
  width = 160,
  height = 44,
  color = "#46bfa8",
  className = "",
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  const max = Math.max(...data);
  const gap = 1;
  const barW = (width - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className}>
      {data.map((v, i) => {
        const h = (v / max) * (height - 2);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h}
            fill={color}
            opacity={0.4 + (v / max) * 0.6}
          />
        );
      })}
    </svg>
  );
}
