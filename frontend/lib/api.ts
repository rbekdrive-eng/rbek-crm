const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
export type ApiError = { message?: string; errors?: Record<string,string[]> };
export function getToken(){ if(typeof window==='undefined') return ''; return localStorage.getItem('rbek_token')||''; }
export function setToken(token:string){ localStorage.setItem('rbek_token',token); }
export function clearToken(){ localStorage.removeItem('rbek_token'); }
export async function api<T>(path:string, init:RequestInit={}):Promise<T>{
  const token=getToken();
  const res=await fetch(`${API_URL}${path}`,{...init,headers:{'Content-Type':'application/json','Accept':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...(init.headers||{})},cache:'no-store'});
  if(!res.ok){ const body:ApiError=await res.json().catch(()=>({message:'Erro de comunicação'})); throw new Error(body.message || `Erro ${res.status}`); }
  if(res.status===204) return undefined as T;
  return res.json();
}
