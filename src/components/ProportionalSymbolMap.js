import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const ProportionalSymbolMap = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 1120; // Increased width for a larger map
    const height = 700; // Increased height for a larger map

    // Create the SVG element inside a container group
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const projection = d3.geoMercator()
      .scale(200) // Adjusted scale for the larger map
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Load both JSON files dynamically
    Promise.all([
      d3.json(`${process.env.PUBLIC_URL}/countries-50m.json`),
      d3.json(`${process.env.PUBLIC_URL}/POP.json`)
    ]).then(([worldData, populationData]) => {
      // Map population data for quick lookup
      const populationMap = {};
      populationData.forEach(d => {
        populationMap[d.country] = +d.population;
      });

      // Clear any existing content in SVG
      svg.selectAll('*').remove();

      // Create a container group for zooming and panning
      const g = svg.append("g");

      // Set up zoom functionality within the container
      const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Set zoom limits
        .translateExtent([[0, 0], [width, height]]) // Limit panning
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      svg.call(zoom);

      // Draw map background
      g.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#eef3f7");

      // Draw map countries
      const countries = topojson.feature(worldData, worldData.objects.countries).features;
      g.selectAll('path')
        .data(countries)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', '#ccc')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5);

      // Tooltip for population
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "6px 12px")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("visibility", "hidden")
        .style("font-size", "12px");

      // Add dots for population with scaled size and interaction
      g.selectAll('circle')
        .data(countries)
        .enter().append('circle')
        .attr('cx', d => {
          const coords = projection(d3.geoCentroid(d));
          return coords ? coords[0] : null;
        })
        .attr('cy', d => {
          const coords = projection(d3.geoCentroid(d));
          return coords ? coords[1] : null;
        })
        .attr('r', d => {
          const population = populationMap[d.properties.name];
          return population ? Math.sqrt(population) * 0.002 : 0; // Increased dot size
        })
        .attr('fill', 'steelblue')
        .attr('opacity', 0.8)
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5)
        .on('mouseover', function (event, d) {
          const population = populationMap[d.properties.name] || 'N/A';
          d3.select(this)
            .attr('fill', 'orange');
          tooltip.style("visibility", "visible")
            .html(`<strong>${d.properties.name}</strong><br>Population: ${Number(population).toLocaleString()}`);
        })
        .on('mousemove', (event) => {
          tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
        })
        .on('mouseout', function () {
          d3.select(this)
            .attr('fill', 'steelblue');
          tooltip.style("visibility", "hidden");
        })
        .on('click', function (event, d) {
          const population = populationMap[d.properties.name] || 'N/A';
          alert(`Country: ${d.properties.name}\nPopulation: ${Number(population).toLocaleString()}`);
        });
    }).catch(error => {
      console.error("Error loading the JSON files:", error);
    });

  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Proportional Symbol Map - World Population</h2>
      <div style={{
        width: '100%',
        maxWidth: '1120px',
        margin: '0 auto',
        overflow: 'hidden', // Constrain the zoom within the container
        border: '1px solid #ccc', // Optional border for clarity
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)', // Optional shadow for visual appeal
      }}>
        <svg ref={svgRef}></svg>
      </div>
    </div>
  );
};

export default ProportionalSymbolMap;
