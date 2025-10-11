// // import { useState, useContext, type FormEvent } from "react"
// // import { useNavigate } from "react-router-dom"
// // import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, TrendingUp, Users, Award, Clock } from "lucide-react"
// // import { UserContext } from "../state_management/UserContext"
// // import { useUserProfile } from "../state_management/ProfileContext"
// // import { useOperationsStore } from "../state_management/Operations"
// // import { toastUtils, toastMessages } from "../utils/toast"
// // import { GoogleLogin } from '@react-oauth/google';

// // interface LoginResponse {
// //   message: string
// //   token?: string
// //   userDetails?: any
// //   userProfile?: any
// //   user?: any
// // }

// // const statsData = [
// //   {
// //     value: "95%",
// //     label: "Success Rate",
// //     icon: <TrendingUp className="w-5 h-5" />,
// //     color: "text-emerald-600",
// //   },
// //   {
// //     value: "100K+",
// //     label: "Applications Sent",
// //     icon: <Users className="w-5 h-5" />,
// //     color: "text-blue-600",
// //   },
// //   {
// //     value: "97%",
// //     label: "ATS Score",
// //     icon: <Award className="w-5 h-5" />,
// //     color: "text-orange-600",
// //   },
// //   {
// //     value: "24/7",
// //     label: "AI Working",
// //     icon: <Clock className="w-5 h-5" />,
// //     color: "text-purple-600",
// //   },
// // ]

// // export default function LoginPage({
// //   activeTab,
// //   onTabChange,
// // }: {
// //   activeTab: string
// //   onTabChange: (tab: string) => void
// // }) {
// //   const [email, setEmail] = useState<string>("")
// //   const [password, setPassword] = useState<string>("")
// //   const [showPassword, setShowPassword] = useState<boolean>(false)
// //   const [isLoading, setIsLoading] = useState<boolean>(false)
// //   const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
// //   const [response, setResponse] = useState<LoginResponse | null>(null)

// //   const navigate = useNavigate()
// //   const { setName, setEmailOperations, setRole, setManagedUsers } = useOperationsStore()
// //   const { setData } = useContext(UserContext)
// //   const { setProfileFromApi } = useUserProfile()

// //   const validate = () => {
// //     const errs: { email?: string; password?: string } = {}
// //     if (!email) errs.email = "Email is required"
// //     if (!password) errs.password = "Password is required"
// //     return errs
// //   }

// //   const handleLogin = async (e: FormEvent) => {
// //     e.preventDefault()
// //     const errs = validate()
// //     setErrors(errs)
// //     if (Object.keys(errs).length > 0) {
// //       toastUtils.error(toastMessages.validationError)
// //       return
// //     }

// //     setIsLoading(true)
// //     const loadingToast = toastUtils.loading(toastMessages.loggingIn)

// //     try {
// //       const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
// //       const loginEndpoint = email.toLowerCase().includes("@flashfirehq") ? "/operations/login" : "/login"

// //       const res = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify({ email, password }),
// //       })

// //       if (loginEndpoint == "/operations/login") {
// //         const data: LoginResponse = await res.json()
// //         setResponse(data)
// //         if (data?.message === "Login successful") {
// //           setName(data.user.name)
// //           setEmailOperations(data.user.email)
// //           setRole(data.user.role)
// //           setManagedUsers(data.user.managedUsers)
// //           toastUtils.dismissToast(loadingToast)
// //           toastUtils.success("Welcome to Operations Dashboard!")
// //           navigate("/manage")
// //         } else {
// //           toastUtils.dismissToast(loadingToast)
// //           toastUtils.error(data?.message || toastMessages.loginError)
// //         }
// //       } else {
// //         const data: LoginResponse = await res.json()
// //         setResponse(data)

