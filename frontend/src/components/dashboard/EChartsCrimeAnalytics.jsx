import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { Activity, PieChart as PieIcon, Clock, Sparkles } from 'lucide-react';

export default function EChartsCrimeAnalytics({
  trendData = [],
  typeData = [],
  stationData = [],
  loading = false,
}) {
  const trendChartRef = useRef(null);
  const typeChartRef = useRef(null);
  const stationChartRef = useRef(null);

  const trendInstance = useRef(null);
  const typeInstance = useRef(null);
  const stationInstance = useRef(null);

  // 1. Initialize & Update ECharts Trend Chart (Smooth Spline with dataZoom)
  useEffect(() => {
    if (!trendChartRef.current) return;
    if (!trendInstance.current) {
      trendInstance.current = echarts.init(trendChartRef.current);
    }

    const dates = trendData.map((d) => d.date || d.incident_date);
    const counts = trendData.map((d) => d.count || d.incidents || 0);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: { backgroundColor: '#1e3a8a' },
        },
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        textStyle: { color: '#0f172a', fontFamily: 'monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
      },
      grid: {
        top: 25,
        left: 35,
        right: 20,
        bottom: 50,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'monospace' },
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          height: 18,
          bottom: 10,
          borderColor: '#e2e8f0',
          backgroundColor: '#f8fafc',
          fillerColor: 'rgba(29, 78, 216, 0.15)',
          handleStyle: { color: '#1d4ed8' },
          textStyle: { color: '#64748b', fontSize: 9 },
        },
      ],
      series: [
        {
          name: 'Incidents',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: counts,
          lineStyle: { width: 2.5, color: '#1d4ed8' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(29, 78, 216, 0.35)' },
              { offset: 1, color: 'rgba(29, 78, 216, 0.02)' },
            ]),
          },
        },
      ],
    };

    trendInstance.current.setOption(option);
  }, [trendData]);

  // 2. Initialize & Update ECharts Type Donut Chart
  useEffect(() => {
    if (!typeChartRef.current) return;
    if (!typeInstance.current) {
      typeInstance.current = echarts.init(typeChartRef.current);
    }

    const pieData = typeData.map((t) => ({
      name: t.name || t.crime_type,
      value: t.count || t.incidents || 0,
    }));

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: '{b}: <strong>{c}</strong> ({d}%)',
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        textStyle: { color: '#0f172a', fontFamily: 'monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
      },
      legend: {
        show: false,
      },
      color: ['#1d4ed8', '#0284c7', '#4338ca', '#0d9488', '#475569', '#2563eb', '#0891b2'],
      series: [
        {
          name: 'Classification',
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              fontFamily: 'monospace',
              color: '#1e3a8a',
            },
          },
          data: pieData,
        },
      ],
    };

    typeInstance.current.setOption(option);
  }, [typeData]);

  // 3. Initialize & Update ECharts Station Bar Chart (Horizontal Workload)
  useEffect(() => {
    if (!stationChartRef.current) return;
    if (!stationInstance.current) {
      stationInstance.current = echarts.init(stationChartRef.current);
    }

    const sortedStations = [...stationData].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 8);
    const stationNames = sortedStations.map((s) => (s.name || s.station_name || '').replace(' Police Station', ''));
    const stationCounts = sortedStations.map((s) => s.count || 0);

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        textStyle: { color: '#0f172a', fontFamily: 'monospace', fontSize: 11 },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);',
      },
      grid: {
        top: 15,
        left: 85,
        right: 25,
        bottom: 25,
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 9, fontFamily: 'monospace' },
      },
      yAxis: {
        type: 'category',
        data: stationNames.reverse(),
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#334155', fontSize: 10, fontFamily: 'monospace' },
      },
      series: [
        {
          name: 'Case Load',
          type: 'bar',
          data: stationCounts.reverse(),
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#1e3a8a' },
              { offset: 1, color: '#0284c7' },
            ]),
          },
        },
      ],
    };

    stationInstance.current.setOption(option);
  }, [stationData]);

  // Window resize observer
  useEffect(() => {
    const handleResize = () => {
      trendInstance.current?.resize();
      typeInstance.current?.resize();
      stationInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      trendInstance.current?.dispose();
      typeInstance.current?.dispose();
      stationInstance.current?.dispose();
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-blue-50/80 rounded-xl border border-blue-200 text-xs font-mono">
        <div className="flex items-center space-x-2 text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <span className="font-bold tracking-wide">APACHE ECHARTS ENTERPRISE SUITE</span>
          <span className="text-blue-300">•</span>
          <span className="text-slate-600 font-sans">High-DPI WebGL Accelerated Charting</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-semibold">
          Hardware Accelerated
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Chart 1: Interactive Temporal Trend with Range Slider */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                1. High-Precision Trend
              </h3>
              <p className="text-[10px] text-slate-500">Interactive zoom timeline</p>
            </div>
            <Activity className="w-4 h-4 text-blue-700" />
          </div>
          <div ref={trendChartRef} className="h-56 w-full" />
        </div>

        {/* Chart 2: Category Donut with Hover Expansion */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                2. Classification Donut
              </h3>
              <p className="text-[10px] text-slate-500">Interactive category radial</p>
            </div>
            <PieIcon className="w-4 h-4 text-sky-700" />
          </div>
          <div ref={typeChartRef} className="h-56 w-full" />
        </div>

        {/* Chart 3: Police Station Workload Horizontal Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col">
          <div className="pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
                3. Station Workload Ranking
              </h3>
              <p className="text-[10px] text-slate-500">Territorial jurisdiction case load</p>
            </div>
            <Clock className="w-4 h-4 text-indigo-700" />
          </div>
          <div ref={stationChartRef} className="h-56 w-full" />
        </div>
      </div>
    </div>
  );
}
