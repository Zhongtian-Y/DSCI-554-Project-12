// src/components/ChoroplethMap.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ChoroplethMap = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 1120;  // Width of the SVG element
    const height = 700;  // Height of the SVG element

    // Create the SVG element inside a container group
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const projection = d3.geoMercator()
      .scale(150)  // Adjusted scale for the map size
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Load the JSON data
    Promise.all([
      d3.json(`${process.env.PUBLIC_URL}/countries-50m.json`),
      d3.json(`${process.env.PUBLIC_URL}/POP.DENSITY.json`)
    ]).then(([worldData, densityData]) => {
      // Convert population density data to a map for quick lookup
      const densityMap = {};
      densityData.forEach(d => {
        densityMap[d.country] = +d.density;
      });

      // Clear any existing content in SVG
      svg.selectAll('*').remove();

      // Create a logarithmic color scale for population density
      const colorScale = d3.scaleSequential(d3.interpolateYlGnBu)
        .domain([0, Math.log10(d3.max(densityData, d => d.density))]);

      // Create a tooltip for displaying population density information
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("visibility", "hidden")
        .style("font-size", "12px");

      // Draw the map countries
      const countries = topojson.feature(worldData, worldData.objects.countries).features;
      svg.selectAll('path')
        .data(countries)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', d => {
          const density = densityMap[d.properties.name];
          return density ? colorScale(Math.log10(density)) : '#ccc';  // Color based on log(density)
        })
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .on('mouseover', function (event, d) {
          const density = densityMap[d.properties.name];
          d3.select(this)
            .attr('stroke-width', 1.5)
            .attr('stroke', '#000');
          tooltip.style("visibility", "visible")
            .html(`<strong>${d.properties.name}</strong><br>Population Density: ${density ? density.toFixed(1) : 'N/A'} per km²`);
        })
        .on('mousemove', (event) => {
          tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('stroke-width', 0.5)
            .attr('stroke', '#333');
          tooltip.style("visibility", "hidden");
        })
        .on('click', function (event, d) {
          const density = densityMap[d.properties.name];
          alert(`Country: ${d.properties.name}\nPopulation Density: ${density ? density.toFixed(1) : 'N/A'} per km²`);
        });

      // Add a color legend
      const legendWidth = 1025; // Increased width for better spacing
      const legendHeight = 10;
      const legend = svg.append("g")
        .attr("transform", `translate(${width - legendWidth - 40}, ${height - 40})`);

      // Draw legend gradient
      const defs = svg.append("defs");
      const linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

      // Use logarithmic ticks for legend
      const logTicks = d3.scaleLog().domain([1, d3.max(densityData, d => d.density)]).ticks(5);
      linearGradient.selectAll("stop")
        .data(logTicks.map((t, i, n) => ({
          offset: `${(100 * i) / n.length}%`,
          color: colorScale(Math.log10(t))
        })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#linear-gradient)");

      // Add legend labels with logarithmic scale and rotate 45 degrees
      const legendScale = d3.scaleLog()
        .domain([1, d3.max(densityData, d => d.density)])
        .range([0, legendWidth]);

      legend.append("g")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(d3.axisBottom(legendScale)
          .ticks(5, ".1s")
          .tickFormat(d => `${d}`)
        )
        .style("font-size", "12px")
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");   // Align text for readability
    }).catch(error => {
      console.error("Error loading the JSON files:", error);
    });

  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Choropleth Map - World Population Density</h2>
      <div style={{
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto',
        overflow: 'hidden',
        border: '1px solid #ccc',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
      }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default ChoroplethMap;
