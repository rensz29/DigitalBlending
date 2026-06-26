import { createContext, useContext } from 'react';

export const OpcuaFlowContext = createContext(null);

export function useOpcuaFlow() {
  const ctx = useContext(OpcuaFlowContext);
  if (!ctx) {
    throw new Error('useOpcuaFlow must be used within OpcuaFlowContext.Provider');
  }
  return ctx;
}
