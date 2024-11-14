// src/App.js
import React from 'react';
import Treemap from './components/Treemap';
import StackedBarChart from './components/StackedBarChart';
import DonutChart from './components/DonutChart';
import MultiLineChart from './components/MultiLineChart';
import ParallelCoordinatesChart from './components/ParallelCoordinatesChart';
import DifferenceChart from './components/DifferenceChart';
import SunburstChart from './components/SunburstChart'; 
import CirclePacking from './components/CirclePacking';
import ChordDiagram from './components/ChordDiagram';
import ForceDirectedGraph from './components/ForceDirectedGraph';
import ProportionalSymbolMap from './components/ProportionalSymbolMap';
import ChoroplethMap from './components/ChoroplethMap';
import DotMap from './components/DotMap';
// import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <div className="App">
      <DotMap />
      <ChoroplethMap />
      <ProportionalSymbolMap />
      <Treemap />
      <CirclePacking />
      <SunburstChart />
      <ChordDiagram />
      <ForceDirectedGraph />
      <StackedBarChart />
      <DonutChart />
      <MultiLineChart />
      <ParallelCoordinatesChart />
      <DifferenceChart />
    </div>
  );
};

export default App;
