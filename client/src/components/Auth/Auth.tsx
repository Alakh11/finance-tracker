import { useState } from 'react';
import axios from 'axios';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { Mail, Phone, Lock, User as UserIcon, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  // UI States
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [method, setMethod] = useState<'email' | 'mobile'>('email');
  const [step, setStep] = useState<'form' | 'otp'>('form'); // 'form' -> 'otp'
  
  // Data States
  const [formData, setFormData] = useState({ name: '', contact: '', password: '', otp: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = "https://finance-tracker-q60v.onrender.com";

  // --- 1. Handle Standard Submit (Login / Register / Verify) ---
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
        // A. SIGNUP REQUEST -> SENDS OTP
        if (mode === 'signup' && step === 'form') {
            if(!formData.name || !formData.contact || !formData.password) throw new Error("All fields are required");
            
            await axios.post(`${API_URL}/auth/register`, {
                name: formData.name,
                contact: formData.contact,
                password: formData.password,
                contact_type: method
            });
            setStep('otp'); // Move to OTP screen
            alert(`OTP sent to ${formData.contact}`);
        } 
        // B. VERIFY OTP -> COMPLETES SIGNUP
        else if (mode === 'signup' && step === 'otp') {
            const res = await axios.post(`${API_URL}/auth/verify`, {
                contact: formData.contact,
                otp: formData.otp
            });
            onLoginSuccess(res.data.user, res.data.token);
        }
        // C. LOGIN REQUEST -> DIRECT ACCESS
        else if (mode === 'login') {
            const res = await axios.post(`${API_URL}/auth/login`, {
                contact: formData.contact,
                password: formData.password
            });
            onLoginSuccess(res.data.user, res.data.token);
        }
    } catch (err: any) {
        setError(err.response?.data?.detail || err.message || "Something went wrong");
    } finally {
        setLoading(false);
    }
  };

  // --- 2. Handle Google Login ---
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (credentialResponse.credential) {
        try {
            setLoading(true);
            // Decode Google Token to get basic info
            const decoded: any = jwtDecode(credentialResponse.credential);
            
            // Send to Backend to sync DB and get App Token
            const res = await axios.post(`${API_URL}/auth/google`, {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            });
            
            onLoginSuccess(res.data.user, res.data.token);
        } catch (err) {
            setError("Google Login Failed");
        } finally {
            setLoading(false);
        }
    }
  };

  return (
    <div className="w-full max-w-md bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/50 animate-fade-in-up">
        
        {/* Header */}
        <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your finances intelligently.</p>
        </div>

        {/* Google Button */}
        {step === 'form' && (
            <>
                <div className="flex justify-center mb-6">
                    <GoogleLogin 
                        onSuccess={handleGoogleSuccess} 
                        onError={() => setError("Google Login Failed")}
                        shape="pill"
                        width="100%"
                        text={mode === 'login' ? "signin_with" : "signup_with"}
                    />
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-slate-500">Or continue with</span></div>
                </div>
            </>
        )}

        {/* Method Toggle (Email vs Mobile) */}
        {step === 'form' && (
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button onClick={() => setMethod('email')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${method === 'email' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Email</button>
                <button onClick={() => setMethod('mobile')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${method === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>Mobile</button>
            </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
            {/* Name Field (Signup Only) */}
            {mode === 'signup' && step === 'form' && (
                <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-100 transition-all"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
            )}

            {step === 'form' ? (
                <>
                    {/* Contact Field */}
                    <div className="relative group">
                        {method === 'email' ? 
                            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" /> : 
                            <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        }
                        <input 
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder={method === 'email' ? "Email Address" : "Mobile Number"}
                            value={formData.contact}
                            onChange={e => setFormData({...formData, contact: e.target.value})}
                        />
                    </div>
                    
                    {/* Password Field */}
                    <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                            type="password"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="Password"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                        />
                    </div>
                </>
            ) : (
                /* OTP Field */
                <div className="relative animate-in fade-in zoom-in">
                    <CheckCircle className="absolute left-4 top-3.5 w-5 h-5 text-emerald-500" />
                    <input 
                        className="w-full pl-12 pr-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl outline-none font-bold text-lg tracking-widest text-center text-emerald-800 focus:ring-2 focus:ring-emerald-100 transition-all"
                        placeholder="ENTER OTP"
                        value={formData.otp}
                        onChange={e => setFormData({...formData, otp: e.target.value})}
                        autoFocus
                    />
                    {/* <p className="text-xs text-center text-slate-400 mt-2 font-medium">Check your server console for the mock code.</p> */}
                </div>
            )}
        </div>

        {/* Error Message */}
        {error && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-rose-50 text-rose-600 text-sm font-bold rounded-xl">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        )}

        {/* Submit Button */}
        <button 
            onClick={handleSubmit} 
            disabled={loading}
            className="w-full mt-6 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {loading ? 'Processing...' : (step === 'otp' ? 'Verify & Login' : (mode === 'login' ? 'Sign In' : 'Send OTP'))}
            {!loading && <ArrowRight className="w-4 h-4" />}
        </button>

        {/* Mode Toggle */}
        {step === 'form' && (
            <div className="mt-6 text-center">
                <p className="text-slate-500 text-sm font-medium">
                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"} 
                    <button 
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="ml-2 font-bold text-blue-600 hover:underline"
                    >
                        {mode === 'login' ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        )}
    </div>
  );
}