// //         if (data?.message === "Login Success..!") {
// //           setData({
// //             userDetails: data?.userDetails,
// //             token: data?.token,
// //             userProfile : data?.userProfile
// //           })
// //           setProfileFromApi(data?.userProfile)
// //           localStorage.setItem(
// //             "userAuth",
// //             JSON.stringify({
// //               token: data?.token,
// //               userDetails: data?.userDetails,
// //               userProfile: data?.userProfile,
// //             }),
// //           )
// //           toastUtils.dismissToast(loadingToast)
// //           toastUtils.success(toastMessages.loginSuccess)
// //           navigate("/")
// //         } else {
// //           setData({})
// //           toastUtils.dismissToast(loadingToast)
// //           toastUtils.error(data?.message || toastMessages.loginError)
// //         }
// //       }
// //     } catch (err) {
// //       console.error(err)
// //       toastUtils.dismissToast(loadingToast)
// //       toastUtils.error(toastMessages.networkError)
// //     } finally {
// //       setIsLoading(false)
// //     }
// //   }

// //   return (
// //     <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-white to-red-50">
// //       {/* Left Panel - Marketing Content */}
// //       <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 lg:py-16 relative border-b lg:border-b-0 lg:border-r border-gray-200">
// //         {/* Subtle background effects */}
// //         <div className="absolute inset-0 overflow-hidden">
// //           <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"></div>
// //           <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-200/30 rounded-full blur-3xl"></div>
// //         </div>

// //         <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
// //           {/* Logo */}
// //           <div className="flex items-center gap-3 mb-2">
// //             <img src="/Logo.png" alt="Flashfire Logo" className="w-10 h-10 md:w-12 md:h-12" />
// //             <div>
// //               <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent">
// //                 FLASHFIRE
// //               </h1>
// //               <p className="text-xs text-gray-600">AI-Powered Resume Optimization</p>
// //             </div>
// //           </div>

// //           {/* Main Heading */}
// //           <div className="mb-4">
// //             <p className="text-sm font-medium text-orange-600 mb-1 tracking-wide uppercase">Welcome Back</p>
// //             <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-3">
// //               Transform Your{" "}
// //               <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
// //                 Career Journey
// //               </span>
// //             </h2>
// //             <p className="text-lg text-gray-700 leading-relaxed">
// //               Join hundreds of professionals who landed dream jobs with AI-optimized resumes that beat ATS systems.
// //             </p>
// //           </div>

// //           {/* Stats Grid */}
// //           <div className="grid grid-cols-2 gap-4 mb-8">
// //             {statsData.map((stat, i) => (
// //               <div
// //                 key={i}
// //                 className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-5 hover:bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-default"
// //               >
// //                 <div className="flex items-center gap-3 mb-1">
// //                   <div className={`${stat.color} transition-transform group-hover:scale-110`}>{stat.icon}</div>
// //                   <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
// //                 </div>
// //                 <p className="text-sm text-gray-600">{stat.label}</p>
// //               </div>
// //             ))}
// //           </div>

// //           {/* Trust Badge */}
// //           <div className="flex items-center gap-2 text-sm text-gray-600">
// //             <CheckCircle className="w-4 h-4 text-emerald-600" />
// //             <span>Secure & Private</span>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Right Panel - Login Form */}
// //       <div className="w-full lg:w-[480px] xl:w-[560px] flex flex-col justify-center px-6 md:px-12 py-12 bg-white">
// //         <div className="max-w-md mx-auto w-full">
// //           {/* Form Header */}
// //           <div className="mb-10">
// //             <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Sign In</h3>
// //             <p className="text-base text-gray-600">Enter your credentials to access your account</p>
// //           </div>

// //           {/* Login Form */}
// //           <form onSubmit={handleLogin} className="space-y-6">
// //             <div className="w-full m-1 mx-auto">
// //              <GoogleLogin
// //              size="large"
// //              width="100%"
// //               onSuccess={async (credentialResponse) => {
// //                     const loadingToast = toastUtils.loading(toastMessages.loggingIn)
// //                 const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/google-oauth`, {
// //                   method: "POST",
// //                   headers: { "Content-Type": "application/json" },
// //                   body: JSON.stringify({ token: credentialResponse.credential })
// //                 });
// //                 const data = await res.json();
// //                 console.log(data,'-----------------------');
// //                 if(data?.user?.email?.includes("@flashfirehq")){
// //                   setName(data.user.name)
// //                   setEmailOperations(data.user.email)
// //                   setRole(data.user.role)
// //                   setManagedUsers(data.user.managedUsers)
// //                   toastUtils.dismissToast(loadingToast)
// //                   toastUtils.success("Welcome to Operations Dashboard!")
// //                   navigate("/manage")

