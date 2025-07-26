import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

interface BiometricAuthContextType {
  isSupported: boolean;
  isEnrolled: boolean;
  authenticate: () => Promise<void>;
}

const BiometricAuthContext = createContext<BiometricAuthContextType | undefined>(undefined);

export const BiometricAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsSupported(compatible);

    if (compatible) {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);
    }
  };

  const authenticate = async (): Promise<void> => {
    if (!isSupported || !isEnrolled) {
      throw new Error('Biometric authentication not available');
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (!result.success) {
      throw new Error('Authentication failed');
    }
  };

  return (
    <BiometricAuthContext.Provider
      value={{
        isSupported,
        isEnrolled,
        authenticate,
      }}
    >
      {children}
    </BiometricAuthContext.Provider>
  );
};

export const useBiometricAuth = () => {
  const context = useContext(BiometricAuthContext);
  if (context === undefined) {
    throw new Error('useBiometricAuth must be used within a BiometricAuthProvider');
  }
  return context;
};
