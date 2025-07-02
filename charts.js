import { formatDate, getRange, capitalizeFirstLetter } from './utils.js';
import { addLine, addText, addCircle, addPath, addRect } from './svg-helper.js';

export function drawAuditRatioGraph(userData) {
    const svg = document.getElementById('auditSvg');
    if (!svg || !userData) return;
    
    svg.innerHTML = '';

    const { totalUp, totalUpBonus, totalDown } = userData;
    const maxValue = Math.max(totalUp + totalUpBonus, totalDown, 1);

    const width = svg.clientWidth || 1000;
 
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

    // Add ratio - FIXED: Changed from 'black' to 'white'
    const ratio = (totalUp / totalDown).toFixed(3);
    const ratioLabel = addText(width - 20, margin.top + barH / 2 + 5, 'white', '24px', ratio, svg);
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
