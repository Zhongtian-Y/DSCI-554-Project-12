// src/components/ChordDiagram.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ChordDiagram = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    // Load and process CSV data
    d3.csv(process.env.PUBLIC_URL + '/TRADE.CHORD.DIA.csv').then(rawData => {
      const countries = Array.from(new Set([...rawData.map(d => d.Country1), ...rawData.map(d => d.Country2)]));
      const matrix = Array.from({ length: countries.length }, () => new Array(countries.length).fill(0));

      // Populate the matrix with trade volumes
      rawData.forEach(row => {
        const sourceIndex = countries.indexOf(row.Country1);
        const targetIndex = countries.indexOf(row.Country2);
        matrix[sourceIndex][targetIndex] = +row["Trade Volume (Million USD)"];
      });

      setData(matrix);
      setLabels(countries);
    });
  }, []);

  useEffect(() => {
    if (!data || labels.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 700;
    const height = 700;
    const innerRadius = Math.min(width, height) * 0.4;
    const outerRadius = innerRadius * 1.1;

    svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

    // Define a color palette with 15 distinct colors
    const colorPalette = [
      "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", 
      "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
      "#aec7e8", "#ffbb78", "#98df8a", "#ff9896", "#c5b0d5"
    ];

    const color = d3.scaleOrdinal()
      .domain(labels)
      .range(colorPalette);

    // Chord layout
    const chord = d3.chord()
      .padAngle(0.05)
      .sortSubgroups(d3.descending);

    // Arc generator for groups
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    // Ribbon generator for chords
    const ribbon = d3.ribbon()
      .radius(innerRadius);

    const chords = chord(data);

    // Tooltip for displaying trade volume
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px");

    // Draw groups (arcs) for each country
    svg.append("g")
      .selectAll("g")
      .data(chords.groups)
      .join("g")
      .call(g => g.append("path")
        .style("fill", d => color(labels[d.index]))
        .style("stroke", d => d3.rgb(color(labels[d.index])).darker())
        .attr("d", arc)
        .on("mouseover", function (event, d) {
          tooltip.style("visibility", "visible")
            .text(`${labels[d.index]}: ${d3.format(",")(d.value)} Million USD`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
      )
      .call(g => g.append("text")
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", d => `
          rotate(${(d.angle * 180 / Math.PI - 90)})
          translate(${outerRadius + 10})
          ${d.angle > Math.PI ? "rotate(180)" : ""}
        `)
        .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
        .style("font-size", "10px")
        .text(d => labels[d.index])
      );

    // Draw ribbons (chords) to represent trade relationships
    svg.append("g")
      .attr("fill-opacity", 0.7)
      .selectAll("path")
      .data(chords)
      .join("path")
      .attr("d", ribbon)
      .style("fill", d => color(labels[d.target.index]))
      .style("stroke", d => d3.rgb(color(labels[d.target.index])).darker())
      .on("mouseover", function (event, d) {
        tooltip.style("visibility", "visible")
          .html(`${labels[d.source.index]} → ${labels[d.target.index]}: ${d3.format(",")(d.source.value)} Million USD<br>
                 ${labels[d.target.index]} → ${labels[d.source.index]}: ${d3.format(",")(d.target.value)} Million USD`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => tooltip.style("visibility", "hidden"));

  }, [data, labels]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Chord Diagram - Trade Flows</h2>
      <svg ref={svgRef} width={700} height={700}></svg>
    </div>
  );
};

export default ChordDiagram;
