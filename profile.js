const signinUrl = `https://01.gritlab.ax/api/auth/signin`;
const DOMAIN = "01.gritlab.ax";
const GRAPHQL_ENDPOINT = `https://${DOMAIN}/api/graphql-engine/v1/graphql`;

const USER_INFO_QUERY = `
{
    user {
        id
        login
        attrs
        campus
        labels {
            labelId
            labelName
        }
        createdAt
        updatedAt
        auditRatio
        totalUp
        totalUpBonus
        totalDown
    }
    
    wip: progress (
        where: {isDone: {_eq: false}, grade : {_is_null: true}}
        order_by: [{createdAt: asc}]
    ){
        id
        eventId
        createdAt
        updatedAt
        path
        group{
            members{
                userLogin
            }
        }
    }
}`;

const USER_PROJECT_QUERY = (eventId) => `
{
  completed: result (
      order_by: [{createdAt: desc}]
      where: { isLast: { _eq: true}, type : {_nin: ["tester", "admin_audit", "dedicated_auditors_for_event"]}}
  ) {
      objectId
      path
      createdAt
      group{
          members{
              userLogin
          }
      }
  }

  xp_view: transaction(
      order_by: [{ createdAt: desc }]
      where: { type: { _like: "xp" }, eventId: {_eq: ${eventId}}}
  ) {
      objectId
      path
      amount
      createdAt
  }

  audits: transaction(
      order_by: [{ createdAt: desc }]
      where: { type: { _in: ["up", "down"] }, eventId: {_eq: ${eventId}}}
  ) {
      attrs
      type
      objectId
      path
      amount
      createdAt
  }
}`;

const USER_SKILLS_QUERY = `{
  skills: transaction(
      order_by: [{ type: desc }, { amount: desc }]
      distinct_on: [type]
      where: { type: { _like: "skill_%" } }
  ) {
      objectId
      eventId
      type
      amount
      createdAt
  }
}`;

// Global variables
let userData = null;
let transactionsData = [];
let projectsData = [];
let skillsData = [];

const isLoginPage = document.body.classList.contains("login-page");

