import React, { useState } from 'react';
import { Lock } from 'lucide-react';
interface LoginProps {
  onLogin: () => void;
}
export const Login: React.FC<LoginProps> = ({
  onLogin
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Vantage123') {
      onLogin();
    } else {
      setError(true);
      setPassword('');
    }
  };
  return <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-[#0072CE] text-white font-bold w-16 h-16 flex items-center justify-center rounded-xl mb-4">
            L
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Lenovo Vantage
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter password to continue
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input id="password" type="password" value={password} onChange={e => {
              setPassword(e.target.value);
              setError(false);
            }} className={`w-full pl-10 pr-4 py-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all`} placeholder="Enter password" autoFocus />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">
                Incorrect password. Please try again.
              </p>}
          </div>
          <button type="submit" className="w-full bg-[#0072CE] text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Sign In
          </button>
        </form>
      </div>
    </div>;
};