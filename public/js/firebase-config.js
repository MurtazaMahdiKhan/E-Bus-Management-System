// firebase-config.js

// Firebase configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDriVGy2sV-tkDON6YVT1SjnpSv5740RM",
  authDomain: "e-bus-management-4a228.firebaseapp.com",
  projectId: "e-bus-management-4a228",
  storageBucket: "e-bus-management-4a228.firebasestorage.app",
  messagingSenderId: "145301167108",
  appId: "1:145301167108:web:6f7da4bc98f677f1f62951",
  measurementId: "G-DY8HF8XFVR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Logging utility function
const logEvent = async (eventType, data) => {
    const timestamp = new Date().toISOString();
    
    // Console logging for development
    console.log(`[${timestamp}] ${eventType}:`, data);
    
    try {
        // Get current user if available
        const user = auth.currentUser;
        const userId = user ? user.uid : 'anonymous';

        // Create log entry
        const logEntry = {
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            eventType: eventType,
            data: data,
            userId: userId,
            userEmail: user ? user.email : 'anonymous',
            userAgent: navigator.userAgent,
            path: window.location.pathname
        };

        // Store in Firestore
        await db.collection('logs').add(logEntry);

        // If it's an error event, store in separate error collection
        if (eventType.includes('error')) {
            await db.collection('errors').add({
                ...logEntry,
                resolved: false
            });
        }

    } catch (error) {
        // Fallback logging if Firestore logging fails
        console.error('Logging to Firestore failed:', error);
        
        // Store in localStorage as backup
        const localLogs = JSON.parse(localStorage.getItem('failedLogs') || '[]');
        localLogs.push({
            timestamp,
            eventType,
            data,
            error: error.message
        });
        localStorage.setItem('failedLogs', JSON.stringify(localLogs));
    }
};

// Firebase error handler
const handleFirebaseError = (error) => {
    const errorMessage = {
        code: error.code,
        message: error.message,
        stack: error.stack
    };

    logEvent('firebase_error', errorMessage);

    // Return user-friendly error message
    switch (error.code) {
        case 'auth/user-not-found':
            return 'Invalid email or password';
        case 'auth/wrong-password':
            return 'Invalid email or password';
        case 'auth/email-already-in-use':
            return 'Email already registered';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters';
        case 'auth/invalid-email':
            return 'Invalid email format';
        case 'auth/operation-not-allowed':
            return 'Operation not allowed';
        default:
            return 'An error occurred. Please try again';
    }
};

// Check if Firebase is initialized correctly
const checkFirebaseConnection = async () => {
    try {
        await firebase.firestore().collection('test').get();
        logEvent('firebase_connection_success', { timestamp: new Date().toISOString() });
        return true;
    } catch (error) {
        logEvent('firebase_connection_error', { error: error.message });
        return false;
    }
};

// Real-time connection state monitor
firebase.database().ref('.info/connected').on('value', (snap) => {
    const isConnected = snap.val();
    logEvent('connection_state_changed', { 
        connected: isConnected,
        timestamp: new Date().toISOString()
    });
});

// Export needed functions and objects
export {
    auth,
    db,
    logEvent,
    handleFirebaseError,
    checkFirebaseConnection
};