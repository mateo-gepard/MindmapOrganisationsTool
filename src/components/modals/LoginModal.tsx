import { useState } from 'react';

interface LoginModalProps {
  onLogin: (username: string) => void;
}

export default function LoginModal({ onLogin }: LoginModalProps) {
  const [username, setUsername] = useState('Mateo');
  const users = ['Mateo', 'roman', 'george', 'Juan'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#fdf0d5] p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold text-[#780000] mb-6">Welcome to Mindmap</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block text-[#003049] font-semibold mb-2">
              Username
            </label>
            <select
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 border-2 border-[#669bbc] rounded-lg focus:outline-none focus:border-[#003049] bg-white"
            >
              {users.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#c1121f] text-[#fdf0d5] py-3 rounded-lg font-semibold hover:bg-[#780000] transition-colors"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-sm text-[#003049] text-center">
          Default users: Mateo, roman, george, Juan
        </p>
      </div>
    </div>
  );
}
