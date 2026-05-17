'use client';

import { cn } from '@/lib/utils';
import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Image, X, AlertCircle, CheckCircle } from 'lucide-react';

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface FileUploadProps {
  value?: UploadFile[];
  onChange?: (files: UploadFile[]) => void;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  label?: string;
  helperText?: string;
  className?: string;
  disabled?: boolean;
}

const defaultAccept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const defaultMaxSizeMB = 5;

const fileTypeIcons: Record<string, React.ReactNode> = {
  'application/pdf': <FileText className="w-5 h-5 text-red-500" />,
  'image/jpeg': <Image className="w-5 h-5 text-blue-500" />,
  'image/jpg': <Image className="w-5 h-5 text-blue-500" />,
  'image/png': <Image className="w-5 h-5 text-blue-500" />,
  'application/msword': <FileText className="w-5 h-5 text-blue-700" />,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <FileText className="w-5 h-5 text-blue-700" />,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function FileUpload({
  value = [],
  onChange,
  accept = defaultAccept,
  maxSizeMB = defaultMaxSizeMB,
  maxFiles = 5,
  label,
  helperText,
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSizeBytes) {
        return `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`;
      }

      // Check file type
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
      const fileExtension = '.' + getFileExtension(file.name);
      const fileType = file.type.toLowerCase();

      const isAccepted =
        acceptedTypes.some(
          (type) =>
            type === fileType ||
            type === fileExtension ||
            (type.includes('/*') && fileType.startsWith(type.replace('/*', '/')))
        );

      if (!isAccepted) {
        return `File type "${fileExtension}" is not accepted`;
      }

      return null;
    },
    [accept, maxSizeBytes, maxSizeMB]
  );

  const simulateUpload = useCallback(
    (fileId: string) => {
      const interval = setInterval(() => {
        const files = value.map((f) => {
          if (f.id === fileId && f.status === 'uploading') {
            const newProgress = Math.min(f.progress + Math.random() * 30, 100);
            const newStatus: 'completed' | 'uploading' = newProgress >= 100 ? 'completed' : 'uploading';
            return {
              ...f,
              progress: newProgress,
              status: newStatus,
            };
          }
          return f;
        });
        onChange?.(files);

        // Check if all uploads are done
        const allDone = files.every((f) => f.status === 'completed' || f.status === 'error');
        if (allDone) {
          clearInterval(interval);
        }
      }, 200);

      return () => clearInterval(interval);
    },
    [value, onChange]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const newFiles: UploadFile[] = [];

      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - value.length;

      if (fileArray.length > remainingSlots) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          continue;
        }

        const uploadFile: UploadFile = {
          id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          progress: 0,
          status: 'uploading',
        };
        newFiles.push(uploadFile);
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...value, ...newFiles];
        onChange?.(updatedFiles);

        // Start upload simulation for each new file
        newFiles.forEach((f) => simulateUpload(f.id));
      }
    },
    [value, maxFiles, validateFile, onChange, simulateUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const handleRemove = useCallback(
    (id: string) => {
      const filtered = value.filter((f) => f.id !== id);
      onChange?.(filtered);
      setError(null);
    },
    [value, onChange]
  );

  const handleRetry = useCallback(
    (id: string) => {
      const files = value.map((f) =>
        f.id === id ? { ...f, progress: 0, status: 'uploading' as const, error: undefined } : f
      );
      onChange?.(files);
      simulateUpload(id);
    },
    [value, onChange, simulateUpload]
  );

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          isDragOver
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <Upload
          className={cn(
            'w-10 h-10 mx-auto mb-3',
            isDragOver ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
          )}
        />
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Drag & drop files here, or{' '}
          <span className="text-[var(--color-accent)]">click to browse</span>
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          {accept.split(',').map((t) => t.trim().replace('.', '').toUpperCase()).join(', ')} up
          to {maxSizeMB}MB each ({maxFiles} files max)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-danger)]">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-[var(--color-text-muted)]">{helperText}</p>
      )}

      {/* File List */}
      {value.length > 0 && (
        <div className="flex flex-col gap-2">
          {value.map((uploadFile) => (
            <div
              key={uploadFile.id}
              className="flex items-center gap-3 p-3 bg-[var(--color-bg)] rounded-xl"
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                {fileTypeIcons[uploadFile.file.type] || (
                  <FileText className="w-5 h-5 text-[var(--color-text-muted)]" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {uploadFile.file.name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatFileSize(uploadFile.file.size)}
                  </p>
                  {uploadFile.status === 'completed' && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                      <CheckCircle className="w-3 h-3" /> Uploaded
                    </span>
                  )}
                  {uploadFile.status === 'error' && (
                    <span className="text-xs text-[var(--color-danger)]">{uploadFile.error}</span>
                  )}
                </div>

                {/* Progress Bar */}
                {uploadFile.status === 'uploading' && (
                  <div className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-accent)] transition-all duration-200"
                      style={{ width: `${uploadFile.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {uploadFile.status === 'error' && (
                  <button
                    onClick={() => handleRetry(uploadFile.id)}
                    className="px-2 py-1 text-xs font-medium text-[var(--color-info)] hover:bg-[var(--color-info-bg)] rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                )}
                <button
                  onClick={() => handleRemove(uploadFile.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  aria-label={`Remove ${uploadFile.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
