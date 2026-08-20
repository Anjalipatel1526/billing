import React, { useState, useId } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

export const LogoUploader = ({ value, onChange, label = 'Company Logo' }) => {
  const [dragOver, setDragOver] = useState(false);
  const generatedId = useId();
  const uploaderId = `logo_upload_${label.toLowerCase().replace(/\s+/g, '_')}_${generatedId.replace(/:/g, '')}`;

  const processFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize image if width/height > 400px to optimize storage size
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL(file.type === 'image/svg+xml' ? 'image/svg+xml' : 'image/png', 0.85);
        onChange(compressedBase64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}

      {value ? (
        <div className="relative border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
              <img src={value} alt="Uploaded logo" className="max-h-full max-w-full object-contain" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-800">Logo Uploaded</p>
              <p className="text-[10px] text-slate-500">Ready for documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor={uploaderId} className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
              Replace
              <input
                id={uploaderId}
                name={uploaderId}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
            dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <label htmlFor={uploaderId} className="cursor-pointer block">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-500">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-800">
              <span className="text-blue-600">Click to upload</span> or drag and drop logo
            </p>
            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP or SVG (Max 400x400 output)</p>
            <input
              id={uploaderId}
              name={uploaderId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
};