if (isLoginPage) {
  // Fixed: Get correct form and input IDs from login.html
  const form = document.querySelector("form");
  const errorMsg = document.getElementById("error");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      // Fixed: Use correct input IDs from login.html
      const identifier = document.getElementById("login-name-text").value.trim();
      const password = document.getElementById("login-password-text").value;

      try {
        const res = await fetch(signinUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${identifier}:${password}`)}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Login failed");
        }

        const result = await res.json().catch(() => res.text());
        const token = result.token || result;

        if (!token) throw new Error("No token received");

        sessionStorage.setItem("jwt", token);
        
        // Verify token can be parsed
        try {
          parseJwt(token);
          window.location.href = "profile.html"; // Fixed: Redirect to profile.html
        } catch (parseError) {
          throw new Error("Invalid token format");
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message;
        }
        console.error("Login error:", err);
      }
    });
  }
} else {
  // Check authentication on profile page load
  if (!sessionStorage.getItem("jwt")) {
    window.location.href = "login.html";
  } else {
    renderProfile();
  }
}

// Logout functionality
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem("jwt");
    window.location.href = "login.html";
  });
}

function parseJwt(token) {
  try {
    // Remove Bearer prefix if present
    token = token.replace(/^Bearer\s+/i, "");

    const base64Url = token.split(".")[1];
    if (!base64Url) throw new Error("Invalid JWT structure");

    // Replace URL-safe characters and add padding if needed
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const padLength = 4 - (base64.length % 4);
    const paddedBase64 =
      padLength < 4 ? base64 + "=".repeat(padLength) : base64;

    return JSON.parse(atob(paddedBase64));
  } catch (err) {
    console.error("Failed to parse JWT:", err);
    throw new Error("Invalid token format");
  }
}

function getRange(data, key) {
  const values = data.map((item) => item[key]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return [min, max, range];
}

function addLine(x1, y1, x2, y2, color, width, svg) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", width);
  svg.appendChild(line);
}

function addText(x, y, color, fontSize, content, svg) {
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("fill", color);
  text.setAttribute("font-size", fontSize);
  text.textContent = content;
  svg.appendChild(text);
  return text;
}

function addCircle(cx, cy, r, color, svg) {
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("fill", color);
  svg.appendChild(circle);
}

function addPath(d, color, svg) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("stroke", color);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-width", 2);
  svg.appendChild(path);
}

function addRect(x, y, w, h, color, svg) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", x);
  rect.setAttribute("y", y);
  rect.setAttribute("width", w);
  rect.setAttribute("height", h);
  rect.setAttribute("fill", color);
  svg.appendChild(rect);
}

function formatDate(date) {
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function drawXPOverTimeGraph(xpData) {
  const XP_SVG = document.getElementById("xp-graph");
  if (!XP_SVG || !xpData || xpData.length === 0) return;
  
  XP_SVG.innerHTML = ""; // Clear previous content
  
  const chartWidth = XP_SVG.clientWidth || 900;
  const chartHeight = XP_SVG.clientHeight || 500;
  const xScale = chartWidth - 100;
  const yScale = chartHeight - 100;
  const margin = 50;

  // Convert createdAt to Date objects and sort data by createdAt
  xpData.forEach((item) => {
    item.createdAt = new Date(item.createdAt);
  });
  xpData.sort((a, b) => a.createdAt - b.createdAt);

  // Get the time range and XP range
  const [minTime, _, timeRange] = getRange(xpData, "createdAt");
  let cumulativeXP = 0;
  xpData.forEach((item) => {
    cumulativeXP += item.amount;
    item.cumulativeXP = cumulativeXP;
  });
  const [minXP, maxXP, xpRange] = getRange(xpData, "cumulativeXP");

  // Helper function to calculate the x and y coordinates for a given data point
  function getXY(xValue, yValue) {
    const x = margin + (xScale * (xValue - minTime)) / timeRange;
    const y = chartHeight - margin - (yScale * (yValue - minXP)) / xpRange;
    return { x, y };
  }

  // Add the vertical line for XP range
  addLine(margin, margin, margin, chartHeight - margin, "white", "1", XP_SVG);

  // Add labels for XP range
  const stepSize = (maxXP - minXP) / 5;
  for (let i = 0; i <= 5; i++) {
    const yValue = maxXP - i * stepSize;
    const { x, y } = getXY(xpData[0].createdAt, yValue);
    const text = addText(x - 10, y, "white", "10", yValue.toFixed(0), XP_SVG);
    text.setAttribute("text-anchor", "end");
  }

  // Add the horizontal line for time range
  addLine(
    margin,
    chartHeight - margin,
    chartWidth - margin,
    chartHeight - margin,
    "white",
    "1",
    XP_SVG
  );

  // Add time labels
  addText(
    margin,
    chartHeight - margin + 15,
    "white",
    "10",
    formatDate(xpData[0].createdAt),
    XP_SVG
  );
  addText(
    chartWidth - margin,
    chartHeight - margin + 15,
    "white",
    "10",
    formatDate(xpData[xpData.length - 1].createdAt),
    XP_SVG
  );

  // Draw the path and circles for XP points
  let pathData = [];
  xpData.forEach((item) => {
    const { x, y } = getXY(item.createdAt, item.cumulativeXP);
    pathData.push(`${x} ${y}`);
    addCircle(x, y, "2", "#228B22", XP_SVG);
  });

  // Create the line path for the XP data points
  const pathStr = `M ${pathData.join(" L ")}`;
  addPath(pathStr, "#228B22", XP_SVG);
}

function drawXpTable(xpData) {
  const container = document.getElementById("xp-table");
  if (!container) return;
  
  container.innerHTML = ""; // Clear any old content

  const title = document.createElement("h3");
  title.textContent = "XP Transactions";
  title.style.color = "#467109"
  container.appendChild(title);

  if (!xpData || xpData.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No XP data available.";
    container.appendChild(p);
    return;
  }

  xpData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const table = document.createElement("table");
  table.classList.add("xp-table");

  // Create table header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Project</th>
      <th>Date</th>
      <th style="text-align:right;">XP</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  // Loop through each XP transaction in the data
  xpData.forEach((tx) => {
    const tr = document.createElement("tr");

    // Project name: Extracting the last segment from the path
    const project = tx.path?.split("/").pop().replace(/[-_]/g, " ") || "—";
    const tdProj = document.createElement("td");
    tdProj.textContent = project;
    tr.appendChild(tdProj);

    // Date: Format the created_at date
    const tdDate = document.createElement("td");
    const d = new Date(tx.createdAt);
    tdDate.textContent = isNaN(d)
      ? "Invalid date"
      : d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
    tr.appendChild(tdDate);
    
    const tdXp = document.createElement("td");
    tdXp.style.textAlign = "right";
    tdXp.textContent = (tx.amount / 1000).toFixed(2);
    tr.appendChild(tdXp);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function drawAuditRatioGraph(audits) {
  const svg = document.getElementById("auditSvg");
  if (!svg || !userData) {
    console.error("drawAuditRatioGraph: <svg id='auditSvg'> not found or no user data");
    return;
  }
  svg.innerHTML = "";

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

  const upW = (totalUp / maxValue) * chartW;
  addRect(margin.left, y1, upW, barH, "#228B22", svg);
  addText(margin.left + 5, y1 + barH - 5, "#ffffff", "20px", totalUp, svg);

  const bonusW = (totalUpBonus / maxValue) * chartW;
  addRect(margin.left + upW, y1, bonusW, barH, "#8FBC8F", svg);
  const bonusLabel = addText(
    margin.left + upW + bonusW - 5,
    y1 + barH - 5,
    "#ffffff",
    "16px",
    totalUpBonus,
    svg
  );
  bonusLabel.setAttribute("text-anchor", "end");

  const downW = (totalDown / maxValue) * chartW;
  addRect(margin.left, y2, downW, barH, "#006400", svg);
  addText(margin.left + 5, y2 + barH - 5, "#ffffff", "20px", totalDown, svg);

  const ratio = (totalUp / totalDown).toFixed(3);
  const ratioX = width - 20;
  const ratioY = margin.top + barH / 2 + 5;
  const ratioLabel = document.createElementNS(svg.namespaceURI, "text");
  ratioLabel.setAttribute("x", ratioX);
  ratioLabel.setAttribute("y", ratioY);
  ratioLabel.setAttribute("fill", "black");
  ratioLabel.setAttribute("font-size", "24px");
  ratioLabel.setAttribute("font-weight", "bold");
  ratioLabel.setAttribute("text-anchor", "end");
  ratioLabel.textContent = ratio;
  svg.appendChild(ratioLabel);
}

// Skills radar chart function
function drawSkillsDistributionGraph(skillsData) {
  const svg = document.getElementById("radar-graph");
  if (!svg || !skillsData || skillsData.length === 0) {
    console.error("drawSkillsDistributionGraph: <svg id='radar-graph'> not found or no skills data");
    return;
  }
  
  svg.innerHTML = "";

  const width = 500;
  const height = 400;
  const radius = 125;

  // Process skills data
  const skillsByType = {};
  skillsData.forEach((skill) => {
    const skillName = skill.type.replace("skill_", "");
    if (!skillsByType[skillName]) {
      skillsByType[skillName] = 0;
    }
    skillsByType[skillName] += skill.amount;
  });

  // Convert to array and sort by amount, take top 8 skills
  const data = Object.entries(skillsByType)
    .map(([name, value]) => ({ name: capitalizeFirstLetter(name), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (data.length < 3) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", width / 2);
    text.setAttribute("y", height / 2);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.textContent = "Insufficient skills data";
    svg.appendChild(text);
    return;
  }

  // Find max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value));

  // Center the chart
  const centerX = width / 2;
  const centerY = height / 2;

  const angleSlice = (Math.PI * 2) / data.length;

  // Draw circular grid lines
  const levels = 5;
  for (let level = 1; level <= levels; level++) {
    const levelRadius = (radius * level) / levels;
    
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", centerX);
    circle.setAttribute("cy", centerY);
    circle.setAttribute("r", levelRadius);
    circle.setAttribute("fill", "none");
    circle.setAttribute("stroke", "#ccc");
    circle.setAttribute("stroke-width", "0.5");
    svg.appendChild(circle);
  }

  // Draw axis lines and labels
  data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x2 = centerX + radius * Math.cos(angle);
    const y2 = centerY + radius * Math.sin(angle);
    
    // Axis line
    addLine(centerX, centerY, x2, y2, "#999", "1", svg);
    
    // Label
    const labelX = centerX + (radius + 20) * Math.cos(angle);
    const labelY = centerY + (radius + 20) * Math.sin(angle);
    addText(labelX, labelY, "white", "11px", d.name, svg);
  });

  // Draw the radar polygon
  let pathData = [];
  data.forEach((d, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const value = (d.value / maxValue) * radius;
    const x = centerX + value * Math.cos(angle);
    const y = centerY + value * Math.sin(angle);
    
    if (i === 0) {
      pathData.push(`M ${x} ${y}`);
    } else {
      pathData.push(`L ${x} ${y}`);
    }
    
    // Add point
    addCircle(x, y, 4, "#43A047", svg);
  });
  pathData.push("Z"); // Close the path

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData.join(" "));
  path.setAttribute("fill", "#4CAF50");
  path.setAttribute("fill-opacity", "0.3");
  path.setAttribute("stroke", "#388E3C");
  path.setAttribute("stroke-width", "2");
  svg.appendChild(path);
}

async function queryGraphQL(query) {
  const token = sessionStorage.getItem("jwt");
  if (!token) {
    throw new Error("Not authenticated");
  }

  try {
    parseJwt(token);
  } catch (err) {
    console.error("Invalid JWT:", err);
    sessionStorage.removeItem("jwt");
    throw new Error("Session expired. Please log in again.");
  }

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();

    if (data.errors) {
      console.error("GraphQL Errors:", data.errors);
      throw new Error(data.errors[0].message);
    }

    return data.data;
  } catch (err) {
    console.error("GraphQL Error:", err);
    throw err;
  }
}

// Load All Data
async function renderProfile() {
  const errorMsg = document.getElementById("error-msg");
  
  try {
    console.log("Starting renderProfile...");

    const userResult = await queryGraphQL(USER_INFO_QUERY);
    console.log("User API Response:", userResult);

    if (!userResult?.user?.[0]) {
      throw new Error("User data not found in response");
    }

    const user = userResult.user[0];
    const wip = userResult.wip || [];
    console.log("User:", user);
    console.log("WIP Projects:", wip);

    // Store user data globally
    userData = user;

    insertData(
      "campus",
      `[${user.campus || "N/A"}:${user.labels?.[0]?.labelName || "N/A"}]`
    );
    insertData("id", `${user.id}`);
    insertData("login", `${user.login}`);

    if (user.attrs) {
      const fullName = `${user.attrs.firstName || ""} ${
        user.attrs.lastName || ""
      }`.trim();
      insertData("name", fullName || "N/A");
      insertData("email", user.attrs.email || "N/A");
      insertData("gender", user.attrs.gender || "N/A");
      insertData("nationality", user.attrs.nationality || "N/A");
    } else {
      console.warn("User.attrs is null or undefined");
    }

    const schEventId = wip.length > 0 ? wip[0].eventId : 0;
    console.log("Using eventId:", schEventId);

    const projectResult = await queryGraphQL(USER_PROJECT_QUERY(schEventId));
    console.log("Project API Response:", projectResult);

    const completed = projectResult?.completed || [];
    const xp_view = projectResult?.xp_view || [];
    const audits = projectResult?.audits || [];

    // Load skills data
    const skillsResult = await queryGraphQL(USER_SKILLS_QUERY);
    console.log("Skills API Response:", skillsResult);
    const skills = skillsResult?.skills || [];

    // Store data globally
    transactionsData = xp_view;
    projectsData = completed;
    skillsData = skills;

    // Draw all graphs
    drawXPOverTimeGraph(xp_view);
    drawXpTable(transactionsData);
    drawAuditRatioGraph(audits);
    drawSkillsDistributionGraph(skills);

    console.log("Profile rendered successfully!");
  } catch (err) {
    console.error("renderProfile Error:", err);
    if (errorMsg) {
      errorMsg.textContent = `Failed to load data: ${err.message}`;
      errorMsg.style.display = "block";
    }
  }
}

function insertData(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  } else {
    console.warn(`Element with id '${elementId}' not found`);
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}