// //                 }
// //                 else{
// //                   setData({
// //                     userDetails: data?.userDetails,
// //                     token: data?.token,
// //                     userProfile : data?.userProfile
// //                   })
// //                   setProfileFromApi(data?.userProfile);
// //                   localStorage.setItem(
// //                     "userAuth",
// //                     JSON.stringify({
// //                       token: data?.token,
// //                       userDetails: data?.userDetails,
// //                       userProfile: data?.userProfile,
// //                     }),
// //                   )
// //                   toastUtils.dismissToast(loadingToast)
// //                   toastUtils.success(toastMessages.loginSuccess)
// //                   navigate("/")
                
// //                 // console.log(data)
// //                 // if (data.token) {
// //                 //   setData({ userDetails: data.userDetails, token: data.token, });
// //                 //   localStorage.setItem("userAuth",JSON.stringify({token : data?.token,userDetails : data?.userDetails}));

// //                   navigate('/');
// //                 // } else {
// //                 //   setResponse({ message: data.message || 'Login failed' });
// //                 }
// //   }}
// //   onError={() => console.log("Login Failed")}
// //   useOneTap
// // />
// //             </div>
// //             {/* Email Field */}
// //             <div>
// //               <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
// //                 Email Address
// //               </label>
// //               <div className="relative group">
// //                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors w-5 h-5" />
// //                 <input
// //                   type="email"
// //                   id="email"
// //                   value={email}
// //                   onChange={(e) => setEmail(e.target.value)}
// //                   className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border ${
// //                     errors.email ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-orange-500"
// //                   } rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all`}
// //                   placeholder="you@example.com"
// //                 />
// //               </div>
// //               {errors.email && (
// //                 <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
// //                   <span className="w-1 h-1 bg-red-600 rounded-full"></span>
// //                   {errors.email}
// //                 </p>
// //               )}
// //             </div>

// //             {/* Password Field */}
// //             <div>
// //               <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
// //                 Password
// //               </label>
// //               <div className="relative group">
// //                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors w-5 h-5" />
// //                 <input
// //                   type={showPassword ? "text" : "password"}
// //                   id="password"
// //                   value={password}
// //                   onChange={(e) => setPassword(e.target.value)}
// //                   className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border ${
// //                     errors.password ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-orange-500"
// //                   } rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all`}
// //                   placeholder="Enter your password"
// //                 />
// //                 <button
// //                   type="button"
// //                   onClick={() => setShowPassword(!showPassword)}
// //                   className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
// //                 >
// //                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
// //                 </button>
// //               </div>
// //               {errors.password && (
// //                 <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
// //                   <span className="w-1 h-1 bg-red-600 rounded-full"></span>
// //                   {errors.password}
// //                 </p>
// //               )}
// //             </div>

// //             {/* Submit Button */}
// //             <button
// //               type="submit"
// //               disabled={isLoading}
// //               className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed group"
// //             >
// //               {isLoading ? (
// //                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
// //               ) : (
// //                 <>
// //                   <span>Sign In</span>
// //                   <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
// //                 </>
// //               )}
// //             </button>

// //             {/* Response Message */}
// //             {response?.message && (
// //               <div
// //                 className={`p-4 rounded-lg border ${
// //                   response?.message === "Login Success..!" || response?.message === "Login successful"
// //                     ? "bg-emerald-50 border-emerald-300 text-emerald-700"
// //                     : "bg-red-50 border-red-300 text-red-700"
// //                 } text-sm font-medium`}
// //               >
// //                 {response?.message}
// //               </div>
// //             )}
// //           </form>

// //           {/* Footer */}
// //           <div className="mt-8 pt-6 border-t border-gray-200">
// //             <p className="text-center text-sm text-gray-500">Protected by security</p>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }


