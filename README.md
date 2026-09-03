# Sanity Teacher Management Portal

A full-stack web application with an **Express.js backend** and a modern **HTML / CSS / Vanilla JavaScript frontend** designed to manage, create, and edit `teacher` documents in Sanity CMS based on your schema.

---

## Features

- 🔒 **Secure Express Backend**: Keeps your Sanity API write token securely on the server side instead of exposing it in client-side code.
- ⚡ **Full Sanity Schema Coverage**:
  - **Identity & Core**: `name`, `department` (reference selector), `isHOD` (toggle), `designation`, `specialization`, `staffRoom`.
  - **Photo Handling**: Live preview, drag-and-drop dropzone, and direct asset upload to Sanity (`client.assets.upload`).
  - **Contact & Quotes**: `email`, `phone`, `wordFromTeacher`.
  - **Narrative & Paragraphs**: `about` (dynamic multi-paragraph manager).
  - **Dynamic String Arrays** (Quick add, edit, reorder, and remove):
    - `qualification`
    - `experience`
    - `courses_handled`
    - `fields_of_expertise`
    - `research`
    - `patents`
    - `books_published`
    - `awards_and_honours`
    - `positions_handled`
    - `industry_interaction`
    - `other_details`
  - **Publications Repeater**: Object array of `{ title: text, link: url }` with expandable cards and instant URL link testing.
- 🎨 **Modern SaaS Interface**:
  - Searchable sidebar directory with department filtering and active card selection.
  - Tabbed editor to organize 22+ schema fields cleanly.
  - Real-time save status indicators and toast notifications.
  - Raw JSON viewer to inspect the exact payload sent to Sanity.
- 🧪 **Built-in Demo / Mock Mode**: Works out-of-the-box with sample teacher profiles even before connecting Sanity credentials.

---

## Project Structure

```
Edit_Teachers/
├── server/
│   ├── server.js          # Express app entry point & static file server
│   ├── sanityService.js   # Sanity client, queries, mutations & demo fallback
│   └── routes.js          # REST API routes (/api/teachers, /api/departments, /api/upload-photo, etc.)
├── public/
│   ├── index.html         # Modern web app interface
│   ├── css/
│   │   ├── main.css       # Core design tokens, layout & typography
│   │   ├── components.css # Badges, buttons, modals, toasts & tabs
│   │   └── form.css       # Form inputs, photo uploader & dynamic array managers
│   └── js/
│       ├── api.js         # Frontend HTTP client
│       ├── dynamicFields.js # Array managers for strings & publications
│       ├── formManager.js # Form validation, prefilling & payload serializer
│       └── app.js         # State coordination, filtering & UI events
├── .env.example           # Sample environment variables
├── .env                   # Configuration file
└── package.json           # Node.js dependencies
```

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Sanity (Choose Option A or B)

#### Option A: Via the Web Interface (Recommended)
1. Start the server (`npm start`).
2. Open `http://localhost:3000` in your browser.
3. Click the **"Sanity Config"** button in the top right.
4. Enter your **Project ID**, **Dataset** (e.g., `production`), and **API Write Token**.
5. Click **"Test Connection"** and **"Save & Connect"**.

#### Option B: Via `.env` File
Create or edit `.env` in the root directory:
```env
PORT=3000
SANITY_PROJECT_ID=your_sanity_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_editor_or_admin_token
SANITY_API_VERSION=2024-01-01
```

> **Note on Sanity Tokens**:
> Generate an API token with **Editor** or **Administrator** role at [manage.sanity.io](https://manage.sanity.io) -> **Project Settings** -> **API** -> **Tokens**.

### 3. Start the Application
```bash
npm start
```
Open **http://localhost:3000** in your browser.

---

## API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Connection health check and active Sanity project/dataset info |
| `GET` | `/api/config` | Read current backend configuration metadata |
| `POST`| `/api/config` | Update Sanity credentials dynamically |
| `GET` | `/api/teachers` | List all teachers (supports `?search=query`) |
| `GET` | `/api/teachers/:id` | Get single teacher document |
| `POST`| `/api/teachers` | Create a new teacher in Sanity |
| `PUT` | `/api/teachers/:id` | Update an existing teacher in Sanity |
| `DELETE` | `/api/teachers/:id` | Delete teacher document from Sanity |
| `GET` | `/api/departments` | Fetch departments for reference picker (`*[_type == "department"]`) |
| `POST`| `/api/upload-photo` | Multipart upload for teacher photo directly to Sanity Image Assets |
