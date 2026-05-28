// Temporary declaration to satisfy TypeScript for dynamic import of chart.js/auto
// Install `chart.js` as a dependency to use the real library at runtime.

declare module 'chart.js/auto' {
  const Chart: any;
  export default Chart;
}