// import { useState, useContext, type FormEvent } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Eye,
//   EyeOff,
//   Mail,
//   Lock,
//   ArrowRight,
//   CheckCircle,
//   TrendingUp,
//   Users,
//   Award,
//   Clock,
// } from "lucide-react";
// import { UserContext } from "../state_management/UserContext";
// import { useUserProfile } from "../state_management/ProfileContext";
// import { useOperationsStore } from "../state_management/Operations";
// import { toastUtils, toastMessages } from "../utils/toast";
// import { GoogleLogin } from "@react-oauth/google";

// interface LoginResponse {
//   message: string;
//   token?: string;
//   userDetails?: any;
//   userProfile?: any;
//   user?: any;
// }

// const statsData = [
//   {
//     value: "95%",
//     label: "Success Rate",
//     icon: <TrendingUp className="w-5 h-5" />,
//     color: "text-emerald-600",
//   },
//   {
//     value: "100K+",
//     label: "Applications Sent",
//     icon: <Users className="w-5 h-5" />,
//     color: "text-blue-600",
//   },
//   {
//     value: "97%",
//     label: "ATS Score",
//     icon: <Award className="w-5 h-5" />,
//     color: "text-orange-600",
//   },
//   {
//     value: "24/7",
//     label: "AI Working",
//     icon: <Clock className="w-5 h-5" />,
//     color: "text-purple-600",
//   },
// ];

// export default function Login() {
//   const [email, setEmail] = useState<string>("");
//   const [password, setPassword] = useState<string>("");
//   const [showPassword, setShowPassword] = useState<boolean>(false);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
//   const [response, setResponse] = useState<LoginResponse | null>(null);

//   const navigate = useNavigate();
//   const { setName, setEmailOperations, setRole, setManagedUsers } = useOperationsStore();
//   const { setData } = useContext(UserContext);
//   const { setProfileFromApi } = useUserProfile();

//   const validate = () => {
//     const errs: { email?: string; password?: string } = {};
//     if (!email) errs.email = "Email is required";
//     if (!password) errs.password = "Password is required";
//     return errs;
//   };

//   const handleLogin = async (e: FormEvent) => {
//     e.preventDefault();
//     const errs = validate();
//     setErrors(errs);
//     if (Object.keys(errs).length > 0) {
//       toastUtils.error(toastMessages.validationError);
//       return;
//     }

//     setIsLoading(true);
//     const loadingToast = toastUtils.loading(toastMessages.loggingIn);

//     try {
//       const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//       const loginEndpoint = email.toLowerCase().includes("@flashfirehq")
//         ? "/operations/login"
//         : "/login";

//       const res = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password }),
//       });

//       const data: LoginResponse = await res.json();
//       setResponse(data);

//       if (loginEndpoint === "/operations/login") {
//         if (data?.message === "Login successful") {
//           setName(data.user.name);
//           setEmailOperations(data.user.email);
//           setRole(data.user.role);
//           setManagedUsers(data.user.managedUsers);
//           toastUtils.dismissToast(loadingToast);
//           toastUtils.success("Welcome to Operations Dashboard!");
//           navigate("/manage");
//         } else {
//           toastUtils.dismissToast(loadingToast);
//           toastUtils.error(data?.message || toastMessages.loginError);
//         }
//       } else {
//         if (data?.message === "Login Success..!") {
//           setData({
//             userDetails: data?.userDetails,
//             token: data?.token,
//             userProfile: data?.userProfile,
//           });
//           setProfileFromApi(data?.userProfile);
//           localStorage.setItem(
//             "userAuth",
//             JSON.stringify({
//               token: data?.token,
//               userDetails: data?.userDetails,
//               userProfile: data?.userProfile,
//             })
//           );
//           toastUtils.dismissToast(loadingToast);
//           toastUtils.success(toastMessages.loginSuccess);
//           navigate("/");
//         } else {
//           setData({});
//           toastUtils.dismissToast(loadingToast);
//           toastUtils.error(data?.message || toastMessages.loginError);
//         }
//       }
//     } catch (err) {
//       console.error(err);
//       toastUtils.dismissToast(loadingToast);
//       toastUtils.error(toastMessages.networkError);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-white to-red-50">
//       {/* Left Section */}
//       <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 lg:py-16 relative border-b lg:border-b-0 lg:border-r border-gray-200">
//         <div className="absolute inset-0 overflow-hidden">
//           <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"></div>
//           <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-200/30 rounded-full blur-3xl"></div>
//         </div>

