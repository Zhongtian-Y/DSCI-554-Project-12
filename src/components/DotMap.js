// src/components/DotMap.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const DotMap = () => {
  const svgRef = useRef();

  useEffect(() => {
    const width = 1120;
    const height = 700;

    // Create the SVG element and a background for oceans
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .style("background", "#E6F0FA"); // Light blue for ocean

    const projection = d3.geoMercator()
      .scale(150)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    // Load JSON data
    Promise.all([
      d3.json(`${process.env.PUBLIC_URL}/countries-50m.json`),
      d3.json(`${process.env.PUBLIC_URL}/AIRPORT.DIST.json`)
    ]).then(([worldData, airportData]) => {
      // Clear any existing content
      svg.selectAll('*').remove();

      // Define color scale for major and minor airports
      const colorScale = d3.scaleOrdinal()
        .domain(['major', 'minor'])
        .range(['red', 'blue']);

      // Create tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("visibility", "hidden")
        .style("font-size", "12px");

      // Draw countries
      const countries = topojson.feature(worldData, worldData.objects.countries).features;
      svg.selectAll('path')
        .data(countries)
        .enter().append('path')
        .attr('d', path)
        .attr('fill', '#ccc')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5);

      // Define shadow for airport circles
      svg.append("defs").append("filter")
        .attr("id", "drop-shadow")
        .append("feDropShadow")
        .attr("dx", 1)
        .attr("dy", 1)
        .attr("stdDeviation", 1)
        .attr("flood-color", "black")
        .attr("flood-opacity", 0.3);

      // Draw airport points
      svg.selectAll('circle')
        .data(airportData)
        .enter().append('circle')
        .attr('cx', d => projection([d._geoloc.lng, d._geoloc.lat])[0])
        .attr('cy', d => projection([d._geoloc.lng, d._geoloc.lat])[1])
        .attr('r', d => d.size > 100 ? 5 : 3)  // Larger for major airports
        .attr('fill', d => colorScale(d.type))  // Color based on airport type
        .style("filter", "url(#drop-shadow)")  // Add shadow
        .attr('opacity', 0.8)
        .on('mouseover', function (event, d) {
          d3.select(this).transition().duration(200).attr('r', d.size > 100 ? 7 : 5);  // Enlarge on hover
          tooltip.style("visibility", "visible")
            .html(`
              <strong>${d.name}</strong><br>
              ${d.city}, ${d.country}<br>
              Code: ${d.iata_code || 'N/A'}
            `);
        })
        .on('mousemove', (event) => {
          tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
        })
        .on('mouseout', function () {
          d3.select(this).transition().duration(200).attr('r', d => d.size > 100 ? 5 : 3);  // Return to original size
          tooltip.style("visibility", "hidden");
        })
        .on('click', function (event, d) {
          alert(`Airport: ${d.name}\nLocation: ${d.city}, ${d.country}\nCode: ${d.iata_code}`);
        });

      // Add zoom functionality within the container box
      svg.call(d3.zoom()
        .scaleExtent([1, 8])  // Limit zoom range
        .translateExtent([[0, 0], [width, height]])  // Prevent panning outside the map
        .on('zoom', ({ transform }) => {
          svg.selectAll('path').attr('transform', transform);
          svg.selectAll('circle').attr('transform', transform);
        }));
    });
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Dot Map - World Airport Distribution</h2>
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

export default DotMap;
