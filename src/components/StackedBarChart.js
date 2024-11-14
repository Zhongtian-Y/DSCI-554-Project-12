import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const StackedBarChart = () => {
    const svgRef = useRef();
    const legendRef = useRef();
    const [data, setData] = useState([]);
    const [yearRange, setYearRange] = useState([1990, 2020]);
    const [selectedCountry, setSelectedCountry] = useState([]);
    const [allCountries, setAllCountries] = useState([]);

    // Define color scale outside of state
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    useEffect(() => {
        d3.csv(process.env.PUBLIC_URL + '/CO2E.KT.csv').then(rawData => {
            const formattedData = rawData.map(d => {
                const countryData = Object.keys(d)
                    .filter(key => key.match(/^\d{4}$/))
                    .map(year => ({
                        country: d.CName,
                        year: +year,
                        emissions: +d[year]
                    }));
                return countryData;
            }).flat();
            setData(formattedData);

            // Get unique countries
            const countries = [...new Set(rawData.map(d => d.CName))];
            setAllCountries(countries);
            setSelectedCountry(countries); // By default select all countries

            // Set the domain of color scale based on countries
            colorScale.domain(countries);
        });
    }, []);

    useEffect(() => {
        if (!data.length || !allCountries.length) return;

        const svg = d3.select(svgRef.current);
        const { width, height } = svg.node().getBoundingClientRect();
        const margin = { top: 50, right: 20, bottom: 80, left: 120 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        svg.selectAll("*").remove();

        const filteredData = data.filter(d => 
            d.year >= yearRange[0] && d.year <= yearRange[1] &&
            (selectedCountry.length ? selectedCountry.includes(d.country) : true)
        );

        const groupedData = d3.groups(filteredData, d => d.year);
        const stackData = groupedData.map(([year, values]) => {
            let y0 = 0;
            return {
                year,
                stacks: values.map(d => {
                    const y1 = y0 + d.emissions;
                    const stack = { ...d, y0, y1 };
                    y0 = y1;
                    return stack;
                })
            };
        });

        const xScale = d3.scaleBand()
            .domain(stackData.map(d => d.year))
            .range([0, chartWidth])
            .padding(0.3);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(stackData, d => d3.max(d.stacks, s => s.y1))])
            .range([chartHeight, 0]);

        const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d3.format(".2s"));

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        g.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxis);

        g.append("g")
            .call(yAxis);

        const yearGroups = g.selectAll(".year-group")
            .data(stackData)
            .enter()
            .append("g")
            .attr("class", "year-group")
            .attr("transform", d => `translate(${xScale(d.year)}, 0)`);

        yearGroups.selectAll(".stack")
            .data(d => d.stacks)
            .enter()
            .append("rect")
            .attr("class", "stack")
            .attr("x", 0)
            .attr("y", d => yScale(d.y1))
            .attr("width", xScale.bandwidth())
            .attr("height", d => yScale(d.y0) - yScale(d.y1))
            .attr("fill", d => colorScale(d.country));

        yearGroups.selectAll(".label")
            .data(d => d.stacks)
            .enter()
            .append("text")
            .attr("class", "label")
            .attr("x", xScale.bandwidth() / 2)
            .attr("y", d => yScale(d.y1) + (yScale(d.y0) - yScale(d.y1)) / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#FFFFFF")
            .attr("font-size", "12px")
            .attr("dy", ".35em")
            .text(d => d3.format(".2s")(d.emissions));

        const brush = d3.brushX()
            .extent([[0, 0], [chartWidth, chartHeight]])
            .on("end", brushEnded);

        g.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushEnded(event) {
            if (!event.selection) return;
            const [x0, x1] = event.selection;
            const yearsSelected = xScale.domain().filter(year => {
                const yearX = xScale(year) + xScale.bandwidth() / 2;
                return yearX >= x0 && yearX <= x1;
            });
            if (yearsSelected.length > 0) {
                setYearRange([d3.min(yearsSelected), d3.max(yearsSelected)]);
            }
            svg.select(".brush").call(brush.move, null);
        }
    }, [data, yearRange, selectedCountry, allCountries]);

    const handleCountryChange = (country) => {
        setSelectedCountry(prevSelected => {
            const updatedSelection = prevSelected.includes(country)
                ? prevSelected.filter(c => c !== country)
                : [...prevSelected, country];
            return updatedSelection;
        });
    };

    const resetFilter = () => {
        setYearRange([1990, 2020]);
        setSelectedCountry(allCountries);
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Stacked Bar Chart - CO₂ Emissions</h2>
            <p>Filter by year with the brush tool, reset with the button.</p>
            <div>
                <label>Select Countries:</label>
                {allCountries.map(country => (
                    <label key={country} style={{ margin: '0 10px', color: colorScale(country) }}>
                        <input
                            type="checkbox"
                            checked={selectedCountry.includes(country)}
                            onChange={() => handleCountryChange(country)}
                        />
                        {country}
                    </label>
                ))}
            </div>
            <svg ref={svgRef} style={{ width: '95%', height: '600px' }}></svg>
            <button onClick={resetFilter} style={{ marginTop: '10px', padding: '5px 10px' }}>
                Reset Brush Tool
            </button>
        </div>
    );
};

export default StackedBarChart;
