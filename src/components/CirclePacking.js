// src/components/CirclePacking.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const CirclePacking = () => {
  const svgRef = useRef();
  const [data, setData] = useState(null);

  useEffect(() => {
    d3.csv(process.env.PUBLIC_URL + '/CIRCLE.PACK.csv').then(rawData => {
      // Manually process the data to create a hierarchy
      const root = { name: 'World', children: [] };
      const continents = d3.group(rawData, d => d.Continent);

      continents.forEach((continentData, continentName) => {
        const continentNode = { name: continentName, children: [] };

        const countries = d3.group(continentData, d => d.Country);
        countries.forEach((countryData, countryName) => {
          const countryNode = { name: countryName, children: [] };

          const biomes = d3.group(countryData, d => d.Biome_Type);
          biomes.forEach((biomeData, biomeType) => {
            const biomeNode = { name: biomeType, children: [] };

            biomeData.forEach(d => {
              biomeNode.children.push({
                name: d.Region,
                value: +d.Area_sq_km
              });
            });

            countryNode.children.push(biomeNode);
          });

          continentNode.children.push(countryNode);
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

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous renders

    // Define a gradient color scale that darkens for outer circles and lightens towards the center
    const colorScale = d3.scaleLinear()
      .domain([0, 3]) // Adjust domain based on depth (0 for outermost, 3 for innermost)
      .range(["#4A90E2", "#C4E1FF", "#FFFFFF"]); // Dark blue to light blue to white

    const pack = d3.pack()
      .size([width, height])
      .padding(3);

    const root = d3.hierarchy(data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);

    pack(root);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px");

    const nodes = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
      .attr("fill", d => colorScale(d.depth)) // Apply color scale based on depth
      .attr("stroke", d => d.depth === 0 ? "#333" : "#fff")
      .attr("stroke-width", 1.5)
      .attr("pointer-events", d => !d.children ? "none" : null)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("stroke", "#000");
        tooltip.style("visibility", "visible").html(
          `${d.ancestors().map(d => d.data.name).reverse().join(" > ")}<br>Area: ${d.value ? d3.format(",")(d.value) : ''} sq km`
        );
      })
      .on("mousemove", event => {
        tooltip
          .style("top", `${event.pageY - 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "#fff");
        tooltip.style("visibility", "hidden");
      })
      .on("click", (event, d) => zoom(d));

    const labels = svg.append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`)
      .selectAll("text")
      .data(root.descendants())
      .join("text")
      .style("font-size", d => d.children ? "14px" : "10px")
      .attr("fill", "#333")
      .style("text-anchor", "middle")
      .text(d => d.depth === 1 ? d.data.name : "") // Initially, only show top-level (continent) labels
      .attr("opacity", d => (d.r > 20 ? 1 : 0));

    let view;

    function zoomTo(v) {
      const k = width / v[2];
      view = v;

      labels.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      nodes.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
      nodes.attr("r", d => d.r * k);
    }

    function zoom(d) {
      const focus = d;

      const transition = svg.transition()
        .duration(750)
        .tween("zoom", d => {
          const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
          return t => zoomTo(i(t));
        });

      labels
        .style("fill-opacity", 0) // Hide all labels
        .filter(d => d.parent === focus || d === focus) // Show only labels for focused circle and direct children
        .text(d => d.data.name)
        .style("fill-opacity", 1)
        .on("start", function (d) { if (d.parent === focus || d === focus) this.style.display = "inline"; })
        .on("end", function (d) { if (!(d.parent === focus || d === focus)) this.style.display = "none"; });
    }

    // Initial view
    zoomTo([root.x, root.y, root.r * 2]);
  }, [data]);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Zoomable Circle Packing - Geographic Biome Distribution</h2>
      <svg ref={svgRef} width={700} height={700}></svg>
    </div>
  );
};

export default CirclePacking;