//         <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
//           <div className="flex items-center gap-3 mb-2">
//             <img src="/Logo.png" alt="Flashfire Logo" className="w-10 h-10 md:w-12 md:h-12" />
//             <div>
//               <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent">
//                 FLASHFIRE
//               </h1>
//               <p className="text-xs text-gray-600">AI-Powered Resume Optimization</p>
//             </div>
//           </div>

//           <div className="mb-4">
//             <p className="text-sm font-medium text-orange-600 mb-1 tracking-wide uppercase">
//               Welcome Back
//             </p>
//             <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-3">
//               Transform Your{" "}
//               <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
//                 Career Journey
//               </span>
//             </h2>
//             <p className="text-lg text-gray-700 leading-relaxed">
//               Join professionals who landed dream jobs with AI-optimized resumes that beat ATS.
//             </p>
//           </div>

//           <div className="grid grid-cols-2 gap-4 mb-8">
//             {statsData.map((stat, i) => (
//               <div
//                 key={i}
//                 className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-5 hover:bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-default"
//               >
//                 <div className="flex items-center gap-3 mb-1">
//                   <div className={`${stat.color} transition-transform group-hover:scale-110`}>
//                     {stat.icon}
//                   </div>
//                   <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
//                 </div>
//                 <p className="text-sm text-gray-600">{stat.label}</p>
//               </div>
//             ))}
//           </div>

//           <div className="flex items-center gap-2 text-sm text-gray-600">
//             <CheckCircle className="w-4 h-4 text-emerald-600" />
//             <span>Secure & Private</span>
//           </div>
//         </div>
//       </div>

//       {/* Right Section - Login Only */}
//       <div className="w-full lg:w-[480px] xl:w-[560px] flex flex-col justify-center px-6 md:px-12 py-12 bg-white">
//         <div className="max-w-md mx-auto w-full">
//           <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Sign In</h3>
//           <p className="text-base text-gray-600 mb-10">
//             Enter your credentials to access your account
//           </p>

//           <form onSubmit={handleLogin} className="space-y-6">
//             <div className="w-full">
//               <GoogleLogin
//                 size="large"
//                 width="100%"
//                 onSuccess={async (credentialResponse) => {
//                   const loadingToast = toastUtils.loading(toastMessages.loggingIn);
//                   const res = await fetch(
//                     `${import.meta.env.VITE_API_BASE_URL}/google-oauth`,
//                     {
//                       method: "POST",
//                       headers: { "Content-Type": "application/json" },
//                       body: JSON.stringify({ token: credentialResponse.credential }),
//                     }
//                   );
//                   const data = await res.json();
//                   if(data?.message == 'User not found'){
//                     toastUtils.error(data?.message);
//                     toastUtils.dismissToast(loadingToast);
//                     return;
//                   }

//                   if (data?.user?.email?.includes("@flashfirehq")) {
//                     setName(data.user.name);
//                     setEmailOperations(data.user.email);
//                     setRole(data.user.role);
//                     setManagedUsers(data.user.managedUsers);
//                     toastUtils.dismissToast(loadingToast);
//                     toastUtils.success("Welcome to Operations Dashboard!");
//                     navigate("/manage");
//                   } else {
//                     setData({
//                       userDetails: data?.userDetails,
//                       token: data?.token,
//                       userProfile: data?.userProfile,
//                     });
//                     setProfileFromApi(data?.userProfile);
//                     localStorage.setItem(
//                       "userAuth",
//                       JSON.stringify({
//                         token: data?.token,
//                         userDetails: data?.userDetails,
//                         userProfile: data?.userProfile,
//                       })
//                     );
//                     toastUtils.dismissToast(loadingToast);
//                     toastUtils.success(toastMessages.loginSuccess);
//                     navigate("/");
//                   }
//                 }}
//                 onError={() => console.log("Login Failed")}
//                 useOneTap
//               />
//             </div>

