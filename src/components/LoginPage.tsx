
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LoaderIcon } from './icons/LoaderIcon';
import { useAppContext } from '../hooks/useAppContext';
import { CharteredEaseLogo } from './icons/EaseIndiaLogo';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.43z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.59A9.99 9.99 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.4 13.88a6 6 0 0 1 0-3.76V7.53H3.05a10.01 10.01 0 0 0 0 8.94l3.35-2.59z" />
    <path fill="#EA4335" d="M12 5.99c1.47 0 2.8.51 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2 9.99 9.99 0 0 0 3.05 7.53l3.35 2.59C7.19 7.75 9.4 5.99 12 5.99z" />
  </svg>
);

const LoginPage: React.FC = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const { login, loginWithGoogle, isGoogleLoginAvailable } = useAuth();
  const { setPage } = useAppContext();

  // Focus management for OTP
  useEffect(() => {
    if (step === 'otp' && otpInputRefs.current[0]) {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleMobileNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobileNumber(value);
      setError('');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = () => {
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const signedInUser = await loginWithGoogle();
      setPage(signedInUser.clientId ? 'user-dashboard' : 'entity-onboarding');
    } catch (err: any) {
      const errorCode = err?.code || '';
      if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
        setError('Google sign-in was cancelled.');
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    // Hardcoded OTP for demo
    if (otpValue !== '1234') {
      setError('Invalid OTP. Use 1234.');
      return;
    }
    setError('');
    setIsLoading(true);
    
    setTimeout(() => {
      const signedInUser = login(mobileNumber);
      setIsLoading(false);
      setPage(signedInUser.clientId ? 'user-dashboard' : 'entity-onboarding');
    }, 800);
  };

  const handleBackToMobile = () => {
      setStep('mobile');
      setOtp(['', '', '', '']);
      setError('');
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <button
        onClick={() => setPage('home')}
        className="absolute left-4 top-4 text-sm font-semibold text-gray-600 hover:text-ease-blue sm:left-6 sm:top-6"
      >
        &larr; Back to Home
      </button>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
            <CharteredEaseLogo className="h-16 w-16" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'mobile' && 'Continue with Google or use mobile OTP'}
          {step === 'otp' && `Enter the OTP sent to +91 ${mobileNumber}`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-gray-100 relative overflow-hidden">
          
          {/* Progress Bar (Optional) */}
          <div className="absolute top-0 left-0 h-1 bg-gray-100 w-full">
               <div 
                  className="h-full bg-ease-blue transition-all duration-500 ease-out" 
                  style={{ 
                      width: step === 'mobile' ? '50%' : '100%' 
                  }} 
               />
           </div>

          {step === 'mobile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || !isGoogleLoginAvailable}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-semibold text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                >
                  {isGoogleLoading ? <LoaderIcon /> : <GoogleIcon />}
                  Continue with Google
                </button>
                {!isGoogleLoginAvailable && (
                  <p className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-100 rounded-md p-2">
                    Google sign-in is unavailable in this environment.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Mobile Number</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm font-semibold">+91</span>
                  </div>
                  <input
                    type="tel"
                    id="mobile"
                    className="focus:ring-ease-blue focus:border-ease-blue block w-full pl-12 sm:text-lg border-gray-300 rounded-md py-3"
                    placeholder="00000 00000"
                    value={mobileNumber}
                    onChange={handleMobileNumberChange}
                    autoFocus
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue disabled:opacity-70 transition-all"
              >
                {isLoading ? <LoaderIcon /> : 'Get OTP'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-center space-x-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    /* Fix: Ref callback should return void to avoid assignability errors */
                    ref={(el) => { otpInputRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    className="w-14 h-14 text-center text-2xl border-2 border-gray-300 rounded-lg focus:border-ease-blue focus:ring-0 outline-none transition-colors"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  />
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm">
                  <button onClick={handleBackToMobile} className="text-ease-blue hover:text-blue-700 font-medium">Change Number</button>
                  <span className="text-gray-400">Resend in 30s</span>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-ease-blue hover:bg-ease-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ease-blue disabled:opacity-70 transition-all"
              >
                {isLoading ? <LoaderIcon /> : 'Verify & Continue'}
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-4">For testing, use OTP: <span className="font-mono font-bold text-gray-600">1234</span></p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <p className="mt-6 text-center text-xs text-gray-500 max-w-xs mx-auto">
            By continuing, you agree to our <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
