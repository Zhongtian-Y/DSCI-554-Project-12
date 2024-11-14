// src/App.js

import React from 'react';
import DonutChart from './components/DonutChart';
import SunburstChart from './components/SunburstChart'; 
import ProportionalSymbolMap from './components/ProportionalSymbolMap';

// import './App.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <div className="App">
      <ProportionalSymbolMap />
      <SunburstChart />
      <DonutChart />
    </div>
  );
};

export default App;