//             <div className="relative group">
//               <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
//                 placeholder="you@example.com"
//               />
//             </div>

//             <div className="relative group">
//               <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type={showPassword ? "text" : "password"}
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
//                 placeholder="Enter your password"
//               />
//               <button
//                 type="button"
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
//               >
//                 {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50"
//             >
//               {isLoading ? (
//                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//               ) : (
//                 <>
//                   <h1>Sign In</h1>
//                   <ArrowRight className="w-5 h-5" />
//                 </>
//               )}
//             </button>

//             {response?.message && (
//               <div
//                 className={`p-4 rounded-lg border ${
//                   response?.message === "Login Success..!" ||
//                   response?.message === "Login successful"
//                     ? "bg-emerald-50 border-emerald-300 text-emerald-700"
//                     : "bg-red-50 border-red-300 text-red-700"
//                 } text-sm font-medium`}
//               >
//                 {response?.message}
//               </div>
//             )}
//           </form>

//           <div className="mt-8 pt-6 border-t border-gray-200">
//             <p className="text-center text-sm text-gray-500">Protected by security</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState, useContext, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, CheckCircle, TrendingUp, Users, Award, Clock } from "lucide-react";
import { UserContext } from "../state_management/UserContext";
import { useUserProfile } from "../state_management/ProfileContext";
import { useOperationsStore } from "../state_management/Operations";
import { toastUtils, toastMessages } from "../utils/toast";
import { GoogleLogin } from "@react-oauth/google";

interface LoginResponse {
  message: string;
  token?: string;
  userDetails?: any;
  userProfile?: any;
  user?: any;
}

