# 🗄️ AI SQL Query Generator

Convert plain English questions into working SQL queries using the OpenAI API. Just describe your database schema, ask a question in natural language, and get back a clean, syntax-highlighted SQL query — along with a plain-English explanation.

---

## ✨ Features

- 📝 **Schema Input** — Describe your database tables and columns so the AI generates queries based on your actual structure
- 💬 **Natural Language Queries** — Ask questions like "Show me all users who signed up last month with more than 3 orders"
- ⚡ **Instant SQL Generation** — Powered by GPT-3.5-turbo via the OpenAI Chat Completions API
- 🎨 **Syntax Highlighting** — SQL keywords, strings, numbers, and comments are color-coded for readability
- 🧠 **Auto Explanations** — Every generated query comes with a simple breakdown of what it does
- 📋 **Copy to Clipboard** — One-click copy for pasting directly into your DB tool
- 🕘 **Query History** — Revisit and reuse previous queries
- 🚀 **Quick-Start Examples** — Pre-built example questions to get started instantly

---

## 🛠️ Tech Stack

- HTML, CSS, JavaScript (vanilla — no frameworks)
- [OpenAI API](https://platform.openai.com/docs/api-reference) — Chat Completions endpoint (`gpt-3.5-turbo`)

---

## 📂 Project Structure

```
sql-generator/
├── index.html
├── styles.css
└── app.js
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/ai-sql-generator.git
cd ai-sql-generator
```

### 2. Add your OpenAI API key

Open `app.js` and replace the placeholder with your own key:

```javascript
const API_KEY = "your-api-key-here";
```

> ⚠️ **Important:** This project runs entirely in the browser, which means your API key is visible to anyone inspecting the page. **Do not deploy this publicly or push your real API key to GitHub.** Use it for local testing only.

You can get an API key from the [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Run it

Just open `index.html` in your browser. No build step, no server required.

---

## 💡 How to Use

1. **Describe your schema** (optional but recommended) in the format:
   ```
   users(id, name, email, created_at, plan)
   orders(id, user_id, product_id, amount, created_at)
   ```

2. **Type your question** in plain English:
   ```
   Show me all users who signed up last month and have placed more than 3 orders
   ```

3. Click **⚡ Generate SQL**

4. Get:
   - A clean, formatted, syntax-highlighted SQL query
   - A plain-English explanation of what it does

5. Use **📋 Copy** to copy the query, or click any item in **Query History** to bring it back.

---

## ⚙️ How It Works

1. **System Prompt** — A carefully crafted instruction tells GPT: *"You are an expert SQL developer. Only return SQL — no explanations, no backticks. Use uppercase keywords."* This customizes the model's behavior for this specific task.

2. **Schema Injection** — The user's database schema is appended to the system prompt, so the AI generates queries based on real table/column names.

3. **API Call** — The system prompt + user's question are sent together to the `/v1/chat/completions` endpoint.

4. **Low Temperature (0.3)** — Keeps output precise and deterministic, ideal for code generation.

5. **Syntax Highlighting** — The raw SQL string is processed with regex to wrap keywords, strings, numbers, and comments in styled `<span>` tags.

6. **Explanation Call** — A second, lightweight API call asks GPT to explain the generated query in simple terms.

---

## Future Improvements

- [ ] Move API key to a secure backend (Node.js/Express)
- [ ] Support multiple SQL dialects (MySQL, PostgreSQL, SQL Server)
- [ ] Save schema/history to local storage
- [ ] Add a "run query" mode connected to a real database
- [ ] Export query history as a file

---

## Disclaimer

This is a learning/demo project. AI-generated SQL should always be **reviewed before running on a production database** — especially for `UPDATE`, `DELETE`, or `DROP` statements.

---

## License

MIT License — feel free to use, modify, and share.
