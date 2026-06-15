import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Lock, User, Shield, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../redux/slices/authSlice';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await dispatch(changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }));
    if (changePassword.fulfilled.match(result)) {
      toast.success('Password changed successfully!');
      reset();
    } else {
      toast.error(result.payload || 'Failed to change password');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account settings</p>
      </div>

      {/* Profile info */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <User size={18} className="text-primary-600" />
          <h3 className="section-title">Account Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['Name', user?.name || 'Administrator'],
            ['Email', user?.email],
            ['Role', user?.role],
            ['Account Type', 'Super Admin'],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-500 mb-0.5">{label}</p>
              <p className="text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
          <Lock size={18} className="text-primary-600" />
          <h3 className="section-title">Change Password</h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input {...register('currentPassword', { required: 'Current password required' })}
                type={showCurrent ? 'text' : 'password'}
                className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                placeholder="Enter current password" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-danger-600 text-xs mt-1">{errors.currentPassword.message}</p>}
          </div>

          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input {...register('newPassword', {
                required: 'New password required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
                pattern: { value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: 'Must include uppercase, lowercase, and number' }
              })}
                type={showNew ? 'text' : 'password'}
                className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                placeholder="Min 8 chars, uppercase, lowercase, number" />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-danger-600 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input {...register('confirmPassword', {
              required: 'Please confirm password',
              validate: val => val === newPassword || 'Passwords do not match'
            })}
              type="password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repeat new password" />
            {errors.confirmPassword && <p className="text-danger-600 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock size={15} />}
            Change Password
          </button>
        </form>
      </div>

      {/* Security tips */}
      <div className="card bg-primary-50 border-primary-100">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={16} className="text-primary-600" />
          <h4 className="text-sm font-semibold text-primary-800">Security Tips</h4>
        </div>
        <ul className="text-xs text-primary-700 space-y-1.5 list-disc list-inside">
          <li>Use a strong password with at least 8 characters</li>
          <li>Include uppercase, lowercase, numbers and symbols</li>
          <li>Never share your credentials with anyone</li>
          <li>Log out when using shared devices</li>
          <li>Change your password regularly</li>
        </ul>
      </div>
    </div>
  );
}
