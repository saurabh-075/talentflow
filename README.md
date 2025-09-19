
# TalentFlowPro (Web)

A hiring platform built with **React, Vite, and TypeScript**, styled with **TailwindCSS**, and tested with **Vitest**.  
The project runs on **http://localhost:4000/** during development.

---

## 🚀 Setup

### Prerequisites
- Node.js >= 18.x (recommended: Node 18 LTS)
- npm (comes with Node.js) or Bun (bun.lock is included)

### Installation
Clone the repository and install dependencies:

```bash
cd WEB
npm install   # or bun install
````

### Development

Start the development server:

```bash
npm run dev
```

By default, the app will be available at:

👉 [http://localhost:4000](http://localhost:4000)

### Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## 🏗️ Architecture

```
WEB/
├── src/                # Core application source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-based pages
│   ├── hooks/          # Custom React hooks
│   ├── styles/         # Tailwind/global CSS
│   └── main.tsx        # Application entry point
├── plugins/            # Vite, Tailwind, Router, other config plugins
├── test/               # Unit and integration tests (Vitest)
├── package.json        # Scripts and dependencies
├── vite.config.ts      # Vite bundler configuration
├── tailwind.config.js  # Tailwind setup
├── tsconfig.json       # TypeScript configuration
└── vitest.config.ts    # Vitest testing configuration
```

* **Vite** → Development server & bundler
* **React + React Router** → SPA framework & routing
* **TailwindCSS** → Utility-first CSS styling
* **TypeScript** → Static typing & tooling
* **Vitest** → Testing framework

---

## ⚠️ Known Issues

* **404 when opening `localhost:5173`**
  This project is configured to serve on **port 4000**, not 5173.
  ✅ Always use [http://localhost:4000](http://localhost:4000).

* **Node v20 compatibility issues**
  Some dependencies may break under Node v20.
  ✅ Use Node v18 LTS.

* **Missing npm scripts**
  If `npm run dev` fails, ensure your `package.json` has:

  ```json
  "scripts": {
    "dev": "vite --host --port 4000",
    "build": "vite build",
    "preview": "vite preview",
    "start": "vite preview"
  }
  ```

---

## 🔧 Technical Decisions

* **Vite** chosen for fast builds and hot reloads.
* **React + TypeScript** for robust, scalable UI development.
* **TailwindCSS** for rapid, consistent styling.
* **React Router v6** for modern routing.
* **Vitest** for lightweight, Vite-native testing.
* Port **4000** selected to avoid conflicts and align with backend API (if present).

---

