
import React, { useState, useContext, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle,TrendingUp, Users, Award, Clock, Cross, X, ArrowLeft } from "lucide-react";
import { UserContext } from "../state_management/UserContext";
import apiService from "../utils/api";
import OTPInput from "./OTPInput";
import { LoginData, ApiResponse } from "../types";
// import { GoogleLogin } from '@react-oauth/google';



export default function LoginPage({activeTab, onTabChange}: {activeTab: string, onTabChange: (tab: string) => void}) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [response, setResponse] = useState<ApiResponse | null>(null);
  
  // OTP-related state
  const [showOTPInput, setShowOTPInput] = useState<boolean>(false);
  const [otp, setOtp] = useState<string>("");
  const [pendingLogin, setPendingLogin] = useState<LoginData | null>(null);

  const navigate = useNavigate();
  const { setData } = useContext(UserContext);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    return errs;
  };


const statsData = [
  {
    value: "95%",
    label: "Success Rate",
    icon: <TrendingUp className="w-5 h-5 text-green-400" />,
  },
  {
    value: "100+",
    label: "Users Hired",
    icon: <Users className="w-5 h-5 text-purple-400" />,
  },
  {
    value: "97%",
    label: "ATS Score",
    icon: <Award className="w-5 h-5 text-orange-400" />,
  },
  {
    value: "24/7",
    label: "AI Working",
    icon: <Clock className="w-5 h-5 text-blue-400" />,
  },
];



  const StatCard: React.FC<any> = ({ value, label, icon }) => {
  return (
    <div className="bg-neutral-500/20 text-white rounded-xl p-4 w-40 shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-green-900/40 p-2 rounded-lg">
          {icon || <TrendingUp className="w-5 h-5 text-green-400" />}
        </div>
        <span className="text-lg font-semibold">{value}</span>
      </div>
      <p className="text-sm text-gray-300">{label}</p>
    </div>
  );
};

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      const loginData: LoginData = { email, password };
      const response = await apiService.login(loginData);
      setResponse(response);

      if (response.message === "Login Success..!") {
        setData({ userDetails: response?.userDetails, token: response?.token });
        localStorage.setItem("userAuth", JSON.stringify({ token: response?.token, userDetails: response?.userDetails }));
        navigate('/');
      } else if (response.message === "OTP sent to your email for verification") {
        setShowOTPInput(true);
        setPendingLogin(loginData);
      } else {
        setErrors({ general: response.message || 'Login failed' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerification = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingLogin) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await apiService.verifyOTP({
        email: pendingLogin.email,
        otp: otp,
        name: '', // Not needed for login OTP
        password: pendingLogin.password
      });
      
      setResponse(response);

      if (response.message === "Login successful") {
        setData({ userDetails: response?.userDetails, token: response?.token });
        localStorage.setItem("userAuth", JSON.stringify({ token: response?.token, userDetails: response?.userDetails }));
        navigate('/');
      } else {
        setErrors({ otp: response.message || 'OTP verification failed' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ otp: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!pendingLogin) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await apiService.resendOTP({
        email: pendingLogin.email,
        name: '' // Not needed for login OTP
      });

      if (response.message === "OTP resent successfully" || response.message === "New OTP sent successfully") {
        setResponse({ message: 'OTP resent successfully! Check your email.' });
        setTimeout(() => setResponse({ message: '' }), 3000);
      } else {
        setErrors({ general: response.message || 'Failed to resend OTP' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setShowOTPInput(false);
    setOtp("");
    setPendingLogin(null);
    setResponse(null);
    setErrors({});
  };

  // Show OTP verification if needed
  if (showOTPInput) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-8 py-8 md:py-8 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 md:w-72 md:h-72 bg-orange-400 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 md:w-72 md:h-72 bg-purple-400 rounded-full blur-3xl"></div>
          </div>

          <div className="relative z-10 max-w-lg mx-auto md:mx-0 text-center md:text-left">
            <div className="flex justify-center md:justify-start items-center gap-4 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-white text-xl md:text-2xl font-bold">🔥</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  FLASHFIRE
                </h1>
                <p className="text-blue-200 text-xs md:text-sm">AI-Powered Resume Optimization</p>
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Verify Your{" "}
              <span className="block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Identity
              </span>
            </h2>

            <p className="text-base md:text-lg text-blue-200 mt-4 mb-6">
              We've sent a 6-digit verification code to your email address. Enter it below to complete your login.
            </p>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-white font-medium">Code sent to</p>
                  <p className="text-blue-200 text-sm">{pendingLogin?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-6 md:px-12 py-8 md:py-12">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <button
                onClick={handleBackToLogin}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </button>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Enter Verification Code</h3>
              <p className="text-sm md:text-lg text-gray-600">
                We've sent a 6-digit code to {pendingLogin?.email}
              </p>
            </div>
            
            <form onSubmit={handleOTPVerification} className="space-y-6">
              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-3">
                  Verification Code
                </label>
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  length={6}
                />
                {errors.otp && <p className="text-xs text-red-600 mt-2 text-center">{errors.otp}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg text-base flex justify-center items-center gap-2 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="animate-spin border-b-2 border-white w-5 h-5 rounded-full"></span>
                ) : (
                  <>
                    <span>Verify & Login</span>
                    <ArrowRight />
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resend Code
                </button>
              </div>

              {/* Success message */}
              {response?.message && response.message.includes('resent successfully') && (
                <div className="flex items-center gap-2 text-green-600 text-sm justify-center">
                  <CheckCircle className="w-4 h-4" />
                  <span>{response.message}</span>
                </div>
              )}
            </form>

            <div className="mt-6 flex justify-center gap-3 text-xs text-gray-500">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Secure & Private</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
    {/* Left Panel */}
    <div className="flex-1 flex flex-col justify-center px-6 md:px-8 py-8 md:py-8 relative ">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-40 h-40 md:w-72 md:h-72 bg-orange-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 md:w-72 md:h-72 bg-purple-400 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto md:mx-0 text-center md:text-left">
        <div className="flex justify-center md:justify-start items-center gap-4 mb-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-white text-xl md:text-2xl font-bold">🔥</span>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              FLASHFIRE
            </h1>
            <p className="text-blue-200 text-xs md:text-sm">AI-Powered Resume Optimization</p>
          </div>
        </div>

        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Transform Your{" "}
          <span className="block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            Career Journey
          </span>
        </h2>

        <p className="text-base md:text-lg text-blue-200 mt-4 mb-6">
          Join thousands of professionals who landed dream jobs with AI-optimized resumes that beat ATS.
        </p>

        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          {statsData.map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow hover:scale-105 transition transform"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/10 p-2 rounded-lg">{stat.icon}</div>
                <span className="text-lg font-semibold text-white">{stat.value}</span>
              </div>
              <p className="text-xs text-gray-300">{stat.label}</p>
            </div>
          ))}
        </div>

        <p className="text-base md:text-lg text-blue-200">
          Sign in to continue your journey toward your dream job.
        </p>
      </div>
    </div>

    {/* Right Panel */}
    <div className="w-full md:w-1/2 bg-white flex flex-col justify-center px-6 md:px-12 py-8 md:py-12">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-6">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Sign In</h3>
          <p className="text-sm md:text-lg text-gray-600">Enter your credentials to login</p>
        </div>
        
        {/* <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const res = await fetch("https://flashfire-dashboard-backend-zg4u.onrender.com/googleOAuth", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential })
                });
                const data = await res.json();
                console.log(data)
                if (data.token) {
                  setData({ userDetails: data.userDetails, token: data.token });
                  localStorage.setItem("userAuth",JSON.stringify({token : data?.token,userDetails : data?.userDetails}));
                  
                  navigate('/');
                } else {
                  setResponse({ message: data.message || 'Login failed' });
                }
  }}
  onError={() => console.log("Login Failed")}
  useOneTap
/> */}
{/* <hr />
<h1 className="text-center font-mono text-xl">OR</h1> */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border text-sm md:text-base ${
                  errors.email ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 rounded-lg border text-sm md:text-base ${
                  errors.password ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
                placeholder="********"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? (
                  <EyeOff className="text-gray-400" />
                ) : (
                  <Eye className="text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg text-base flex justify-center items-center gap-2 hover:scale-[1.02] transition"
          >
            {isLoading ? (
              <span className="animate-spin border-b-2 border-white w-5 h-5 rounded-full"></span>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight />
              </>
            )}
          </button>

          {/* Response message */}
          {errors.general && (
            <p className="text-center text-sm mt-2 text-red-500">
              {errors.general}
            </p>
          )}
        </form>

        <div className="mt-6 flex justify-center gap-3 text-xs text-gray-500">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Secure & Private</span>
        </div>
      </div>
    </div>
  </div>
);

}

