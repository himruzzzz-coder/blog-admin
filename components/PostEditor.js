'use client';

import { useState } from 'react';
import { uploadImage } from '@/lib/github';

export default function PostEditor({ initialData = {}, onSave }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [author, setAuthor] = useState(initialData.author || '');
  const [date, setDate] = useState(initialData.date || new Date().toISOString().split('T')[0]);
  const [excerpt, setExcerpt] = useState(initialData.excerpt || '');
  const [content, setContent] = useState(initialData.content || '');
  const [slug, setSlug] = useState(initialData.slug || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (value) => {
    setTitle(value);
    if (!initialData.slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      // Insert markdown image syntax at cursor
      const textarea = document.getElementById('content-textarea');
      const cursorPos = textarea.selectionStart;
      const textBefore = content.substring(0, cursorPos);
      const textAfter = content.substring(cursorPos);
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      
      setContent(textBefore + imageMarkdown + textAfter);
      alert('Image uploaded successfully!');
    } catch (error) {
      alert('Failed to upload image');
    }
    setUploading(false);
    e.target.value = ''; // Reset file input
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !slug || !content) {
      alert('Please fill in title, slug, and content');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        slug,
        title,
        author,
        date,
        excerpt,
        content,
      });
    } catch (error) {
      alert('Failed to save post');
    }
    setSaving(false);
  };

  // Insert markdown helpers
  const insertMarkdown = (before, after = '') => {
    const textarea = document.getElementById('content-textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter post title"
          required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Slug * (URL-friendly identifier)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="post-url-slug"
          pattern="[a-z0-9-]+"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          URL will be: /posts/{slug || 'your-slug'}
        </p>
      </div>

      {/* Author and Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Author
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Author name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Excerpt (Short description)
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="Brief summary of the post..."
        />
      </div>

      {/* Content Editor */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Content * (Markdown supported)
          </label>
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {/* Markdown Toolbar */}
        {!preview && (
          <div className="flex gap-2 mb-2 flex-wrap">
            <button
              type="button"
              onClick={() => insertMarkdown('**', '**')}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('*', '*')}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('## ')}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              title="Heading"
            >
              H
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('[', '](url)')}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              title="Link"
            >
              🔗
            </button>
            <button
              type="button"
              onClick={() => insertMarkdown('`', '`')}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              title="Code"
            >
              {'</>'}
            </button>
            <label className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer text-sm">
              {uploading ? 'Uploading...' : '📷 Image'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
        )}

        {/* Editor/Preview */}
        {preview ? (
          <div className="w-full px-4 py-3 border rounded-lg bg-gray-50 prose max-w-none min-h-[400px]">
            <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(content) }} />
          </div>
        ) : (
          <textarea
            id="content-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows="20"
            placeholder="Write your post content in Markdown...

## Heading 2
### Heading 3

**Bold text** and *italic text*

- List item 1
- List item 2

[Link text](https://example.com)

![Image alt text](image-url)

`inline code`"
            required
          />
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Post'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Simple markdown to HTML converter
function convertMarkdownToHtml(markdown) {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full h-auto" />');
  
  // Code
  html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 rounded">$1</code>');
  
  // Line breaks
  html = html.replace(/\n/gim, '<br />');
  
  return html;
}