# Mindmap – Spatial Task Management# React + TypeScript + Vite



Eine elegante, räumlich organisierte Aufgabenverwaltung mit drei komplementären Ansichten für optimale Produktivität.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🎯 KonzeptCurrently, two official plugins are available:



Mindmap organisiert Aufgaben über **fünf Lebensbereiche** hinweg:- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- **Schule** (Blau)- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- **Sport** (Grün)

- **Geschäft** (Lila)## React Compiler

- **Projekte** (Orange)

- **Freizeitaktivitäten** (Pink) - als übergreifender Umbrella-BereichThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



## 🎨 Drei Views## Expanding the ESLint configuration



### 1. 🗺️ Map View – Die große KarteIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- **Zweck**: Räumliche, mentale Übersicht ohne Listen-Overload

- Unendlicher Canvas mit Zoom/Pan```js

- Fünf überlappende Kreisbereicheexport default defineConfig([

- Drei Pin-Typen (Form-basiert):  globalIgnores(['dist']),

  - **⭕ Repetitiv**: Runder Pin mit Ring (Frequenz)  {

  - **□ Einmalig**: Rechteckiger Pin (feste Kontur)    files: ['**/*.{ts,tsx}'],

  - **△ Groß/Projekt**: Dreieckiger Pin (mit Expand-Lasche)    extends: [

- Drag & Drop in Bereiche/Schnittmengen → automatisches Tagging      // Other configs...

- Hybrid-Aufgaben in Schnittmengen (max. 2 Bereiche)

      // Remove tseslint.configs.recommended and replace with this

### 2. 📋 Whiteboard View – Liste mit Struktur      tseslint.configs.recommendedTypeChecked,

- **Zweck**: Schnell arbeiten ohne Grafik      // Alternatively, use this for stricter rules

- Fünf Sektionen nach Bereichen      tseslint.configs.strictTypeChecked,

- Drei Unterabschnitte: Repetitiv, Einmalig, Groß      // Optionally, add this for stylistic rules

- Sortierung: Priorität → Fälligkeit      tseslint.configs.stylisticTypeChecked,

- Expandierbare Groß-Tasks mit Subtasks

- Hybrid-Aufgaben erscheinen in beiden Bereichen      // Other configs...

    ],

### 3. 📅 Calendar View – Deadlines sichtbar machen    languageOptions: {

- **Zweck**: Zeitbezug für Fälligkeiten      parserOptions: {

- Wochenraster mit Deadlines        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- Meilensteine aus Groß-Tasks        tsconfigRootDir: import.meta.dirname,

- Repetitiv-Instanzen als getönte Marker      },

- Optionale Time-Blocks (lokal, kein Sync im MVP)      // other options...

    },

## 🎯 Task-Typen  },

])

| Typ | Form | Verwendung |```

|-----|------|------------|

| **Repetitiv** | ⭕ Kreis mit Ring | Wiederkehrende Gewohnheiten |You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

| **Einmalig** | □ Rechteck | To-Do mit Deadline |

| **Groß/Projekt** | △ Dreieck | Subtasks, Meilensteine, Fortschritt |```js

// eslint.config.js

## 🚀 Quick Startimport reactX from 'eslint-plugin-react-x'

import reactDom from 'eslint-plugin-react-dom'

```bash

# Installationexport default defineConfig([

npm install  globalIgnores(['dist']),

  {

# Development Server starten    files: ['**/*.{ts,tsx}'],

npm run dev    extends: [

      // Other configs...

# Build für Production      // Enable lint rules for React

npm run build      reactX.configs['recommended-typescript'],

```      // Enable lint rules for React DOM

      reactDom.configs.recommended,

Die App läuft dann auf: **http://localhost:5173**    ],

    languageOptions: {

## ⌨️ Tastaturkürzel      parserOptions: {

        project: ['./tsconfig.node.json', './tsconfig.app.json'],

- **1** → Map View        tsconfigRootDir: import.meta.dirname,

- **2** → Whiteboard View      },

- **3** → Calendar View      // other options...

- **N** → Neuer Task (geplant)    },

- **E** → Expand (geplant)  },

- **F** → Filter (geplant)])

```

## 🎨 Designprinzipien

- **Clean UI**: Keine Emojis (außer Navigation)
- **Formensprache**: Einziger "Code" für Task-Typen
- **Ruhige Farbskala**: Hoher Kontrast pro Bereich
- **200ms Transitions**: Keine überflüssigen Animationen
- **Typografie**: Klare Hierarchie, maximale Lesbarkeit

## 🏗️ Tech Stack

- **React 19** + **TypeScript**
- **Vite** – Build Tool
- **React Flow** – Map View Canvas
- **Zustand** – State Management
- **Tailwind CSS** – Styling
- **date-fns** – Datumshandling

## 📁 Projektstruktur

```
src/
├── components/
│   ├── pins/
│   │   └── TaskPin.tsx        # Pin-Komponenten (3 Typen)
│   └── views/
│       ├── MapView.tsx         # Infinite Canvas
│       ├── WhiteboardView.tsx  # Listen-Ansicht
│       └── CalendarView.tsx    # Kalender
├── stores/
│   └── appStore.ts             # Zustand State Management
├── types/
│   └── index.ts                # TypeScript Typen
├── utils/
│   ├── geometry.ts             # Kreis-Berechnungen
│   ├── dateHelpers.ts          # Datums-Utils
│   └── demoData.ts             # Demo-Aufgaben
└── App.tsx                     # Haupt-App mit Navigation
```

## 🎯 MVP Features (Implementiert)

✅ Map mit fünf Kreisen, Overlaps, Zoom/Pan  
✅ Drag-Drop für Pins inkl. Intersections  
✅ Drei Pin-Typen mit unterschiedlichen Formen  
✅ Whiteboard mit fünf Sektionen  
✅ Calendar mit Deadline-Markern  
✅ Automatisches Setzen von Bereichstags  
✅ Hybrid-Aufgaben (2 Bereiche)  
✅ View-Wechsel via Tastatur (1-3)  
✅ Demo-Daten zum Testen  

## 🔮 Roadmap (Should-Haves)

- [ ] Clustering der Pins je Zoomstufe
- [ ] Focus Mode und Filter
- [ ] WIP-Warnung für zu viele Groß-Pins
- [ ] Minimap (teilweise in React Flow vorhanden)
- [ ] Task-Editor Modal
- [ ] Subtask/Milestone Management
- [ ] Recurrence Editor
- [ ] Time-Block Drag & Drop

## 🔧 Entwicklung

```bash
# Lint
npm run lint

# TypeScript Check
npm run build
```

## 📝 Edge Cases

- **Max. 2 Bereiche** pro Task (für Hybrid)
- **Überfüllte Intersections**: Auto-Stacking geplant
- **Repetitiv ohne Start**: UI fordert Startdatum

## 📄 Lizenz

Private project – All rights reserved

---

**Viel Erfolg mit Mindmap!** 🚀
