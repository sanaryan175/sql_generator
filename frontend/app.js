const STORAGE_KEY = "ai-sql-generator";
const MAX_HISTORY = 50;

let queryHistory = [];
let currentSQL = "";
let saveTimer = null;

const schemaInput     = document.querySelector("#schema-input");
const questionInput   = document.querySelector("#question-input");
const generateBtn     = document.querySelector("#generate-btn");
const loadingText     = document.querySelector("#loading");
const sqlOutput       = document.querySelector("#sql-output");
const copyBtn         = document.querySelector("#copy-btn");
const clearBtn        = document.querySelector("#clear-btn");
const errorText       = document.querySelector("#error");
const explanationSec  = document.querySelector("#explanation-section");
const explanationText = document.querySelector("#explanation-text");
const historyList     = document.querySelector("#history-list");
const clearHistoryBtn = document.querySelector("#clear-history-btn");
const chips           = document.querySelectorAll(".chip");

function loadFromStorage() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    queryHistory = Array.isArray(saved.history) ? saved.history : [];

    if (saved.schema) schemaInput.value = saved.schema;
    if (saved.question) questionInput.value = saved.question;

    renderHistory();
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        history: queryHistory.slice(0, MAX_HISTORY),
        schema: schemaInput.value,
        question: questionInput.value
      })
    );
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToStorage, 300);
}

function buildSystemPrompt(schema) {
  return `You are an expert SQL developer.
Your job is to convert plain English questions into SQL queries.

RULES YOU MUST FOLLOW:
1. Only return the SQL query — no explanations, no markdown, no backticks
2. Write clean, readable SQL with proper indentation
3. Use uppercase for SQL keywords (SELECT, FROM, WHERE, etc.)
4. If the user's question is unclear, write the most reasonable SQL query
5. Add SQL comments (--) to explain complex parts

${
  schema
    ? `The database has the following schema:\n${schema}`
    : "Use reasonable table and column names based on the question."
}`;
}

async function groqChat(messages, maxTokens, temperature) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      max_tokens: maxTokens,
      temperature
    })
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Backend returned an invalid response. Check that Render is running and config.js has the correct URL."
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.choices[0].message.content.trim();
}

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    questionInput.value = chip.dataset.q;
    questionInput.focus();
    scheduleSave();
  });
});

schemaInput.addEventListener("input", scheduleSave);
questionInput.addEventListener("input", scheduleSave);

generateBtn.addEventListener("click", generateSQL);

copyBtn.addEventListener("click", async () => {
  if (!currentSQL) return;

  try {
    await navigator.clipboard.writeText(currentSQL);
    const original = copyBtn.textContent;
    copyBtn.textContent = "✓ Copied";
    setTimeout(() => {
      copyBtn.textContent = original;
    }, 1500);
  } catch (error) {
    console.error("Copy failed:", error);
    showError("Could not copy to clipboard.");
  }
});

clearBtn.addEventListener("click", () => {
  currentSQL = "";
  sqlOutput.innerHTML = '<p class="placeholder-text">Your SQL will appear here...</p>';
  explanationText.textContent = "";
  explanationSec.classList.add("hidden");
  copyBtn.disabled = true;
  clearBtn.disabled = true;
});

clearHistoryBtn.addEventListener("click", () => {
  queryHistory = [];
  renderHistory();
  saveToStorage();
});

async function generateSQL() {
  const schema = schemaInput.value.trim();
  const question = questionInput.value.trim();

  if (!question) {
    showError("Please enter a question first.");
    return;
  }

  generateBtn.disabled = true;
  showLoading(true);
  clearError();
  sqlOutput.innerHTML = "";
  explanationSec.classList.add("hidden");

  try {
    const sql = await groqChat(
      [
        { role: "system", content: buildSystemPrompt(schema) },
        { role: "user", content: question }
      ],
      500,
      0.3
    );

    currentSQL = sql;
    displaySQL(sql);
    await explainSQL(sql);
    saveToHistory(question, sql);

    copyBtn.disabled = false;
    clearBtn.disabled = false;
  } catch (error) {
    console.error("Error:", error);
    showError(error.message || "Something went wrong. Check the console.");
  } finally {
    showLoading(false);
    generateBtn.disabled = false;
  }
}

function displaySQL(sql) {
  const keywords = [
    "SELECT", "FROM", "WHERE", "JOIN", "LEFT JOIN", "RIGHT JOIN",
    "INNER JOIN", "ON", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN",
    "ORDER BY", "GROUP BY", "HAVING", "LIMIT", "OFFSET", "AS",
    "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE TABLE",
    "DROP TABLE", "ALTER TABLE", "DISTINCT", "COUNT", "SUM", "AVG",
    "MAX", "MIN", "NULL", "IS NULL", "IS NOT NULL", "ASC", "DESC",
    "UNION", "ALL", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END"
  ];

  let highlighted = sql;

  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    highlighted = highlighted.replace(
      regex,
      `<span class="sql-keyword">${keyword}</span>`
    );
  });

  highlighted = highlighted.replace(
    /'([^']*)'/g,
    `<span class="sql-string">'$1'</span>`
  );

  highlighted = highlighted.replace(
    /\b(\d+)\b/g,
    `<span class="sql-number">$1</span>`
  );

  highlighted = highlighted.replace(
    /--(.*?)(\n|$)/g,
    `<span class="sql-comment">--$1</span>\n`
  );

  sqlOutput.innerHTML = highlighted;
}

async function explainSQL(sql) {
  try {
    const explanation = await groqChat(
      [
        {
          role: "system",
          content: "You explain SQL queries in simple plain English in 1-2 sentences. No technical jargon."
        },
        {
          role: "user",
          content: `Explain this SQL query in simple terms:\n${sql}`
        }
      ],
      100,
      0.5
    );

    explanationText.textContent = explanation;
    explanationSec.classList.remove("hidden");
  } catch (error) {
    console.error("Explanation error:", error);
  }
}

function saveToHistory(question, sql) {
  queryHistory.unshift({ question, sql });
  if (queryHistory.length > MAX_HISTORY) {
    queryHistory.length = MAX_HISTORY;
  }
  renderHistory();
  saveToStorage();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (queryHistory.length === 0) {
    historyList.innerHTML = `<li class="empty-history">No queries yet</li>`;
    clearHistoryBtn.disabled = true;
    return;
  }

  clearHistoryBtn.disabled = false;

  queryHistory.forEach(item => {
    const li = document.createElement("li");

    li.textContent = item.question.length > 60
      ? item.question.substring(0, 60) + "..."
      : item.question;

    li.addEventListener("click", () => {
      currentSQL = item.sql;
      questionInput.value = item.question;
      displaySQL(item.sql);
      copyBtn.disabled = false;
      clearBtn.disabled = false;
      scheduleSave();
    });

    historyList.appendChild(li);
  });
}

function showLoading(show) {
  loadingText.classList.toggle("hidden", !show);
}

function showError(msg) {
  errorText.textContent = msg;
  errorText.classList.remove("hidden");
}

function clearError() {
  errorText.textContent = "";
  errorText.classList.add("hidden");
}

loadFromStorage();
