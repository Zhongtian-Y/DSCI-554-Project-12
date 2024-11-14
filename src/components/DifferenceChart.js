// src/components/DifferenceChart.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const DifferenceChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Load the CSV data
    d3.csv(process.env.PUBLIC_URL + '/TEMP.DIFF.CHART.csv').then((loadedData) => {
      const parsedData = loadedData.map(d => ({
        date: d3.timeParse("%Y-%m-%d")(d.Date),
        USA: +d.USA_Temperature,
        China: +d.China_Temperature,
        Russia: +d.Russia_Temperature,
        Canada: +d.Canada_Temperature,
        India: +d.India_Temperature
      }));
      setData(parsedData);
    });
  }, []);

  useEffect(() => {
    if (!data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = 500;
    const margin = { top: 70, right: 50, bottom: 30, left: 50 };  // Reduced bottom margin to bring the chart closer to the legend

    // Set up scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => Math.min(d.USA, d.China, d.Russia, d.Canada, d.India)) - 5, 
               d3.max(data, d => Math.max(d.USA, d.China, d.Russia, d.Canada, d.India)) + 5])
      .range([height - margin.bottom, margin.top]);

    // Define color scale for countries
    const colorScale = d3.scaleOrdinal()
      .domain(["USA", "China", "Russia", "Canada", "India"])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]);

    // Append interactive tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("padding", "8px")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("border-radius", "4px")
      .style("visibility", "hidden");

    // Add areas between lines for difference
    ["USA", "China", "Russia", "Canada", "India"].forEach((country, i) => {
      svg.append("path")
        .datum(data)
        .attr("fill", colorScale(country))
        .attr("opacity", 0.3)
        .attr("d", d3.area()
          .x(d => xScale(d.date))
          .y0(d => yScale(d[country]))
          .y1(height - margin.bottom)
        );
    });

    // Add interactive lines
    ["USA", "China", "Russia", "Canada", "India"].forEach((country) => {
      svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colorScale(country))
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x(d => xScale(d.date))
          .y(d => yScale(d[country]))
        )
        .on("mouseover", () => tooltip.style("visibility", "visible"))
        .on("mousemove", (event, d) => {
          const [mouseX, mouseY] = d3.pointer(event);
          const date = xScale.invert(mouseX);
          const dateString = d3.timeFormat("%Y-%m-%d")(date);
          const temp = yScale.invert(mouseY).toFixed(2);
          tooltip
            .html(`Date: ${dateString}<br>${country} Temp: ${temp}°C`)
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
    });

    // X and Y axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(12).tickFormat(d3.timeFormat("%b")));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(yScale));

  }, [data]);

  // Legend for colors
  const legendData = ["USA", "China", "Russia", "Canada", "India"];
  const colorScale = d3.scaleOrdinal()
    .domain(legendData)
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]);

  return (
    <div className="chart-container" style={{ textAlign: 'center', marginBottom: '10px', marginTop: '80px' }}>
      <h2 style={{ marginBottom: '15px' }}>Difference Chart - Daily Temperature Differences (2023)</h2>
      <svg ref={svgRef} width="80%" height="500"></svg> {/* Adjusted height for a balanced layout */}

      {/* Color Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        {legendData.map(country => (
          <div key={country} style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: colorScale(country),
              marginRight: '5px'
            }}></div>
            <span>{country}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DifferenceChart;
