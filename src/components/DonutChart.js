import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const DonutChart = () => {
    const chartRefs = {
        1960: useRef([]),
        2023: useRef([])
    };

    const years = ["1960", "2023"];
    const files = {
        "0-14": "/POP.AGE.0014.csv",
        "15-64": "/POP.AGE.1564.csv",
        "65+": "/POP.AGE.65UP.csv"
    };

    const colors = {
        "1960": ["#FF9999", "#FF6666", "#FF3333"],
        "2023": ["#9999FF", "#6666FF", "#3333FF"]
    };

    const ageLabels = ["0-14", "15-64", "65+"];
    const countryNames1960 = ["China", "India", "Japan", "Russian Federation", "United States"];
    const countryNames2023 = ["China", "India", "Japan", "Russian Federation", "United States"];

    useEffect(() => {
        const fetchData = async () => {
            const data = { "1960": {}, "2023": {} };

            for (const [ageGroup, file] of Object.entries(files)) {
                const csvData = await d3.csv(process.env.PUBLIC_URL + file);
                csvData.forEach(row => {
                    const country = row.NAME;
                    years.forEach(year => {
                        if (!data[year][country]) data[year][country] = {};
                        data[year][country][ageGroup] = parseFloat(row[year]) || 0;
                    });
                });
            }

            return data;
        };

        const createDonutChart = (year, country, distribution, index) => {
            const svg = d3.select(chartRefs[year].current[index]);
            const width = 200, height = 200, radius = Math.min(width, height) / 2;

            svg.selectAll("*").remove();

            const pie = d3.pie().value(d => d[1]);
            const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);
            const arcHover = d3.arc().innerRadius(radius * 0.5).outerRadius(radius * 1.1); // Scale up on hover

            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("background", "rgba(0, 0, 0, 0.8)")
                .style("color", "#fff")
                .style("padding", "5px 10px")
                .style("border-radius", "4px")
                .style("font-size", "12px");

            const arcs = svg.append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`)
                .selectAll("arc")
                .data(pie(Object.entries(distribution)))
                .enter()
                .append("g")
                .attr("class", "arc");

            // Add path segments with interactive features
            arcs.append("path")
                .attr("d", arc)
                .attr("fill", (d, i) => colors[year][i])
                .on("mouseover", function(event, d) {
                    d3.select(this).transition().duration(200).attr("d", arcHover); // Scale up on hover
                    tooltip.style("visibility", "visible").text(`${ageLabels[d.index]}: ${d.data[1].toFixed(1)}%`);
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", function() {
                    d3.select(this).transition().duration(200).attr("d", arc); // Scale down
                    tooltip.style("visibility", "hidden");
                })
                .on("click", function(event, d) {
                    const text = d3.select(this.parentNode).select("text");
                    const currentText = text.text();
                    const newText = currentText.includes("%") ? ageLabels[d.index] : `${d.data[1].toFixed(1)}%`;
                    text.text(newText);
                });

            // Add static labels for each segment
            arcs.append("text")
                .attr("transform", d => `translate(${arc.centroid(d)})`)
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .style("font-size", "10px")
                .style("fill", "white")
                .text(d => `${d.data[1].toFixed(1)}%`);
        };

        fetchData().then(data => {
            Object.keys(data).forEach(year => {
                Object.entries(data[year]).forEach(([country, distribution], index) => {
                    createDonutChart(year, country, distribution, index);
                });
            });
        }).catch(error => console.error("Error fetching data:", error));
    }, [files, years]);

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2 style={{ marginBottom: '20px' }}>Donut Chart - Age Distribution in 1960 & 2023</h2>
            
            {/* Legend for 1960 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '10px' }}>
                {ageLabels.map((label, i) => (
                    <div key={`legend-1960-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: colors["1960"][i],
                            borderRadius: '50%'
                        }}></div>
                        <span style={{ fontSize: '12px' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Row for 1960 Donut Charts */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginTop: '20px',
                marginBottom: '30px'
            }}>
                {countryNames1960.map((country, index) => (
                    <div key={`1960-container-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <svg
                            ref={el => chartRefs[1960].current[index] = el}
                            width="200"
                            height="200"
                            style={{ border: "1px solid #ddd", borderRadius: "8px", background: "#f7f7f7", padding: '5px' }}
                        ></svg>
                        <span style={{ fontSize: '14px', marginTop: '5px' }}>{country}</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>1960</span>
                    </div>
                ))}
            </div>

            {/* Legend for 2023 */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '10px' }}>
                {ageLabels.map((label, i) => (
                    <div key={`legend-2023-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: colors["2023"][i],
                            borderRadius: '50%'
                        }}></div>
                        <span style={{ fontSize: '12px' }}>{label}</span>
                    </div>
                ))}
            </div>

            {/* Row for 2023 Donut Charts */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginTop: '20px',
                marginBottom: '30px'
            }}>
                {countryNames2023.map((country, index) => (
                    <div key={`2023-container-${index}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <svg
                            ref={el => chartRefs[2023].current[index] = el}
                            width="200"
                            height="200"
                            style={{ border: "1px solid #ddd", borderRadius: "8px", background: "#f7f7f7", padding: '5px' }}
                        ></svg>
                        <span style={{ fontSize: '14px', marginTop: '5px' }}>{country}</span>
                        <span style={{ fontSize: '12px', color: '#666' }}>2023</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DonutChart;
