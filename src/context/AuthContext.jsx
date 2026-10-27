import { createContext,useContext,useEffect,useState } from 'react';
import { authService } from '../services/authService.js';
import { setCsrfToken } from '../services/creatorService.js';
const Context=createContext(null);
export function AuthProvider({children}){const [user,setUser]=useState(null),[csrf,setCsrf]=useState(''),[loading,setLoading]=useState(true);const apply=d=>{setUser(d.user);setCsrf(d.csrfToken);setCsrfToken(d.csrfToken)};useEffect(()=>{authService.session().then(apply).catch(()=>{}).finally(()=>setLoading(false))},[]);const login=async(email,password)=>apply(await authService.login(email,password));const register=async(email,password)=>apply(await authService.register(email,password));const logout=async()=>{await authService.logout(csrf);setUser(null);setCsrf('');setCsrfToken('')};return <Context.Provider value={{user,csrf,loading,login,register,logout}}>{children}</Context.Provider>}
export const useAuth=()=>useContext(Context);
