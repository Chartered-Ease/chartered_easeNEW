import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../hooks/useAppContext';
import { LoaderIcon } from './icons/LoaderIcon';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.43z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.44l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.59A9.99 9.99 0 0 0 12 22z" />
    <path fill="#FBBC05" d="M6.4 13.88a6 6 0 0 1 0-3.76V7.53H3.05a10.01 10.01 0 0 0 0 8.94l3.35-2.59z" />
    <path fill="#EA4335" d="M12 5.99c1.47 0 2.8.51 3.84 1.5l2.86-2.86A9.6 9.6 0 0 0 12 2 9.99 9.99 0 0 0 3.05 7.53l3.35 2.59C7.19 7.75 9.4 5.99 12 5.99z" />
  </svg>
);

interface Props {
  label?: string;
  buttonClassName?: string;
  align?: 'left' | 'right';
}

const CustomerLoginDropdown: React.FC<Props> = ({
  label = 'Customer Login',
  buttonClassName = 'rounded-full bg-ease-blue px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-ease-blue/20 transition duration-300 hover:-translate-y-0.5 hover:bg-ease-electric hover:shadow-ease-electric/30',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { login, loginWithGoogle, isGoogleLoginAvailable } = useAuth();
  const { setPage } = useAppContext();

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickAway);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickAway);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (isOpen && step === 'otp') {
      otpInputRefs.current[0]?.focus();
    }
  }, [isOpen, step]);

  const routeAfterLogin = (clientId?: string) => {
    setIsOpen(false);
    setPage(clientId ? 'user-dashboard' : 'entity-onboarding');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      const signedInUser = await loginWithGoogle();
      routeAfterLogin(signedInUser.clientId);
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

  const handleMobileNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setMobileNumber(value);
      setError('');
    }
  };

  const handleSendOtp = () => {
    if (mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 600);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (Number.isNaN(Number(value))) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    if (value && index < 3) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }

    if (otpValue !== '1234') {
      setError('Invalid OTP. Use 1234 for testing.');
      return;
    }

    setError('');
    setIsLoading(true);
    setTimeout(() => {
      const signedInUser = login(mobileNumber);
      setIsLoading(false);
      routeAfterLogin(signedInUser.clientId);
    }, 500);
  };

  const resetMobileStep = () => {
    setStep('mobile');
    setOtp(['', '', '', '']);
    setError('');
  };

  return (
    <div ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={buttonClassName}
        aria-expanded={isOpen}
      >
        {label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className={`absolute top-full z-[80] mt-3 w-[min(22rem,calc(100vw-2rem))] rounded-[1.4rem] border border-white/80 bg-white/95 p-4 text-slate-900 shadow-2xl shadow-slate-900/15 backdrop-blur-xl ${align === 'right' ? 'right-0' : 'left-0'}`}
          >
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-ease-electric">Customer access</p>
              <h3 className="mt-1 text-xl font-black text-slate-950">Login to Chartered Ease</h3>
              <p className="mt-1 text-sm text-slate-500">Continue with Google or mobile OTP.</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !isGoogleLoginAvailable}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-ease-electric/30 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? <LoaderIcon /> : <GoogleIcon />}
              Continue with Google
            </button>

            {!isGoogleLoginAvailable && (
              <p className="mt-2 rounded-2xl border border-amber-100 bg-amber-50 p-2 text-center text-xs font-bold text-amber-700">
                Google sign-in is unavailable in this environment.
              </p>
            )}

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">or mobile</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {step === 'mobile' ? (
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-wide text-slate-500">Mobile Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-sm font-black text-slate-400">+91</span>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={handleMobileNumberChange}
                    placeholder="00000 00000"
                    className="input py-3 pl-14 text-base font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-2xl bg-ease-blue px-4 py-3 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric disabled:opacity-70"
                >
                  {isLoading ? <LoaderIcon /> : 'Get OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-600">OTP sent to +91 {mobileNumber}</p>
                  <button type="button" onClick={resetMobileStep} className="text-xs font-black text-ease-blue hover:underline">Change</button>
                </div>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => { otpInputRefs.current[index] = element; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleOtpChange(index, event.target.value)}
                      onKeyDown={(event) => handleOtpKeyDown(index, event)}
                      className="h-12 w-12 rounded-2xl border border-slate-200 bg-white text-center text-xl font-black outline-none transition focus:border-ease-electric focus:ring-4 focus:ring-ease-electric/15"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-2xl bg-ease-blue px-4 py-3 text-sm font-black text-white shadow-lg shadow-ease-blue/20 transition hover:-translate-y-0.5 hover:bg-ease-electric disabled:opacity-70"
                >
                  {isLoading ? <LoaderIcon /> : 'Verify & Continue'}
                </button>
                <p className="text-center text-xs font-bold text-slate-400">Testing OTP: 1234</p>
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm font-bold text-red-700">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerLoginDropdown;
