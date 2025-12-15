'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getPost, savePost } from '@/lib/github';
import PostEditor from '@/components/PostEditor';

export default function EditPost() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;
  
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth !== 'true') {
      router.push('/admin');
      return;
    }
    
    setAuthenticated(true);
    loadPost();
  }, [slug, router]);

  const loadPost = async () => {
    try {
      const postData = await getPost(slug);
      if (postData) {
        setPost(postData);
      } else {
        alert('Post not found');
        router.push('/admin');
      }
    } catch (error) {
      alert('Failed to load post');
      router.push('/admin');
    }
    setLoading(false);
  };

  const handleSave = async (postData) => {
    try {
      await savePost(postData.slug, postData.content, {
        title: postData.title,
        author: postData.author,
        date: postData.date,
        excerpt: postData.excerpt,
      });
      
      alert('Post updated successfully!');
      router.push('/admin');
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!authenticated || !post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit Post</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <PostEditor initialData={post} onSave={handleSave} />
        </div>
      </main>
    </div>
  );
}
