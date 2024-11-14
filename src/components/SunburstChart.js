import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const SunburstChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    d3.csv(process.env.PUBLIC_URL + '/POP.SUNBURST.csv').then(rawData => {
      const root = { name: 'World', children: [] };
      const continents = d3.group(rawData, d => d.Continent);
      
      continents.forEach((continentData, continent) => {
        const continentNode = { name: continent, children: [] };
        
        const subContinents = d3.group(continentData, d => d.Subcontinent);
        subContinents.forEach((subContinentData, subcontinent) => {
          const subContinentNode = { name: subcontinent, children: [] };

          subContinentData.forEach(d => {
            subContinentNode.children.push({
              name: d.Country,
              value: +d.Population
            });
          });

          continentNode.children.push(subContinentNode);
        });

        root.children.push(continentNode);
      });

      setData(root);
    });
  }, []);

  useEffect(() => {
    if (!data) return;

    const width = 700;
    const height = 700;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous rendering

    const partition = d3.partition().size([2 * Math.PI, radius]);

    const root = d3.hierarchy(data).sum(d => d.value);
    partition(root);

    // Define color scale for each continent
    const colorScale = d3.scaleOrdinal(d3.schemeSet2);
    const continentColors = new Map();
    root.children.forEach((continentNode) => {
      continentColors.set(continentNode.data.name, colorScale(continentNode.data.name));
    });

    svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .innerRadius(d => d.y0)
      .outerRadius(d => d.y1);

    // Tooltip for interaction
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "4px")
      .style("font-size", "12px");

    svg.selectAll("path")
      .data(root.descendants())
      .enter().append("path")
      .attr("display", d => d.depth ? null : "none")
      .attr("d", arc)
      .style("stroke", "#fff")
      .style("fill", d => {
        // Use the continent color for all sublevels
        let ancestor = d;
        while (ancestor.depth > 1) ancestor = ancestor.parent;
        return continentColors.get(ancestor.data.name);
      })
      .on("mouseover", function(event, d) {
        d3.select(this).attr("opacity", 0.7);
        svg.selectAll("path").filter(node => node !== d && !node.ancestors().includes(d))
          .transition().attr("opacity", 0.3);  // Dim non-related segments
        
        tooltip.style("visibility", "visible")
          .text(`${d.ancestors().map(d => d.data.name).reverse().join(" > ")}: ${d3.format(".2s")(d.value)}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 1);
        svg.selectAll("path").transition().attr("opacity", 1); // Reset opacity
        tooltip.style("visibility", "hidden");
      });

    // Set a lower threshold to show text on more segments
    const textThreshold = 7; // Adjusted threshold for more visibility

    svg.selectAll("text")
      .data(root.descendants().filter(d => d.depth && d.x1 - d.x0 > textThreshold * (Math.PI / 180)))
      .enter().append("text")
      .attr("transform", function(d) {
        const angle = (d.x0 + d.x1) / 2 * (180 / Math.PI);
        const rotate = angle < 180 ? angle - 90 : angle + 90;
        return `translate(${arc.centroid(d)}) rotate(${rotate})`;
      })
      .attr("dy", "0.35em")
      .text(d => d.data.name)
      .style("font-size", "10px")
      .style("text-anchor", "middle");

  }, [data]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Sunburst Chart - Population Distribution</h2>
      <svg ref={svgRef} width={700} height={700}></svg>
    </div>
  );
};

export default SunburstChart;
