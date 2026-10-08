import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { getAllUsers, saveUserRecord, logActivity } from '../services/storageService';

const AuthContext = createContext(null);

const LOCAL_SESSION_KEY = 'qr_studio_current_session';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [loading, setLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);

  useEffect(() => {
    const configured = isFirebaseConfigured();
    setIsFirebaseActive(configured);

    if (configured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          if (firebaseUser.isAnonymous) {
            // Legacy anonymous accounts are no longer supported per app policy
            await signOut(auth);
            setUser(null);
            setRole('user');
            setLoading(false);
            return;
          }

          // Check role from users list or metadata
          const users = getAllUsers();
          const match = users.find(u => u.uid === firebaseUser.uid);
          const currentRole = match?.role || (firebaseUser.email?.includes('admin') ? 'admin' : 'user');
          
          const profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
            photoURL: firebaseUser.photoURL || null,
            role: currentRole,
          };
          setUser(profile);
          setRole(currentRole);
          saveUserRecord(profile);
        } else {
          setUser(null);
          setRole('user');
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Offline / Local Session Mode
      try {
        const cached = localStorage.getItem(LOCAL_SESSION_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Clean up old demo-user-1 session if present
          if (parsed?.uid === 'demo-user-1' || parsed?.email === 'alex.creator@qrstudio.app') {
            localStorage.removeItem(LOCAL_SESSION_KEY);
            setUser(null);
          } else {
            // Normal users should always be standard 'user'
            const standardRole = parsed?.email?.includes('admin') ? 'admin' : 'user';
            const normalized = { ...parsed, role: standardRole };
            setUser(normalized);
            setRole(standardRole);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Session restore failed', e);
        setUser(null);
      }
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    if (isFirebaseActive && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const profile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
      };
      setUser(profile);
      setRole(profile.role);
      logActivity({
        userId: profile.uid,
        userEmail: profile.email,
        type: 'AUTH_LOGIN',
        details: 'User logged in via Firebase',
      });
      return profile;
    } else {
      // Local mode login
      const allUsers = getAllUsers();
      const existing = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      const userProfile = existing || {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
      };
      
      setUser(userProfile);
      setRole(userProfile.role);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(userProfile));
      saveUserRecord(userProfile);

      logActivity({
        userId: userProfile.uid,
        userEmail: userProfile.email,
        type: 'AUTH_LOGIN',
        details: 'User logged in',
      });
      return userProfile;
    }
  };

  const signup = async (email, password, displayName) => {
    if (isFirebaseActive && auth) {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateFirebaseProfile(res.user, { displayName });
      }
      const profile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: displayName || email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
      };
      setUser(profile);
      setRole(profile.role);
      saveUserRecord(profile);

      logActivity({
        userId: profile.uid,
        userEmail: profile.email,
        type: 'AUTH_SIGNUP',
        details: 'New user registered via Firebase',
      });
      return profile;
    } else {
      const newProfile = {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        email,
        displayName: displayName || email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      setUser(newProfile);
      setRole(newProfile.role);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newProfile));
      saveUserRecord(newProfile);

      logActivity({
        userId: newProfile.uid,
        userEmail: newProfile.email,
        type: 'AUTH_SIGNUP',
        details: 'New user registered',
      });
      return newProfile;
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseActive && auth) {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const profile = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || res.user.email.split('@')[0],
        photoURL: res.user.photoURL,
        role: res.user.email.includes('admin') ? 'admin' : 'user',
      };
      setUser(profile);
      setRole(profile.role);
      saveUserRecord(profile);
      logActivity({
        userId: profile.uid,
        userEmail: profile.email,
        type: 'AUTH_GOOGLE_LOGIN',
        details: 'User authenticated with Google',
      });
      return profile;
    } else {
      // Local fallback
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const profile = {
        uid: 'google_user_' + randomSuffix,
        email: `user.${randomSuffix}@gmail.com`,
        displayName: 'Google User',
        photoURL: null,
        role: 'user',
      };
      setUser(profile);
      setRole(profile.role);
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
      saveUserRecord(profile);
      logActivity({
        userId: profile.uid,
        userEmail: profile.email,
        type: 'AUTH_GOOGLE_LOGIN',
        details: 'User authenticated with Google',
      });
      return profile;
    }
  };

  const logout = async () => {
    if (isFirebaseActive && auth) {
      await signOut(auth);
    }
    setUser(null);
    setRole('user');
    localStorage.removeItem(LOCAL_SESSION_KEY);
  };


  const resetPassword = async (email) => {
    if (isFirebaseActive && auth) {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset link sent to your email.' };
    }
    return { success: true, message: 'Password reset simulation: Instructions sent.' };
  };

  const updateProfile = (name) => {
    const updated = { ...user, displayName: name };
    setUser(updated);
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(updated));
    saveUserRecord(updated);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      loading,
      isFirebaseActive,
      login,
      signup,
      loginWithGoogle,
      logout,
      resetPassword,
      updateProfile,
    }}>

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
