import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  authorizedAdmins: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  authorizedAdmins: [],
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorizedAdmins, setAuthorizedAdmins] = useState<string[]>(['nilora23x@gmail.com']);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user is registered in admins collection or matches primary studio administrator
        const userEmail = currentUser.email?.toLowerCase();
        let adminStatus = userEmail === 'nilora23x@gmail.com';

        try {
          // Check by UID doc or by email
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminDocRef);

          if (adminSnap.exists()) {
            adminStatus = true;
          } else if (userEmail) {
            const emailDocRef = doc(db, 'admins', userEmail);
            const emailSnap = await getDoc(emailDocRef);
            if (emailSnap.exists()) {
              adminStatus = true;
            }
          }

          // If primary studio admin signs in, auto-bootstrap their admin record in Firestore
          if (userEmail === 'nilora23x@gmail.com' && (!adminSnap.exists())) {
            await setDoc(doc(db, 'admins', currentUser.uid), {
              email: currentUser.email,
              displayName: currentUser.displayName || 'Primary Administrator',
              role: 'super_admin',
              createdAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (e) {
          console.error('Admin status verification check error:', e);
          // Fallback to email verification
          adminStatus = userEmail === 'nilora23x@gmail.com';
        }

        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, loginWithGoogle, loginWithEmail, registerWithEmail, logout, authorizedAdmins }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
