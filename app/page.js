import { getAllPosts } from '@/lib/github';
import Link from 'next/link';

export const revalidate = 60;

export default async function BlogHome() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">
            Dev<span className="text-blue-500">Blog</span>.
          </h1>
          <Link
            href="/admin"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="py-20 px-4 text-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Latest Writings</h2>
        <p className="text-gray-400 max-w-xl mx-auto text-lg">
          Thoughts on development, design, and technology.
        </p>
      </div>

      {/* Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8 w-full">
        {posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl">
            <p className="text-gray-500">No posts published yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group flex flex-col bg-[#18181b] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <Link href={`/posts/${post.slug}`} className="flex-grow">
                  <div className="p-6 flex flex-col h-full">
                    <div className="text-sm text-blue-500 mb-3 font-medium">
                      {post.date && new Date(post.date).toLocaleDateString()}
                    </div>
                    
                    <h2 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>

                    {post.excerpt && (
                      <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-grow line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="pt-4 border-t border-white/5 flex items-center text-sm text-gray-500">
                      <span>{post.author || 'Anonymous'}</span>
                      <span className="ml-auto text-blue-500 group-hover:translate-x-1 transition-transform">
                        Read more &rarr;
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
      <footer className="border-t border-white/10 py-8 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} Blog Name. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}