import React, { createContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [userData, setUserData] = useState(null);

  const verifyUser = (data) => {
    setIsVerified(true);
    setUserData(data);
  };

  const logout = () => {
    setIsVerified(false);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ isVerified, userData, verifyUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
