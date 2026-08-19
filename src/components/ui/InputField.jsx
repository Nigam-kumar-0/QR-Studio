import { useId } from 'react';

export default function InputField({ 
  label, 
  error, 
  className = '', 
  ...props 
}) {
  const id = useId();

  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <input
        id={id}
        className={`px-3 py-2 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm ${
          error ? 'border-red-500 text-red-900 placeholder-red-300' : 'border-gray-300 text-gray-900'
        } disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed`}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}