import { formatDate, getRange, capitalizeFirstLetter } from './utils.js';
import { addLine, addText, addCircle, addPath, addRect } from './svg-helper.js';

export function drawXPOverTimeGraph(xpData) {
    const XP_SVG = document.getElementById('xp-graph');
    if (!XP_SVG || !xpData || xpData.length === 0) return;
    
    XP_SVG.innerHTML = '';
    
    const chartWidth = XP_SVG.clientWidth || 900;
    const chartHeight = XP_SVG.clientHeight || 500;
    const xScale = chartWidth - 100;
    const yScale = chartHeight - 100;
    const margin = 50;

    // Process data
    xpData.forEach(item => {
        item.createdAt = new Date(item.createdAt);
    });
    xpData.sort((a, b) => a.createdAt - b.createdAt);

    const [minTime, _, timeRange] = getRange(xpData, 'createdAt');
    let cumulativeXP = 0;
    xpData.forEach(item => {
        cumulativeXP += item.amount;
        item.cumulativeXP = cumulativeXP;
    });
    const [minXP, maxXP, xpRange] = getRange(xpData, 'cumulativeXP');

    function getXY(xValue, yValue) {
        const x = margin + (xScale * (xValue - minTime)) / timeRange;
        const y = chartHeight - margin - (yScale * (yValue - minXP)) / xpRange;
        return { x, y };
    }

    // Draw axes
    addLine(margin, margin, margin, chartHeight - margin, 'white', '1', XP_SVG);
    addLine(margin, chartHeight - margin, chartWidth - margin, chartHeight - margin, 'white', '1', XP_SVG);

    // Y-axis labels
    const stepSize = (maxXP - minXP) / 5;
    for (let i = 0; i <= 5; i++) {
        const yValue = maxXP - i * stepSize;
        const { x, y } = getXY(xpData[0].createdAt, yValue);
        const text = addText(x - 10, y, 'white', '10', yValue.toFixed(0), XP_SVG);
        text.setAttribute('text-anchor', 'end');
    }

    // X-axis labels
    addText(margin, chartHeight - margin + 15, 'white', '10', formatDate(xpData[0].createdAt), XP_SVG);
    addText(chartWidth - margin, chartHeight - margin + 15, 'white', '10', formatDate(xpData[xpData.length - 1].createdAt), XP_SVG);

    // Draw path and points
    let pathData = [];
    xpData.forEach(item => {
        const { x, y } = getXY(item.createdAt, item.cumulativeXP);
        pathData.push(`${x} ${y}`);
        addCircle(x, y, '2', '#228B22', XP_SVG);
    });

    const pathStr = `M ${pathData.join(' L ')}`;
    addPath(pathStr, '#228B22', XP_SVG);
}

