# 🧠 Mindmap Organization Tool

An interactive task management application with drag-and-drop functionality, built with React, TypeScript, and Firebase.

## ✨ Features

- **Interactive Mindmap**: Drag and drop tasks between different life areas
- **4 Views**: Map, Whiteboard, Calendar, and Daily planning views
- **Daily Planning**: Select tasks for focused daily todos
- **Real-time Sync**: Firebase integration for cross-device synchronization
- **Priority System**: Visual priority indicators with size-based pins
- **Modern UI**: Custom color palette with glassmorphism effects
- **Keyboard Shortcuts**: Quick navigation (1-4 keys)

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS, React Flow
- **State**: Zustand
- **Database**: Firebase Firestore
- **Deployment**: Vercel-ready

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it (e.g., "mindmap-organizer")
4. Enable Google Analytics (optional)

### 2. Setup Firestore Database
1. In Firebase Console → "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your region

### 3. Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Web app" icon (</>)
4. Register app name
5. Copy the config object

### 4. Configure Environment Variables
1. Copy `.env.example` to `.env`
2. Fill in your Firebase config:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Usage

1. **Map View**: Drag tasks between life areas (School, Sport, Business, Projects, Leisure)
2. **Daily Planning**: Click the ✨ button to enter planning mode, then click tasks to add to daily todos
3. **Views**: Use keyboard shortcuts (1-4) or navigation buttons
4. **Task Management**: Click tasks to edit, or use the + button to create new ones

## 🎨 Color Palette

- **Orange**: `#780000` - High priority elements
- **Crimson**: `#c1121f` - Important actions  
- **Cream**: `#fdf0d5` - Background elements
- **Navy**: `#003049` - Primary text and borders
- **Blue**: `#669bbc` - Secondary elements

## 🔐 Security Rules (Production)

Update Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users on their own data
    match /tasks/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /taskDetails/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /userData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 Deploy to Vercel

1. Push code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

## 📄 License

MIT License - feel free to use for personal and commercial projects!