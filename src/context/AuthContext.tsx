import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isMock: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Mock Auth initialization from LocalStorage
      const savedMockUser = localStorage.getItem("attendtrack_mock_user");
      if (savedMockUser) {
        try {
          setUser(JSON.parse(savedMockUser));
        } catch (_) {
          setUser(null);
        }
      }
      setLoading(false);
      setIsMock(true);
      return;
    }

    // Real Firebase Auth listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Student",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setIsMock(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isMock || !auth) {
      // Simulated Google sign in
      const defaultUser: AuthUser = {
        uid: "mock_google_user_123",
        email: "sujithgb10@gmail.com",
        displayName: "Sujith G B",
      };
      localStorage.setItem("attendtrack_mock_user", JSON.stringify(defaultUser));
      setUser(defaultUser);
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (isMock || !auth) {
      // Simulated Email sign in
      const defaultUser: AuthUser = {
        uid: `mock_email_${btoa(email).substring(0, 10)}`,
        email: email,
        displayName: email.split("@")[0].toUpperCase(),
      };
      localStorage.setItem("attendtrack_mock_user", JSON.stringify(defaultUser));
      setUser(defaultUser);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.error("Email Sign-In Error:", err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string) => {
    if (isMock || !auth) {
      // Simulated Email sign up
      const defaultUser: AuthUser = {
        uid: `mock_email_${btoa(email).substring(0, 10)}`,
        email: email,
        displayName: displayName || email.split("@")[0],
      };
      localStorage.setItem("attendtrack_mock_user", JSON.stringify(defaultUser));
      setUser(defaultUser);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        setUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
        });
      }
    } catch (err) {
      console.error("Email Sign-Up Error:", err);
      throw err;
    }
  };

  const logout = async () => {
    if (isMock || !auth) {
      localStorage.removeItem("attendtrack_mock_user");
      setUser(null);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout Error:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isMock,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
