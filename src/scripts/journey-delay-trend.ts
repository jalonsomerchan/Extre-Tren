import {
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);

interface DelayChartPayload {
  labels: string[];
  values: Array<number | null>;
  maxMagnitude: number;
  minutesLabel: string;
  unknownLabel: string;
}

interface ChartColors {
  border: string;
  borderStrong: string;
  early: string;
  late: string;
  muted: string;
  onTime: string;
  primary: string;
  soft: string;
  surface: string;
  text: string;
}

const readToken = (styles: CSSStyleDeclaration, name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;

const readColors = (): ChartColors => {
  const styles = getComputedStyle(document.documentElement);
  return {
    border: readToken(styles, '--color-border', '#e2e8f0'),
    borderStrong: readToken(styles, '--color-border-strong', '#cbd5e1'),
    early: readToken(styles, '--color-info', '#0284c7'),
    late: readToken(styles, '--color-delay-minor', '#d97706'),
    muted: readToken(styles, '--color-text-muted', '#475569'),
    onTime: readToken(styles, '--color-delay-on-time', '#16a34a'),
    primary: readToken(styles, '--color-primary', '#2563eb'),
    soft: readToken(styles, '--color-text-soft', '#64748b'),
    surface: readToken(styles, '--color-surface', '#ffffff'),
    text: readToken(styles, '--color-text', '#0f172a'),
  };
};

const formatValue = (value: number | null, payload: DelayChartPayload) => {
  if (value === null) return payload.unknownLabel;
  return `${value > 0 ? '+' : ''}${value} ${payload.minutesLabel}`;
};

const getPointColors = (values: Array<number | null>, colors: ChartColors) => values.map((value) => {
  if (value === null) return colors.soft;
  if (value > 0) return colors.late;
  if (value < 0) return colors.early;
  return colors.onTime;
});

const canvases = document.querySelectorAll<HTMLCanvasElement>('[data-journey-delay-chart]');

canvases.forEach((canvas) => {
  const payload = JSON.parse(canvas.dataset.journeyDelayChart ?? '{}') as DelayChartPayload;
  let colors = readColors();
  const pointColors = () => getPointColors(payload.values, colors);

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: payload.labels,
      datasets: [{
        data: payload.values,
        borderColor: colors.primary,
        borderWidth: 2,
        fill: false,
        pointBackgroundColor: pointColors(),
        pointBorderColor: colors.surface,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointRadius: 4,
        tension: 0.25,
      }],
    },
    options: {
      animation: { duration: 180 },
      interaction: { intersect: false, mode: 'index' },
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => formatValue(context.parsed.y, payload),
          },
          displayColors: false,
        },
      },
      responsive: true,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            autoSkip: true,
            color: colors.muted,
            maxRotation: 0,
            maxTicksLimit: 8,
            minRotation: 0,
          },
        },
        y: {
          grid: {
            color: (context) => Number(context.tick.value) === 0 ? colors.borderStrong : colors.border,
            lineWidth: (context) => Number(context.tick.value) === 0 ? 2 : 1,
          },
          max: payload.maxMagnitude,
          min: -payload.maxMagnitude,
          ticks: {
            color: colors.soft,
            callback: (value) => `${Number(value) > 0 ? '+' : ''}${value} ${payload.minutesLabel}`,
            stepSize: 1,
          },
        },
      },
    },
  });
  chart.update('none');

  const refreshTheme = () => {
    colors = readColors();
    const dataset = chart.data.datasets[0];
    dataset.borderColor = colors.primary;
    dataset.pointBackgroundColor = pointColors();
    dataset.pointBorderColor = colors.surface;
    if (chart.options.scales?.x?.ticks) chart.options.scales.x.ticks.color = colors.muted;
    if (chart.options.scales?.y?.ticks) chart.options.scales.y.ticks.color = colors.soft;
    chart.update('none');
  };

  window.addEventListener('extretren:themechange', refreshTheme);
});
