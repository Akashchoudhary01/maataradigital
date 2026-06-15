import { useRef, useState } from 'react';
import { Upload, X, Eye, FileImage } from 'lucide-react';

export default function FileUpload({ label, name, register, currentUrl, onChange, error }) {
  const [preview, setPreview] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const inputRef = useRef();

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
      if (onChange) onChange(file);
    }
  };

  const displayUrl = preview || currentUrl;
  const isImage = displayUrl && !displayUrl.endsWith('.pdf');

  return (
    <div>
      <label className="label">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition-colors hover:border-primary-400 hover:bg-primary-50 ${
          error ? 'border-danger-400' : 'border-gray-300'
        } ${displayUrl ? 'bg-gray-50' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleChange}
        />

        {displayUrl ? (
          <div className="flex items-center gap-3">
            {isImage ? (
              <img src={displayUrl} alt={label} className="w-14 h-14 object-cover rounded-lg border border-gray-200" />
            ) : (
              <div className="w-14 h-14 bg-primary-50 rounded-lg flex items-center justify-center">
                <FileImage className="text-primary-500" size={24} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">
                {preview ? 'New file selected' : 'Uploaded document'}
              </p>
              <p className="text-xs text-gray-400">Click to replace</p>
            </div>
            {isImage && currentUrl && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setViewOpen(true); }}
                className="p-1.5 text-primary-600 hover:bg-primary-100 rounded"
              >
                <Eye size={16} />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <Upload className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-sm text-gray-500">Click to upload</p>
            <p className="text-xs text-gray-400 mt-0.5">JPG, PNG or PDF · Max 5MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-danger-600 text-xs mt-1">{error}</p>}

      {/* Image lightbox */}
      {viewOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setViewOpen(false)}
        >
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setViewOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X size={24} />
            </button>
            <img src={displayUrl} alt={label} className="w-full rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
}
