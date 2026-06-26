import { createContext, useContext } from 'react';

export const ProcessFlowContext = createContext(null);

export function useProcessFlow() {
  const ctx = useContext(ProcessFlowContext);
  if (!ctx) {
    throw new Error('useProcessFlow must be used within ProcessFlowContext.Provider');
  }
  return ctx;
}
