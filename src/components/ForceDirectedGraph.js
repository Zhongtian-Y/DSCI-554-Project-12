// src/components/ForceDirectedGraph.js
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ForceDirectedGraph = () => {
  const svgRef = useRef();

  useEffect(() => {
    d3.json(`${process.env.PUBLIC_URL}/FORCE.DIRECTED.json`).then((data) => {
      const width = 800;
      const height = 600;

      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .call(d3.zoom()
          .scaleExtent([0.5, 2]) // Limit the zoom scale range
          .on("zoom", (event) => g.attr("transform", event.transform))
        );

      svg.selectAll("*").remove();
      const g = svg.append("g");

      const color = d3.scaleOrdinal(d3.schemeTableau10);

      const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-200))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = g.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(data.links)
        .enter()
        .append("line")
        .attr("stroke-width", 1)
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6);

      const node = g.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("circle")
        .attr("r", 8)
        .attr("fill", d => color(d.group))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .call(d3.drag()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
        );

      // Highlight connected nodes and links on hover
      node.on("mouseover", (event, d) => {
        link
          .attr("stroke-opacity", o => (o.source === d || o.target === d) ? 1 : 0.1)
          .attr("stroke", o => (o.source === d || o.target === d) ? "#666" : "#999");
        node
          .attr("opacity", o => (o === d || data.links.some(l => l.source === d && l.target === o || l.target === d && l.source === o)) ? 1 : 0.3);
        tooltip.style("visibility", "visible").text(d.name);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        link.attr("stroke-opacity", 0.6).attr("stroke", "#999");
        node.attr("opacity", 1);
        tooltip.style("visibility", "hidden");
      });

      // Add node tooltip
      const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("padding", "8px")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("visibility", "hidden");

      // Update positions on tick
      simulation.on("tick", () => {
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
      });
    });
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2>Force-Directed Graph - Interactive Network with Zoom and Hover Effects</h2>
      <svg ref={svgRef} width="100%" height="600" style={{ border: '1px solid #ccc' }}></svg>
    </div>
  );
};

export default ForceDirectedGraph;
