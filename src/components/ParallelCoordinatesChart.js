import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const ParallelCoordinatesChart = () => {
    const svgRef = useRef();
    const [data, setData] = useState([]);

    useEffect(() => {
        d3.csv(process.env.PUBLIC_URL + '/PARA.COOR.csv').then(data => {
            setData(data);
        });
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const dimensions = Object.keys(data[0]).filter(d => d !== "Country");

        const yScales = {};
        dimensions.forEach(dimension => {
            const maxLimit = d3.max(data, d => +d[dimension]) * 1.2;  // Increase max limit by 20%
            yScales[dimension] = d3.scaleLinear()
                .domain([d3.min(data, d => +d[dimension]), maxLimit])
                .range([400, 0]);
        });

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const svg = d3.select(svgRef.current)
            .attr("width", 1200)
            .attr("height", 500)
            .style("margin", "0 auto");

        svg.selectAll("*").remove();

        const xScale = d3.scalePoint()
            .domain(dimensions)
            .range([100, 1100]);

        const line = d3.line()
            .defined(d => !isNaN(d[1]))
            .x(d => xScale(d[0]))
            .y(d => yScales[d[0]](d[1]));

        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "#f9f9f9")
            .style("border", "1px solid #ddd")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("visibility", "hidden")
            .style("font-size", "12px");

        svg.selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("fill", "none")
            .attr("stroke", d => color(d.Country))
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.8)
            .attr("d", d => line(dimensions.map(p => [p, +d[p]])))
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible").html(`<strong>${d.Country}</strong>`);
                d3.select(this).attr("stroke-width", 3).attr("opacity", 1);
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
                d3.select(this).attr("stroke-width", 1.5).attr("opacity", 0.8);
            });

        dimensions.forEach((dimension) => {
            svg.append("g")
                .attr("transform", `translate(${xScale(dimension)},50)`)  
                .call(d3.axisLeft(yScales[dimension]).ticks(6))
                .append("text")
                .attr("y", 440)  // Adjusted position to place labels at the bottom
                .attr("text-anchor", "middle")
                .attr("fill", "black")
                .text(dimension)
                .style("font-size", "14px")
                .style("font-weight", "bold");
        });

    }, [data]);

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <h2 style={{ fontWeight: 'bold', fontSize: '24px', marginBottom: '20px' }}>
                Parallel Coordinates Chart - Socioeconomic Indicators by Country
            </h2>
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default ParallelCoordinatesChart;
