# 🧠 Mindmap Organization Tool# Mindmap – Spatial Task Management# React + TypeScript + Vite



An interactive task management application with drag-and-drop functionality, built with React, TypeScript, and Firebase.



## ✨ FeaturesEine elegante, räumlich organisierte Aufgabenverwaltung mit drei komplementären Ansichten für optimale Produktivität.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



- **Interactive Mindmap**: Drag and drop tasks between different life areas

- **4 Views**: Map, Whiteboard, Calendar, and Daily planning views

- **Daily Planning**: Select tasks for focused daily todos## 🎯 KonzeptCurrently, two official plugins are available:

- **Real-time Sync**: Firebase integration for cross-device synchronization

- **Priority System**: Visual priority indicators with size-based pins

- **Modern UI**: Custom color palette with glassmorphism effects

- **Keyboard Shortcuts**: Quick navigation (1-4 keys)Mindmap organisiert Aufgaben über **fünf Lebensbereiche** hinweg:- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh



## 🚀 Tech Stack- **Schule** (Blau)- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh



- **Frontend**: React 19, TypeScript, Vite- **Sport** (Grün)

- **UI**: Tailwind CSS, React Flow

- **State**: Zustand- **Geschäft** (Lila)## React Compiler

- **Database**: Firebase Firestore

- **Deployment**: Vercel-ready- **Projekte** (Orange)



## 🔥 Firebase Setup- **Freizeitaktivitäten** (Pink) - als übergreifender Umbrella-BereichThe React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).



### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)

2. Click "Create a project"## 🎨 Drei Views## Expanding the ESLint configuration

3. Name it (e.g., "mindmap-organizer")

4. Enable Google Analytics (optional)



### 2. Setup Firestore Database### 1. 🗺️ Map View – Die große KarteIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

1. In Firebase Console → "Firestore Database"

2. Click "Create database"- **Zweck**: Räumliche, mentale Übersicht ohne Listen-Overload

3. Choose "Start in test mode" (for development)

4. Select your region- Unendlicher Canvas mit Zoom/Pan```js



### 3. Get Configuration- Fünf überlappende Kreisbereicheexport default defineConfig([

1. Go to Project Settings (gear icon)

2. Scroll to "Your apps" section- Drei Pin-Typen (Form-basiert):  globalIgnores(['dist']),

3. Click "Web app" icon (</>)

4. Register app name  - **⭕ Repetitiv**: Runder Pin mit Ring (Frequenz)  {

5. Copy the config object

  - **□ Einmalig**: Rechteckiger Pin (feste Kontur)    files: ['**/*.{ts,tsx}'],

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`  - **△ Groß/Projekt**: Dreieckiger Pin (mit Expand-Lasche)    extends: [

2. Fill in your Firebase config:

- Drag & Drop in Bereiche/Schnittmengen → automatisches Tagging      // Other configs...

```env

VITE_FIREBASE_API_KEY=your-api-key-here- Hybrid-Aufgaben in Schnittmengen (max. 2 Bereiche)

VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com

VITE_FIREBASE_PROJECT_ID=your-project-id      // Remove tseslint.configs.recommended and replace with this

VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id### 2. 📋 Whiteboard View – Liste mit Struktur      tseslint.configs.recommendedTypeChecked,

VITE_FIREBASE_APP_ID=your-app-id

```- **Zweck**: Schnell arbeiten ohne Grafik      // Alternatively, use this for stricter rules



## 🛠️ Development- Fünf Sektionen nach Bereichen      tseslint.configs.strictTypeChecked,



```bash- Drei Unterabschnitte: Repetitiv, Einmalig, Groß      // Optionally, add this for stylistic rules

# Install dependencies

npm install- Sortierung: Priorität → Fälligkeit      tseslint.configs.stylisticTypeChecked,



# Start development server- Expandierbare Groß-Tasks mit Subtasks

npm run dev

- Hybrid-Aufgaben erscheinen in beiden Bereichen      // Other configs...

# Build for production

npm run build    ],



# Preview production build### 3. 📅 Calendar View – Deadlines sichtbar machen    languageOptions: {

npm run preview

```- **Zweck**: Zeitbezug für Fälligkeiten      parserOptions: {



## 📱 Usage- Wochenraster mit Deadlines        project: ['./tsconfig.node.json', './tsconfig.app.json'],



1. **Map View**: Drag tasks between life areas (School, Sport, Business, Projects, Leisure)- Meilensteine aus Groß-Tasks        tsconfigRootDir: import.meta.dirname,

2. **Daily Planning**: Click the ✨ button to enter planning mode, then click tasks to add to daily todos

3. **Views**: Use keyboard shortcuts (1-4) or navigation buttons- Repetitiv-Instanzen als getönte Marker      },

4. **Task Management**: Click tasks to edit, or use the + button to create new ones

- Optionale Time-Blocks (lokal, kein Sync im MVP)      // other options...

## 🎨 Color Palette

    },

- **Orange**: `#780000` - High priority elements

- **Crimson**: `#c1121f` - Important actions  ## 🎯 Task-Typen  },

- **Cream**: `#fdf0d5` - Background elements

- **Navy**: `#003049` - Primary text and borders])

- **Blue**: `#669bbc` - Secondary elements

| Typ | Form | Verwendung |```

## 🔐 Security Rules (Production)

|-----|------|------------|

Update Firestore rules for production:

| **Repetitiv** | ⭕ Kreis mit Ring | Wiederkehrende Gewohnheiten |You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```javascript

rules_version = '2';| **Einmalig** | □ Rechteck | To-Do mit Deadline |

service cloud.firestore {

  match /databases/{database}/documents {| **Groß/Projekt** | △ Dreieck | Subtasks, Meilensteine, Fortschritt |```js

    // Allow read/write for authenticated users on their own data

    match /tasks/{document} {// eslint.config.js

      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;

    }## 🚀 Quick Startimport reactX from 'eslint-plugin-react-x'

    match /taskDetails/{document} {

      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;import reactDom from 'eslint-plugin-react-dom'

    }

    match /userData/{userId} {```bash

      allow read, write: if request.auth != null && request.auth.uid == userId;

    }# Installationexport default defineConfig([

  }

}npm install  globalIgnores(['dist']),

```

  {

## 🚀 Deploy to Vercel

# Development Server starten    files: ['**/*.{ts,tsx}'],

1. Push code to GitHub

2. Connect repository to [Vercel](https://vercel.com)npm run dev    extends: [

3. Add environment variables in Vercel dashboard

4. Deploy automatically on push      // Other configs...



## 📄 License# Build für Production      // Enable lint rules for React



MIT License - feel free to use for personal and commercial projects!npm run build      reactX.configs['recommended-typescript'],

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
