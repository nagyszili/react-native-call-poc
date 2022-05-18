import React, { useContext, useState, createContext } from "react";

const CallContext = createContext();

// eslint-disable-next-line react/prop-types
const CallProvider = ({ children }) => {
  const [currentCall, setCurrentCall] = useState(null);
  const [registeredName, setRegisteredName] = useState("Unregistered");

  return (
    <CallContext.Provider
      value={{ currentCall, setCurrentCall, registeredName, setRegisteredName }}
    >
      {children}
    </CallContext.Provider>
  );
};

const useCallContext = () => useContext(CallContext) || {};

export default CallContext;
export { CallProvider, useCallContext };
