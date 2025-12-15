import { getPost, getAllPosts } from '@/lib/github';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { marked } from 'marked';

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  if (!posts) return [];
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const htmlContent = marked(post.content);

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#09090b] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center"
          >
            ← Back to Blog
          </Link>
        </div>
      </header>

      {/* Article */}
      <main className="flex-grow max-w-3xl mx-auto px-4 py-12 w-full">
        <article>
          <header className="mb-10 text-center">
             <div className="text-sm text-blue-500 mb-4 font-medium">
                {post.date && new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>
            {post.author && (
              <div className="text-gray-400 text-sm">
                By {post.author}
              </div>
            )}
          </header>

          <div
            className="prose prose-lg prose-invert max-w-none
              prose-headings:text-white prose-headings:font-bold
              prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-img:rounded-xl prose-img:shadow-lg
              prose-code:text-pink-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1
              prose-pre:bg-[#18181b] prose-pre:border prose-pre:border-white/10"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>

        <div className="mt-16 pt-8 border-t border-white/10 text-center">
            <Link href="/" className="text-gray-500 hover:text-white text-sm">
                View all posts
            </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#09090b] py-8 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} Blog. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}