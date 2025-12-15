import { getAllPosts } from '@/lib/github';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function BlogHome() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Company Blog</h1>
            <Link
              href="/admin"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Admin →
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No posts yet.</p>
            <p className="text-gray-500">Check back soon for updates!</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <Link href={`/posts/${post.slug}`}>
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition">
                      {post.title}
                    </h2>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      {post.author && (
                        <span className="mr-4">{post.author}</span>
                      )}
                      {post.date && (
                        <time dateTime={post.date}>
                          {new Date(post.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      )}
                    </div>

                    {post.excerpt && (
                      <p className="text-gray-600 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="mt-4">
                      <span className="text-blue-600 hover:text-blue-800 font-semibold">
                        Read more →
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} Company Blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}