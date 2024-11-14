// src/components/MultiLineChart.js
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const MultiLineChart = () => {
    const svgRef = useRef();
    const [data, setData] = useState({ gdp: [], population: [] });
    const [selectedCountries, setSelectedCountries] = useState([]);

    useEffect(() => {
        // Load the GDP and Population data from the public folder
        Promise.all([
            d3.csv(process.env.PUBLIC_URL + '/GDP.PCAP.csv'),
            d3.csv(process.env.PUBLIC_URL + '/POP.TOTL.csv')
        ]).then(([gdpCsv, popCsv]) => {
            const parsedData = {
                gdp: gdpCsv.map(d => ({
                    country: d.CName,
                    values: Object.keys(d).slice(2).map(year => ({
                        year: new Date(+year, 0, 1),
                        gdp: +d[year]
                    }))
                })),
                population: popCsv.map(d => ({
                    country: d.CName,
                    values: Object.keys(d).slice(2).map(year => ({
                        year: new Date(+year, 0, 1),
                        population: +d[year]
                    }))
                }))
            };
            setData(parsedData);
            setSelectedCountries(parsedData.gdp.map(d => d.country)); // Initialize with all countries selected
        });
    }, []);

    useEffect(() => {
        if (!data.gdp.length || !data.population.length) return;

        const svg = d3.select(svgRef.current);
        const { width, height } = svg.node().getBoundingClientRect();
        const margin = { top: 120, right: 100, bottom: 40, left: 80 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        svg.selectAll('*').remove(); // Clear the SVG before re-rendering

        // Define scales
        const xScale = d3.scaleTime()
            .domain([new Date(1960, 0, 1), new Date(2023, 0, 1)])
            .range([0, chartWidth]);

        const yScalePopulation = d3.scaleLinear()
            .domain([0, d3.max(data.population, d => d3.max(d.values, v => v.population))])
            .range([chartHeight, 0]);

        const yScaleGDP = d3.scaleLinear()
            .domain([0, d3.max(data.gdp, d => d3.max(d.values, v => v.gdp))])
            .range([chartHeight, 0]);

        const linePopulation = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScalePopulation(d.population));

        const lineGDP = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScaleGDP(d.gdp));

        const colorPalette = d3.schemeDark2;
        const colorScale = d3.scaleOrdinal(colorPalette)
            .domain(data.gdp.map(d => d.country));

        // Draw the axes
        const xAxis = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${chartHeight + margin.top})`)
            .call(d3.axisBottom(xScale).ticks(10));

        const yAxisLeft = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .call(d3.axisLeft(yScalePopulation).ticks(6).tickFormat(d3.format(".2s")))
            .call(g => g.append("text")
                .attr("x", -margin.left + 10)
                .attr("y", -20)
                .attr("fill", "blue")
                .attr("text-anchor", "start")
                .text("Population"));

        const yAxisRight = svg.append('g')
            .attr('transform', `translate(${chartWidth + margin.left}, ${margin.top})`)
            .call(d3.axisRight(yScaleGDP).ticks(6).tickFormat(d3.format(".2s")))
            .call(g => g.append("text")
                .attr("x", margin.right - 10)
                .attr("y", -20)
                .attr("fill", "green")
                .attr("text-anchor", "end")
                .text("GDP per Capita (USD)"));

        const svgGroup = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .translateExtent([[0, 0], [chartWidth, chartHeight]])
            .extent([[0, 0], [chartWidth, chartHeight]])
            .on("zoom", (event) => {
                const transform = event.transform;
                const newXScale = transform.rescaleX(xScale);
                const newYScalePopulation = transform.rescaleY(yScalePopulation);
                const newYScaleGDP = transform.rescaleY(yScaleGDP);

                xAxis.call(d3.axisBottom(newXScale).ticks(10));
                yAxisLeft.call(d3.axisLeft(newYScalePopulation).ticks(6).tickFormat(d3.format(".2s")));
                yAxisRight.call(d3.axisRight(newYScaleGDP).ticks(6).tickFormat(d3.format(".2s")));

                svgGroup.selectAll('.line-population')
                    .attr('d', d => linePopulation.x(d => newXScale(d.year)).y(d => newYScalePopulation(d.population))(d.values));

                svgGroup.selectAll('.line-gdp')
                    .attr('d', d => lineGDP.x(d => newXScale(d.year)).y(d => newYScaleGDP(d.gdp))(d.values));

                svgGroup.selectAll('.dot-population')
                    .attr('cx', d => newXScale(d.year))
                    .attr('cy', d => newYScalePopulation(d.population));

                svgGroup.selectAll('.dot-gdp')
                    .attr('cx', d => newXScale(d.year))
                    .attr('cy', d => newYScaleGDP(d.gdp));
            });

        svg.call(zoom);

        const populationData = data.population.filter(d => selectedCountries.includes(d.country));
        const gdpData = data.gdp.filter(d => selectedCountries.includes(d.country));

        svgGroup.selectAll('.line-population')
            .data(populationData)
            .enter()
            .append('path')
            .attr('class', 'line-population')
            .attr('fill', 'none')
            .attr('stroke', d => colorScale(d.country))
            .attr('stroke-width', 1.8)
            .attr('d', d => linePopulation(d.values));

        svgGroup.selectAll('.line-gdp')
            .data(gdpData)
            .enter()
            .append('path')
            .attr('class', 'line-gdp')
            .attr('fill', 'none')
            .attr('stroke', d => colorScale(d.country))
            .attr('stroke-width', 1.8)
            .style('stroke-dasharray', '4,2')
            .attr('d', d => lineGDP(d.values));

        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background', 'lightgrey')
            .style('padding', '5px');

        svgGroup.selectAll('.dot-population')
            .data(populationData.flatMap(d => d.values).filter(d => d.year.getFullYear() % 5 === 0))
            .enter()
            .append('circle')
            .attr('class', 'dot-population')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScalePopulation(d.population))
            .attr('r', 3)
            .attr('fill', d => colorScale(d.country))
            .on('mouseover', (event, d) => {
                tooltip.html(`Year: ${d.year.getFullYear()}<br>Population: ${d.population}`)
                    .style('visibility', 'visible')
                    .style('top', `${event.pageY - 10}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => tooltip.style('visibility', 'hidden'));

        svgGroup.selectAll('.dot-gdp')
            .data(gdpData.flatMap(d => d.values).filter(d => d.year.getFullYear() % 5 === 0))
            .enter()
            .append('circle')
            .attr('class', 'dot-gdp')
            .attr('cx', d => xScale(d.year))
            .attr('cy', d => yScaleGDP(d.gdp))
            .attr('r', 3)
            .attr('fill', 'red')
            .on('mouseover', (event, d) => {
                tooltip.html(`Year: ${d.year.getFullYear()}<br>GDP per Capita: $${d.gdp.toFixed(2)}`)
                    .style('visibility', 'visible')
                    .style('top', `${event.pageY - 10}px`)
                    .style('left', `${event.pageX + 10}px`);
                    })
                    .on('mouseout', () => tooltip.style('visibility', 'hidden'));
        
                // Line Type Legend at the top
                svg.append("g")
                    .attr("transform", `translate(${width - 180}, ${margin.top - 90})`)
                    .call(g => {
                        g.append("line")
                            .attr("x1", 0)
                            .attr("y1", 0)
                            .attr("x2", 30)
                            .attr("y2", 0)
                            .attr("stroke", "black")
                            .attr("stroke-width", 2);
                        g.append("text")
                            .attr("x", 40)
                            .attr("y", 5)
                            .text("Population")
                            .attr("alignment-baseline", "middle");
        
                        g.append("line")
                            .attr("x1", 0)
                            .attr("y1", 20)
                            .attr("x2", 30)
                            .attr("y2", 20)
                            .attr("stroke", "black")
                            .attr("stroke-width", 2)
                            .style("stroke-dasharray", "4,2");
                        g.append("text")
                            .attr("x", 40)
                            .attr("y", 25)
                            .text("GDP per Capita")
                            .attr("alignment-baseline", "middle");
                    });
        
            }, [data, selectedCountries]);
        
            return (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h2>Multi-line Chart - Population Growth & GDP per Capita</h2>
                    <p>Filter by country with the boxes, zoom in/out or hover on data points to view details.</p>
                    <div className="legend" style={{ marginBottom: '10px' }}>
                        <label>Select Countries: </label>
                        {data.gdp.map(d => (
                            <label key={d.country} style={{ marginRight: '10px' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedCountries.includes(d.country)}
                                    onChange={() => {
                                        setSelectedCountries(selectedCountries.includes(d.country)
                                            ? selectedCountries.filter(c => c !== d.country)
                                            : [...selectedCountries, d.country]);
                                    }}
                                />
                                <span style={{ color: d3.schemeDark2[data.gdp.indexOf(d)] }}>{d.country}</span>
                            </label>
                        ))}
                    </div>
                    <svg ref={svgRef} style={{ width: "90%", height: "500px", margin: "auto" }}></svg>
                </div>
            );
        };
        
        export default MultiLineChart;
        