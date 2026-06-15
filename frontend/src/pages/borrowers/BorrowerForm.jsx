import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Upload, X, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh',
];

function FileUploadField({ label, name, preview, onFileChange, onRemove, accept = 'image/*' }) {
  return (
    <div>
      <label className="label">{label}</label>
      {preview ? (
        <div className="relative inline-block">
          <img src={preview} alt={label} className="w-32 h-24 object-cover rounded-lg border border-gray-200" />
          <button type="button" onClick={onRemove}
            className="absolute -top-2 -right-2 w-5 h-5 bg-danger-600 text-white rounded-full flex items-center justify-center hover:bg-danger-700">
            <X size={11} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
          <Upload size={20} className="text-gray-400 mb-1" />
          <span className="text-xs text-gray-500">Click to upload</span>
          <input type="file" className="hidden" accept={accept} onChange={onFileChange} />
        </label>
      )}
    </div>
  );
}

export default function BorrowerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [files, setFiles] = useState({ photo: null, aadhaarFrontImage: null, aadhaarBackImage: null, panCardImage: null });
  const [previews, setPreviews] = useState({ photo: null, aadhaarFrontImage: null, aadhaarBackImage: null, panCardImage: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (isEdit) fetchBorrower();
  }, [id]);

  const fetchBorrower = async () => {
    try {
      const { data } = await api.get(`/borrowers/${id}`);
      const b = data.data;
      reset({
        fullName: b.fullName, fatherName: b.fatherName, mobileNumber: b.mobileNumber,
        alternateNumber: b.alternateNumber, email: b.email, gender: b.gender,
        dateOfBirth: b.dateOfBirth ? b.dateOfBirth.split('T')[0] : '',
        occupation: b.occupation, monthlyIncome: b.monthlyIncome,
        aadhaarNumber: b.aadhaarNumber, panNumber: b.panNumber,
        'address.village': b.address?.village, 'address.city': b.address?.city,
        'address.district': b.address?.district, 'address.state': b.address?.state,
        'address.pincode': b.address?.pincode,
      });
      setPreviews({
        photo: b.photo || null, aadhaarFrontImage: b.aadhaarFrontImage || null,
        aadhaarBackImage: b.aadhaarBackImage || null, panCardImage: b.panCardImage || null,
      });
    } catch { toast.error('Failed to load borrower'); navigate('/borrowers'); }
    finally { setFetching(false); }
  };

  const handleFileChange = (fieldName) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setPreviews((prev) => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
  };

  const handleRemoveFile = (fieldName) => () => {
    setFiles((prev) => ({ ...prev, [fieldName]: null }));
    setPreviews((prev) => ({ ...prev, [fieldName]: null }));
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      const fd = new FormData();
      // Flatten address
      const address = {
        village: formData['address.village'], city: formData['address.city'],
        district: formData['address.district'], state: formData['address.state'],
        pincode: formData['address.pincode'],
      };
      // Append all text fields
      Object.entries(formData).forEach(([key, val]) => {
        if (!key.startsWith('address.') && val !== undefined && val !== '') fd.append(key, val);
      });
      fd.append('address', JSON.stringify(address));
      // Append files
      Object.entries(files).forEach(([key, file]) => { if (file) fd.append(key, file); });

      if (isEdit) {
        await api.put(`/borrowers/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Borrower updated successfully');
      } else {
        await api.post('/borrowers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Borrower created successfully');
      }
      navigate('/borrowers');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save borrower');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/borrowers')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Borrower' : 'Add New Borrower'}</h1>
          <p className="text-gray-500 text-sm">{isEdit ? 'Update borrower information' : 'Fill in the details to create a new borrower'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <div className="card space-y-4">
          <h3 className="section-title border-b border-gray-100 pb-3">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input {...register('fullName', { required: 'Full name is required' })} className={`input ${errors.fullName ? 'input-error' : ''}`} placeholder="Enter full name" />
              {errors.fullName && <p className="text-danger-600 text-xs mt-1">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="label">Father's Name</label>
              <input {...register('fatherName')} className="input" placeholder="Father's name" />
            </div>
            <div>
              <label className="label">Mobile Number *</label>
              <input {...register('mobileNumber', { required: 'Mobile is required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid mobile number' } })} className={`input ${errors.mobileNumber ? 'input-error' : ''}`} placeholder="10-digit mobile" />
              {errors.mobileNumber && <p className="text-danger-600 text-xs mt-1">{errors.mobileNumber.message}</p>}
            </div>
            <div>
              <label className="label">Alternate Number</label>
              <input {...register('alternateNumber')} className="input" placeholder="Alternate mobile" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...register('email', { pattern: { value: /\S+@\S+\.\S+/, message: 'Invalid email' } })} className={`input ${errors.email ? 'input-error' : ''}`} placeholder="email@example.com" type="email" />
              {errors.email && <p className="text-danger-600 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Gender</label>
              <select {...register('gender')} className="input">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input {...register('dateOfBirth')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Occupation</label>
              <input {...register('occupation')} className="input" placeholder="e.g. Farmer, Shopkeeper" />
            </div>
            <div>
              <label className="label">Monthly Income (₹)</label>
              <input {...register('monthlyIncome', { valueAsNumber: true })} type="number" className="input" placeholder="e.g. 15000" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card space-y-4">
          <h3 className="section-title border-b border-gray-100 pb-3">Address Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Village / Area</label>
              <input {...register('address.village')} className="input" placeholder="Village or area name" />
            </div>
            <div>
              <label className="label">City / Town</label>
              <input {...register('address.city')} className="input" placeholder="City or town" />
            </div>
            <div>
              <label className="label">District</label>
              <input {...register('address.district')} className="input" placeholder="District" />
            </div>
            <div>
              <label className="label">State</label>
              <select {...register('address.state')} className="input">
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pincode</label>
              <input {...register('address.pincode', { pattern: { value: /^\d{6}$/, message: 'Invalid pincode' } })} className={`input ${errors['address.pincode'] ? 'input-error' : ''}`} placeholder="6-digit pincode" />
              {errors['address.pincode'] && <p className="text-danger-600 text-xs mt-1">{errors['address.pincode'].message}</p>}
            </div>
          </div>
        </div>

        {/* ID Documents */}
        <div className="card space-y-4">
          <h3 className="section-title border-b border-gray-100 pb-3">Identity Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Aadhaar Number</label>
              <input {...register('aadhaarNumber', { pattern: { value: /^\d{12}$/, message: '12-digit Aadhaar required' } })} className={`input ${errors.aadhaarNumber ? 'input-error' : ''}`} placeholder="12-digit Aadhaar" maxLength={12} />
              {errors.aadhaarNumber && <p className="text-danger-600 text-xs mt-1">{errors.aadhaarNumber.message}</p>}
            </div>
            <div>
              <label className="label">PAN Number</label>
              <input {...register('panNumber', { pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Invalid PAN format (e.g. ABCDE1234F)' } })} className={`input ${errors.panNumber ? 'input-error' : ''}`} placeholder="e.g. ABCDE1234F" style={{ textTransform: 'uppercase' }} />
              {errors.panNumber && <p className="text-danger-600 text-xs mt-1">{errors.panNumber.message}</p>}
            </div>
          </div>
        </div>

        {/* Photo & Documents Upload */}
        <div className="card space-y-4">
          <h3 className="section-title border-b border-gray-100 pb-3">Photos & Documents</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FileUploadField label="Borrower Photo" name="photo" preview={previews.photo} onFileChange={handleFileChange('photo')} onRemove={handleRemoveFile('photo')} />
            <FileUploadField label="Aadhaar Front" name="aadhaarFrontImage" preview={previews.aadhaarFrontImage} onFileChange={handleFileChange('aadhaarFrontImage')} onRemove={handleRemoveFile('aadhaarFrontImage')} />
            <FileUploadField label="Aadhaar Back" name="aadhaarBackImage" preview={previews.aadhaarBackImage} onFileChange={handleFileChange('aadhaarBackImage')} onRemove={handleRemoveFile('aadhaarBackImage')} />
            <FileUploadField label="PAN Card" name="panCardImage" preview={previews.panCardImage} onFileChange={handleFileChange('panCardImage')} onRemove={handleRemoveFile('panCardImage')} />
          </div>
          <p className="text-xs text-gray-400">Supported formats: JPG, PNG, PDF. Max size: 5MB each.</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/borrowers')} className="btn-outline">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary px-6">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
            {isEdit ? 'Save Changes' : 'Create Borrower'}
          </button>
        </div>
      </form>
    </div>
  );
}
