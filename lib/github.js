// lib/github.js - GitHub API wrapper functions (FIXED)

// Force these to be available on both client and server
const GITHUB_API = 'https://api.github.com';
const TOKEN = typeof window !== 'undefined' 
  ? process.env.NEXT_PUBLIC_GITHUB_TOKEN 
  : process.env.NEXT_PUBLIC_GITHUB_TOKEN;
const OWNER = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_GITHUB_OWNER
  : process.env.NEXT_PUBLIC_GITHUB_OWNER;
const REPO = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_GITHUB_REPO
  : process.env.NEXT_PUBLIC_GITHUB_REPO;

// Debug function to check config
function checkConfig() {
  if (!TOKEN || !OWNER || !REPO) {
    console.error('❌ GitHub Config Missing:');
    console.error('TOKEN:', TOKEN ? 'SET' : 'MISSING');
    console.error('OWNER:', OWNER || 'MISSING');
    console.error('REPO:', REPO || 'MISSING');
    return false;
  }
  console.log('✅ GitHub Config OK:', OWNER, '/', REPO);
  return true;
}

// Get all blog posts
export async function getAllPosts() {
  try {
    if (!checkConfig()) {
      throw new Error('GitHub configuration is incomplete');
    }

    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/posts`;
    console.log('📡 Fetching posts from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️ Posts folder not found (404)');
        return [];
      }
      const errorText = await response.text();
      console.error('❌ GitHub API Error:', response.status, errorText);
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    const files = await response.json();
    console.log('📁 Found files:', files.length);
    
    const mdFiles = files.filter(file => file.name.endsWith('.md'));
    console.log('📝 Markdown files:', mdFiles.length);

    if (mdFiles.length === 0) {
      return [];
    }

    const posts = await Promise.all(
      mdFiles.map(async (file) => {
        try {
          const content = await getFileContent(file.path);
          const { metadata } = parseMarkdown(content);
          return {
            slug: file.name.replace('.md', ''),
            ...metadata,
            path: file.path,
          };
        } catch (error) {
          console.error(`❌ Error loading ${file.name}:`, error.message);
          return null;
        }
      })
    );

    const validPosts = posts.filter(post => post !== null);
    console.log('✅ Valid posts loaded:', validPosts.length);
    
    return validPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.error('❌ Error fetching posts:', error.message);
    return [];
  }
}

// Get single post by slug
export async function getPost(slug) {
  try {
    if (!checkConfig()) {
      throw new Error('GitHub configuration is incomplete');
    }

    console.log('📡 Fetching post:', slug);
    const content = await getFileContent(`posts/${slug}.md`);
    const { metadata, content: body } = parseMarkdown(content);
    return {
      slug,
      ...metadata,
      content: body,
    };
  } catch (error) {
    console.error('❌ Error fetching post:', error.message);
    return null;
  }
}

// Get file content from GitHub
async function getFileContent(path) {
  const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`;
  console.log('📡 Fetching file:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `token ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ File fetch error:', response.status, errorText);
    throw new Error(`File not found: ${path}`);
  }

  const data = await response.json();
  return decodeBase64(data.content);
}

// Create or update a post
export async function savePost(slug, content, metadata) {
  const path = `posts/${slug}.md`;
  const markdownContent = createMarkdown(metadata, content);

  try {
    if (!checkConfig()) {
      throw new Error('GitHub configuration is incomplete');
    }

    console.log('💾 Saving post:', slug);

    // Check if file exists
    let sha = null;
    try {
      const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`;
      const existingFile = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `token ${TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        cache: 'no-store',
      });
      
      if (existingFile.ok) {
        const data = await existingFile.json();
        sha = data.sha;
        console.log('📝 Updating existing post');
      }
    } catch (e) {
      console.log('📝 Creating new post');
    }

    // Create or update file
    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: sha ? `Update post: ${slug}` : `Create post: ${slug}`,
        content: encodeBase64(markdownContent),
        sha: sha,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Save error:', response.status, errorText);
      throw new Error(`Failed to save post: ${response.status} - ${errorText}`);
    }

    console.log('✅ Post saved successfully');
    return await response.json();
  } catch (error) {
    console.error('❌ Error saving post:', error.message);
    throw error;
  }
}

// Delete a post
export async function deletePost(slug) {
  const path = `posts/${slug}.md`;

  try {
    if (!checkConfig()) {
      throw new Error('GitHub configuration is incomplete');
    }

    console.log('🗑️ Deleting post:', slug);

    // Get file SHA
    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`;
    const fileResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!fileResponse.ok) {
      throw new Error('Post not found');
    }

    const fileData = await fileResponse.json();

    // Delete file
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Delete post: ${slug}`,
        sha: fileData.sha,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Delete error:', response.status, errorText);
      throw new Error('Failed to delete post');
    }

    console.log('✅ Post deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting post:', error.message);
    throw error;
  }
}

// Upload image to GitHub
export async function uploadImage(file) {
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `images/${fileName}`;

  try {
    if (!checkConfig()) {
      throw new Error('GitHub configuration is incomplete');
    }

    console.log('📤 Uploading image:', fileName);

    const base64 = await fileToBase64(file);
    const base64Content = base64.split(',')[1]; // Remove data:image/...;base64, prefix

    const url = `${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload image: ${fileName}`,
        content: base64Content,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload error:', response.status, errorText);
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    console.log('✅ Image uploaded successfully');
    return data.content.download_url;
  } catch (error) {
    console.error('❌ Error uploading image:', error.message);
    throw error;
  }
}

// Helper: Parse markdown with frontmatter
function parseMarkdown(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content };
  }

  const [, frontmatter, body] = match;
  const metadata = {};

  frontmatter.split('\n').forEach(line => {
    const [key, ...values] = line.split(':');
    if (key && values.length) {
      metadata[key.trim()] = values.join(':').trim();
    }
  });

  return { metadata, content: body.trim() };
}

// Helper: Create markdown with frontmatter
function createMarkdown(metadata, content) {
  const frontmatter = Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  return `---\n${frontmatter}\n---\n\n${content}`;
}

// Helper: Decode base64
function decodeBase64(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    console.error('Base64 decode error:', e);
    return atob(str);
  }
}

// Helper: Encode base64
function encodeBase64(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    console.error('Base64 encode error:', e);
    return btoa(str);
  }
}

// Helper: Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}