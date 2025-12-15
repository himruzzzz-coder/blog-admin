'use client';

import { useState, useEffect } from 'react';
import { getAllPosts, deletePost } from '@/lib/github';
import Link from 'next/link';

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setAuthenticated(true);
      loadPosts();
    } else {
      setLoading(false);
    }
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await getAllPosts();
      setPosts(allPosts);
    } catch (err) {
      setError('Failed to load posts');
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    
    if (password === adminPassword) {
      sessionStorage.setItem('admin_auth', 'true');
      setAuthenticated(true);
      setError('');
      loadPosts();
    } else {
      setError('Invalid password');
    }
  };

  const handleDelete = async (slug) => {
    if (!confirm(`Are you sure you want to delete "${slug}"?`)) {
      return;
    }
    try {
      await deletePost(slug);
      setPosts(posts.filter(p => p.slug !== slug));
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setAuthenticated(false);
    setPassword('');
  };

  // --- LOGIN SCREEN ---
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#09090b]">
        <div className="w-full max-w-md bg-[#18181b] border border-white/10 rounded-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Admin Login</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#09090b] border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Password"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-500 hover:text-white">
              ← Back to Blog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#09090b] pb-20">
      <header className="bg-[#18181b] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
          <div className="flex gap-4">
            <Link href="/" className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              View Site
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-500/10 text-red-400 rounded-md hover:bg-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">Posts</h2>
            <Link
              href="/admin/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              + Create New
            </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
            <p className="text-gray-500 mb-4">No posts found.</p>
          </div>
        ) : (
          <div className="bg-[#18181b] border border-white/10 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((post) => (
                  <tr key={post.slug} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{post.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(post.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link href={`/posts/${post.slug}`} className="text-gray-400 hover:text-white mr-4" target="_blank">View</Link>
                      <Link href={`/admin/edit/${post.slug}`} className="text-blue-400 hover:text-blue-300 mr-4">Edit</Link>
                      <button onClick={() => handleDelete(post.slug)} className="text-red-400 hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}