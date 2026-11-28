'use client';

import {createContext,useContext} from 'react';

/** Ordinary browser authentication readiness, never domain authorization.
 * Only the public cold shell needs to supply this SDK-backed check. */
export type RegisterSessionCheck = (refresh: boolean, signal: AbortSignal) => Promise<void>;
export const RegisterSessionContext=createContext<RegisterSessionCheck|undefined>(undefined);
export function useRegisterSession(){return useContext(RegisterSessionContext);}
