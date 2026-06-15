import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {TrendingUp, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import maatara from '../../Assets/maatara.jpg'
import { login, clearError } from '../../redux/slices/authSlice';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((s) => s.auth);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    dispatch(clearError());
  }, []);

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4 shadow-xl">

            {/* <TrendingUp size={32} className="text-white" /> */}
            <img src={maatara} className='w-32 h-20 rounded-full outline-1' alt="" />
          </div>
          <h1 className="text-3xl font-bold text-white">Maa Tara Digital</h1>
          {/* <p className="text-gray-400 mt-1">Loan Management System</p> */}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' },
                  })}
                  type="email"
                  className={`input pl-9 ${errors.email ? 'input-error' : ''}`}
                  placeholder="admin@loanapp.com"
                />
              </div>
              {errors.email && <p className="text-danger-600 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className={`input pl-9 pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-danger-600 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Secured with JWT Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