export function drawXpTable(xpData) {
    const container = document.getElementById('xp-table');
    if (!container) return;
    
    container.innerHTML = '';

    const title = document.createElement('h3');
    title.textContent = 'XP Transactions';
    title.style.color = '#467109';
    container.appendChild(title);

    if (!xpData || xpData.length === 0) {
        const p = document.createElement('p');
        p.textContent = 'No XP data available.';
        container.appendChild(p);
        return;
    }

    xpData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const table = document.createElement('table');
    table.classList.add('xp-table');

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Project</th>
            <th>Date</th>
            <th style="text-align:right;">XP</th>
        </tr>`;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    xpData.forEach(tx => {
        const tr = document.createElement('tr');

        const project = tx.path?.split('/').pop().replace(/[-_]/g, ' ') || '—';
        const tdProj = document.createElement('td');
        tdProj.textContent = project;
        tr.appendChild(tdProj);

        const tdDate = document.createElement('td');
        const d = new Date(tx.createdAt);
        tdDate.textContent = isNaN(d) ? 'Invalid date' : d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        tr.appendChild(tdDate);
        
        const tdXp = document.createElement('td');
        tdXp.style.textAlign = 'right';
        tdXp.textContent = (tx.amount / 1000).toFixed(2);
        tr.appendChild(tdXp);
        tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

export function drawAuditRatioGraph(userData) {
    const svg = document.getElementById('auditSvg');
    if (!svg || !userData) return;
    
    svg.innerHTML = '';

    const { totalUp, totalUpBonus, totalDown } = userData;
    const maxValue = Math.max(totalUp + totalUpBonus, totalDown, 1);

    const width = svg.clientWidth || 1000;
    const height = svg.clientHeight || 400;
    const margin = { top: 40, right: 100, bottom: 20, left: 60 };
    const chartW = width - margin.left - margin.right;
    const barH = 30;
    const spacing = 20;
    const y1 = margin.top;
    const y2 = margin.top + barH + spacing;

    // Draw bars
    const upW = (totalUp / maxValue) * chartW;
    addRect(margin.left, y1, upW, barH, '#228B22', svg);
    addText(margin.left + 5, y1 + barH - 5, '#ffffff', '20px', totalUp, svg);

    const bonusW = (totalUpBonus / maxValue) * chartW;
    addRect(margin.left + upW, y1, bonusW, barH, '#8FBC8F', svg);
    const bonusLabel = addText(margin.left + upW + bonusW - 5, y1 + barH - 5, '#ffffff', '16px', totalUpBonus, svg);
    bonusLabel.setAttribute('text-anchor', 'end');

    const downW = (totalDown / maxValue) * chartW;
    addRect(margin.left, y2, downW, barH, '#006400', svg);
    addText(margin.left + 5, y2 + barH - 5, '#ffffff', '20px', totalDown, svg);

    // Add ratio
    const ratio = (totalUp / totalDown).toFixed(3);
    const ratioLabel = addText(width - 20, margin.top + barH / 2 + 5, 'black', '24px', ratio, svg);
    ratioLabel.setAttribute('text-anchor', 'end');
    ratioLabel.setAttribute('font-weight', 'bold');
}

export function drawSkillsDistributionGraph(skillsData) {
    const svg = document.getElementById('radar-graph');
    if (!svg || !skillsData || skillsData.length === 0) return;
    
    svg.innerHTML = '';

    const width = 500;
    const height = 400;
    const radius = 125;
    const centerX = width / 2;
    const centerY = height / 2;

    // Process skills data
    const skillsByType = {};
    skillsData.forEach(skill => {
        const skillName = skill.type.replace('skill_', '');
        skillsByType[skillName] = (skillsByType[skillName] || 0) + skill.amount;
    });

    const data = Object.entries(skillsByType)
        .map(([name, value]) => ({ name: capitalizeFirstLetter(name), value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

    if (data.length < 3) {
        const text = addText(width / 2, height / 2, 'white', '16px', 'Insufficient skills data', svg);
        text.setAttribute('text-anchor', 'middle');
        return;
    }

    const maxValue = Math.max(...data.map(d => d.value));
    const angleSlice = (Math.PI * 2) / data.length;

    // Draw grid
    for (let level = 1; level <= 5; level++) {
        const levelRadius = (radius * level) / 5;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', centerX);
        circle.setAttribute('cy', centerY);
        circle.setAttribute('r', levelRadius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', '#ccc');
        circle.setAttribute('stroke-width', '0.5');
        svg.appendChild(circle);
    }

    // Draw axes and labels
    data.forEach((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x2 = centerX + radius * Math.cos(angle);
        const y2 = centerY + radius * Math.sin(angle);
        
        addLine(centerX, centerY, x2, y2, '#999', '1', svg);
        
        const labelX = centerX + (radius + 20) * Math.cos(angle);
        const labelY = centerY + (radius + 20) * Math.sin(angle);
        addText(labelX, labelY, 'white', '11px', d.name, svg);
    });

    // Draw radar polygon
    let pathData = [];
    data.forEach((d, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const value = (d.value / maxValue) * radius;
        const x = centerX + value * Math.cos(angle);
        const y = centerY + value * Math.sin(angle);
        
        pathData.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
        addCircle(x, y, 4, '#43A047', svg);
    });
    pathData.push('Z');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData.join(' '));
    path.setAttribute('fill', '#4CAF50');
    path.setAttribute('fill-opacity', '0.3');
    path.setAttribute('stroke', '#388E3C');
    path.setAttribute('stroke-width', '2');
    svg.appendChild(path);
}