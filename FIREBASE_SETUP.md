# Firebase Setup Instructions

## Current Issues

You're experiencing 400 errors and "CONFIGURATION_NOT_FOUND" errors. This typically means:
1. Firestore database hasn't been created yet
2. Security rules are blocking access
3. Firebase project configuration issue

## Step-by-Step Fix

### 1. Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **mindmap-organizer**
3. Click **"Firestore Database"** in the left sidebar
4. Click **"Create database"**
5. **Important**: Choose **"Start in test mode"** (for development)
   - This allows read/write access for 30 days
6. Select your region (choose closest to you)
7. Click **"Enable"**

### 2. Set Up Security Rules (For Development)

In Firestore → Rules tab, use these rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for all documents (DEVELOPMENT ONLY!)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning**: These rules allow anyone to read/write your data. Only use for development!

### 3. Create Required Index

The app needs a composite index for queries:

1. In Firebase Console → Firestore → **Indexes** tab
2. Click **"Create Index"**
3. Configure:
   - **Collection ID**: `tasks`
   - **Fields to index**:
     - Field: `userId` → Order: Ascending
     - Field: `createdAt` → Order: Descending
   - **Query scope**: Collection
4. Click **"Create"**
5. Wait 1-2 minutes for index to build

**OR** click the error link in your browser console - it will automatically create the index!

### 4. Production Security Rules (Later)

When you're ready to deploy, update rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tasks - user can only access their own
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
                           request.resource.data.userId == request.auth.uid;
    }
    
    // Task details - user can only access their own
    match /taskDetails/{detailId} {
      allow read, write: if request.auth != null && 
                           request.resource.data.userId == request.auth.uid;
    }
    
    // User data - user can only access their own
    match /userData/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
    }
  }
}
```

### 5. Verify Setup

After setting up Firestore:

1. Restart your dev server: `npm run dev`
2. Open browser console
3. You should see:
   - "Firebase app initialized successfully"
   - "Firestore initialized successfully"
   - "User data initialized successfully"
   - "Received X tasks from Firebase"

### 6. Troubleshooting

**Still getting errors?**

- Clear browser cache and localStorage
- Check Firebase Console → Usage tab to see if requests are going through
- Verify your `.env` file has correct values
- Make sure Firestore is actually created (not just enabled in Firebase Console)

**Network errors (400)?**

- These often occur during Firestore creation/initialization
- Wait a few minutes and refresh
- Check if Firestore database appears in Firebase Console

**Need help?**

Check the browser console for detailed error messages. The logs now include:
- Firebase initialization status
- Firestore connection status  
- Number of tasks/todos loaded
- Detailed error messages
