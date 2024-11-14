// src/components/Treemap.js
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const Treemap = () => {
    const svgRef = useRef();
    const [year, setYear] = useState(1960); // Default year
    const [data, setData] = useState(null);

    useEffect(() => {
        // Load the CSV file
        d3.csv(process.env.PUBLIC_URL + '/AGE.DIST.TREE.csv').then(rawData => {
            // Process the data into a hierarchical format
            const processedData = { name: "World", children: [] };

            // Group data by country
            const countries = d3.group(rawData, d => d.Country);

            countries.forEach((countryData, country) => {
                const countryNode = { name: country, children: [] };

                // Group by age group
                const ageGroups = d3.group(countryData, d => d["Age Group"]);

                ageGroups.forEach((ageGroupData, ageGroup) => {
                    const ageGroupNode = { name: ageGroup, children: [] };

                    // Add gender data as leaf nodes
                    ageGroupData.forEach(d => {
                        ageGroupNode.children.push({
                            name: d.Gender,
                            population1960: +d["Population 1960"],
                            population2023: +d["Population 2023"]
                        });
                    });

                    countryNode.children.push(ageGroupNode);
                });

                processedData.children.push(countryNode);
            });

            setData(processedData); // Save processed data
        });
    }, []);

    useEffect(() => {
        if (!data) return;

        // Set dimensions to slightly smaller size
        const width = 1000;  // Reduced width
        const height = 600;  // Reduced height

        // Clear existing SVG content
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Create a root node with the selected year population
        const root = d3.hierarchy(data)
            .sum(d => d[`population${year}`])
            .sort((a, b) => b.value - a.value);

        // Create a treemap layout
        d3.treemap()
            .size([width, height])
            .padding(2)
            .round(true)(root);

        // Define color scale for each country
        const color = d3.scaleOrdinal(d3.schemeSet3);

        // Tooltip for displaying details
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "5px 10px")
            .style("border-radius", "4px")
            .style("font-size", "12px");

        // Add rectangles for each node with hover effects and click interaction
        svg.selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.parent.parent.data.name))
            .attr("stroke", "#fff")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 0.8);
                tooltip.style("visibility", "visible")
                    .text(`${d.ancestors().map(d => d.data.name).reverse().join(" > ")}: ${d3.format(".2s")(d.value)}`);
            })
            .on("mousemove", (event) => {
                tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 1);
                tooltip.style("visibility", "hidden");
            });

        // Add text labels in the top-left corner, with country name and population on separate lines
        svg.selectAll("text")
            .data(root.leaves().filter(d => d.x1 - d.x0 > 60 && d.y1 - d.y0 > 30)) // Show labels only on larger rectangles
            .enter()
            .append("text")
            .attr("x", d => d.x0 + 4) // Align to top-left corner with padding
            .attr("y", d => d.y0 + 14) // Vertical padding for text
            .style("font-size", "12px")
            .style("fill", "#333")
            .style("font-weight", "bold")
            .text(d => d.parent.parent.data.name) // Display country name
            .append("tspan") // Add a new line for the population
            .attr("x", d => d.x0 + 4)
            .attr("dy", 14) // Line break within the same rectangle
            .style("font-weight", "normal")
            .text(d => `${d.data.name}: ${d3.format(".2s")(d.value)}`);
    }, [data, year]);

    return (
        <div style={{ textAlign: 'center', padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: '1000px', width: '100%' }}> {/* Centers the treemap container */}
                <h2>Treemap - Population Age & Gender</h2>
                <div style={{ marginBottom: '20px' }}>
                    <label>Select Year: </label>
                    <label>
                        <input
                            type="radio"
                            value="1960"
                            checked={year === 1960}
                            onChange={() => setYear(1960)}
                            style={{ marginRight: '5px' }}
                        />
                        1960
                    </label>
                    <label style={{ marginLeft: '20px' }}>
                        <input
                            type="radio"
                            value="2023"
                            checked={year === 2023}
                            onChange={() => setYear(2023)}
                            style={{ marginRight: '5px' }}
                        />
                        2023
                    </label>
                </div>
                <svg ref={svgRef} width="1000" height="600"></svg> {/* Adjusted width and height */}
            </div>
        </div>
    );
};

export default Treemap;
