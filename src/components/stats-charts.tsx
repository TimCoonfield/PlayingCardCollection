"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface RankedDatum {
  label: string;
  count: number;
  href?: string;
}

const tooltipStyle = {
  backgroundColor: "#2b5b43",
  border: "1px solid #3a6650",
  borderRadius: 6,
  fontSize: 12,
  color: "#f3ead1",
};

interface TickProps {
  x?: number | string;
  y?: number | string;
  payload?: { value?: number | string };
}

function isActivationKey(key: string) {
  return key === "Enter" || key === " ";
}

function makeClickableTick(onLabelClick: (label: string) => void) {
  function ClickableTick({ x = 0, y = 0, payload }: TickProps) {
    if (!payload || payload.value === undefined) return null;
    const label = String(payload.value);
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill="#b9c9ba"
        fontSize={12}
        cursor="pointer"
        role="link"
        tabIndex={0}
        aria-label={`Browse decks by ${label}`}
        onClick={() => onLabelClick(label)}
        onKeyDown={(event) => {
          if (isActivationKey(event.key)) onLabelClick(label);
        }}
      >
        {payload.value}
      </text>
    );
  }
  return ClickableTick;
}

function makeClickableYearTick(
  data: RankedDatum[],
  onLabelClick: (label: string) => void
) {
  function ClickableYearTick({ x = 0, y = 0, payload }: TickProps) {
    if (!payload || payload.value === undefined) return null;
    const label = String(payload.value);
    const isNavigable = Boolean(data.find((item) => item.label === label)?.href);

    return (
      <text
        x={x}
        y={y}
        dy={10}
        transform={`rotate(-45 ${x} ${y})`}
        textAnchor="end"
        fill="#b9c9ba"
        fontSize={11}
        cursor={isNavigable ? "pointer" : undefined}
        role={isNavigable ? "link" : undefined}
        tabIndex={isNavigable ? 0 : undefined}
        aria-label={isNavigable ? `Browse decks released ${label}` : undefined}
        onClick={isNavigable ? () => onLabelClick(label) : undefined}
        onKeyDown={isNavigable ? (event) => {
          if (isActivationKey(event.key)) onLabelClick(label);
        } : undefined}
      >
        {label}
      </text>
    );
  }
  return ClickableYearTick;
}

export function HorizontalRankedChart({
  data,
  color,
  height = 320,
  linkParam,
}: {
  data: RankedDatum[];
  color: string;
  height?: number;
  /** When provided (e.g. "designer"), bars and axis labels link to /collection?<linkParam>=<label>. */
  linkParam?: string;
}) {
  const router = useRouter();

  function handleClick(label: string) {
    const datum = data.find((item) => item.label === label);
    const href = datum?.href ??
      (linkParam ? `/collection?${linkParam}=${encodeURIComponent(label)}` : undefined);
    if (href) router.push(href);
  }

  const isNavigable = Boolean(linkParam || data.some((item) => item.href));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#3a6650" strokeWidth={1} />
        <XAxis type="number" hide domain={[0, (max: number) => Math.ceil(max * 1.15)]} />
        <YAxis
          type="category"
          dataKey="label"
          width={140}
          tick={isNavigable ? makeClickableTick(handleClick) : { fill: "#b9c9ba", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f3ead108" }}
          contentStyle={tooltipStyle}
          formatter={(value) => [value, "Decks"] as [number, string]}
        />
        <Bar
          dataKey="count"
          radius={[0, 4, 4, 0]}
          maxBarSize={20}
          isAnimationActive={false}
          cursor={isNavigable ? "pointer" : undefined}
          onClick={isNavigable ? (_, index) => handleClick(data[index].label) : undefined}
        >
          {data.map((d) => (
            <Cell key={d.label} fill={color} />
          ))}
          <LabelList dataKey="count" position="right" fill="#f3ead1" fontSize={12} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function YearHistogramChart({
  data,
  color,
  height = 280,
}: {
  data: RankedDatum[];
  color: string;
  height?: number;
}) {
  const router = useRouter();

  function handleClick(label: string) {
    const href = data.find((item) => item.label === label)?.href;
    if (href) router.push(href);
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 4, right: 4, top: 16, bottom: 36 }}>
        <CartesianGrid vertical={false} stroke="#3a6650" strokeWidth={1} />
        <XAxis
          dataKey="label"
          interval={0}
          height={50}
          tick={makeClickableYearTick(data, handleClick)}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.15)]} />
        <Tooltip
          cursor={{ fill: "#f3ead108" }}
          contentStyle={tooltipStyle}
          formatter={(value) => [value, "Decks"] as [number, string]}
        />
        <Bar
          dataKey="count"
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
          cursor="pointer"
          onClick={(_, index) => handleClick(data[index].label)}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_RADIAN = Math.PI / 180;

interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  outerRadius?: number;
  percent?: number;
  name?: string | number;
  value?: number;
}

function makePieLabelRenderer(onLabelClick?: (label: string) => void) {
  return function renderPieLabel(props: PieLabelProps) {
    const { name, value } = props;
    const cx = props.cx ?? 0;
    const cy = props.cy ?? 0;
    const midAngle = props.midAngle ?? 0;
    const outerRadius = props.outerRadius ?? 0;
    const percent = props.percent ?? 0;
    const radius = outerRadius + 22;
    const x = cx + radius * Math.cos(-midAngle * PIE_RADIAN);
    const y = cy + radius * Math.sin(-midAngle * PIE_RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#f3ead1"
        fontSize={12}
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        cursor={onLabelClick ? "pointer" : undefined}
        role={onLabelClick ? "link" : undefined}
        tabIndex={onLabelClick ? 0 : undefined}
        aria-label={onLabelClick ? `Browse ${name} decks` : undefined}
        onClick={onLabelClick ? () => onLabelClick(String(name)) : undefined}
        onKeyDown={onLabelClick ? (event) => {
          if (isActivationKey(event.key)) onLabelClick(String(name));
        } : undefined}
      >
        {`${name}: ${value} (${Math.round(percent * 100)}%)`}
      </text>
    );
  };
}

export function PieBreakdownChart({
  data,
  colors,
  height = 320,
  linkParam,
}: {
  data: RankedDatum[];
  colors: string[];
  height?: number;
  /** When provided (e.g. "tag"), slices/labels/legend link to /collection?<linkParam>=<label>. */
  linkParam?: string;
}) {
  const router = useRouter();

  function handleClick(label: string) {
    const datum = data.find((item) => item.label === label);
    const href = datum?.href ??
      (linkParam ? `/collection?${linkParam}=${encodeURIComponent(label)}` : undefined);
    if (href) router.push(href);
  }

  const isNavigable = Boolean(linkParam || data.some((item) => item.href));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart margin={{ top: 8, bottom: 8, left: 24, right: 24 }}>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={Math.round(height * 0.28)}
          isAnimationActive={false}
          label={makePieLabelRenderer(isNavigable ? handleClick : undefined)}
          labelLine
          stroke="#234f3a"
          strokeWidth={2}
          cursor={isNavigable ? "pointer" : undefined}
          onClick={isNavigable ? (entry) => handleClick(String(entry.name)) : undefined}
        >
          {data.map((d, i) => (
            <Cell key={d.label} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [value, "Decks"] as [number, string]}
        />
        <Legend
          verticalAlign="bottom"
          height={32}
          onClick={isNavigable ? (entry) => handleClick(String(entry.value)) : undefined}
          formatter={(value) => (
            <span className={isNavigable ? "cursor-pointer text-felt-sub" : "text-felt-sub"}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