const statsData = [
<<<<<<< HEAD
  {
    value: "95%",
    label: "Success Rate",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "text-emerald-600",
  },
  {
    value: "300K+",
    label: "Applications Sent",
    icon: <Users className="w-5 h-5" />,
    color: "text-blue-600",
  },
  {
    value: "97%",
    label: "ATS Score",
    icon: <Award className="w-5 h-5" />,
    color: "text-orange-600",
  },
  {
    value: "24/7",
    label: "AI Working",
    icon: <Clock className="w-5 h-5" />,
    color: "text-purple-600",
  },
]

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<LoginResponse | null>(null);

  const navigate = useNavigate();
  const { setName, setEmailOperations, setRole, setManagedUsers } = useOperationsStore();
  const { setData } = useContext(UserContext);
  const { setProfileFromApi } = useUserProfile();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastUtils.error("Email and Password are required!");
      return;
    }

    setIsLoading(true);
    const loadingToast = toastUtils.loading(toastMessages.loggingIn);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const loginEndpoint = email.toLowerCase().includes("@flashfirehq") ? "/operations/login" : "/login";
      const res = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: LoginResponse = await res.json();
      setResponse(data);

      if (loginEndpoint === "/operations/login") {
        if (data?.message === "Login successful") {
          setName(data.user.name);
          setEmailOperations(data.user.email);
          setRole(data.user.role);
          setManagedUsers(data.user.managedUsers);
          toastUtils.dismissToast(loadingToast);
          toastUtils.success("Welcome to Operations Dashboard!");
          navigate("/manage");
        } else {
          toastUtils.dismissToast(loadingToast);
          toastUtils.error(data?.message || toastMessages.loginError);
        }
      } else {
        if (data?.message === "Login Success..!") {
          setData({
            userDetails: data?.userDetails,
            token: data?.token,
            userProfile: data?.userProfile,
          });
          setProfileFromApi(data?.userProfile);
          localStorage.setItem(
            "userAuth",
            JSON.stringify({
              token: data?.token,
              userDetails: data?.userDetails,
              userProfile: data?.userProfile,
            })
          );
          toastUtils.dismissToast(loadingToast);
          toastUtils.success(toastMessages.loginSuccess);
          navigate("/");
        } else {
          setData({});
          toastUtils.dismissToast(loadingToast);
          toastUtils.error(data?.message || toastMessages.loginError);
        }
      }
    } catch (err) {
      console.error(err);
      toastUtils.dismissToast(loadingToast);
      toastUtils.error(toastMessages.networkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* LEFT PANEL (unchanged) */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12 lg:py-16 relative border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-red-200/30 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-xl mx-auto lg:mx-0">
          <div className="flex items-center gap-3 mb-2">
            <img src="/Logo.png" alt="Flashfire Logo" className="w-10 h-10 md:w-12 md:h-12" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent">
                FLASHFIRE
              </h1>
              <p className="text-xs text-gray-600">AI-Powered Resume Optimization</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-orange-600 mb-1 tracking-wide uppercase">Welcome Back</p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-3">
              Transform Your{" "}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Career Journey
              </span>
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Join professionals who landed dream jobs with AI-optimized resumes that beat ATS.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {statsData.map((stat, i) => (
              <div
                key={i}
                className="group bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-5 hover:bg-white hover:border-orange-300 hover:shadow-lg transition-all duration-300 cursor-default"
              >
                <div className="flex items-center gap-3 mb-1">
                  <div className={`${stat.color} transition-transform group-hover:scale-110`}>
                    {stat.icon}
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Secure & Private</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Clean Card UI */}
      <div className="w-full lg:w-[480px] xl:w-[560px] flex flex-col justify-center items-center px-6 md:px-10 py-10 bg-white">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-md p-8">
          {/* Header */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Job Seeker Portal</h2>

          {/* Tabs */}
          <div className="flex justify-center mb-6 border-b border-gray-200">
            <button className="px-4 py-2 text-blue-600 font-semibold border-b-2 border-blue-600">
              Login
            </button>
            {/* <button className="px-4 py-2 text-gray-400">Sign Up</button> */}
          </div>

          {/* Google Button */}
          <div className="mb-5">
            <GoogleLogin
              size="large"
              width="100%"
              onSuccess={async (credentialResponse) => {
                const loadingToast = toastUtils.loading(toastMessages.loggingIn);
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/google-oauth`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token: credentialResponse.credential }),
                });
                const data = await res.json();
                if (data?.message === "User not found") {
                  toastUtils.error(data?.message);
                  toastUtils.dismissToast(loadingToast);
                  return;
                }

                if (data?.user?.email?.includes("@flashfirehq")) {
                  setName(data.user.name);
                  setEmailOperations(data.user.email);
                  setRole(data.user.role);
                  setManagedUsers(data.user.managedUsers);
                  toastUtils.dismissToast(loadingToast);
                  toastUtils.success("Welcome to Operations Dashboard!");
                  navigate("/manage");
                } else {
                  setData({
                    userDetails: data?.userDetails,
                    token: data?.token,
                    userProfile: data?.userProfile,
                  });
                  setProfileFromApi(data?.userProfile);
                  localStorage.setItem(
                    "userAuth",
                    JSON.stringify({
                      token: data?.token,
                      userDetails: data?.userDetails,
                      userProfile: data?.userProfile,
                    })
                  );
                  toastUtils.dismissToast(loadingToast);
                  toastUtils.success(toastMessages.loginSuccess);
                  navigate("/");
                }
              }}
              onError={() => console.log("Login Failed")}
              useOneTap
            />
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center mb-4">
            <hr className="w-1/3 border-gray-300" />
            <span className="mx-3 text-gray-400 text-sm">OR</span>
            <hr className="w-1/3 border-gray-300" />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          {/* <div className="text-right mb-4">
            <button className="text-sm text-blue-600 hover:underline">Forgot password?</button>
          </div> */}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md transition"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {/* Footer Link */}
          <p className="text-center text-sm text-blue-600 mt-6 cursor-pointer hover:underline">
            Looking for the Coach Portal?
          </p>
        </div>
      </div>
    </div>
  );
}

