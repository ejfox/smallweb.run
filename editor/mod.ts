import * as path from "@std/path"

interface App {
  fetch: (req: Request) => Response | Promise<Response>
}

type CodeJarOptions = {
  rootDir?: string
}

export class CodeJar implements App {
  constructor(public options: CodeJarOptions = {}) { }

  run = async (args?: string[]) => { }

  fetch = async (req: Request) => {
    const rootDir = this.options.rootDir || Deno.env.get("SMALLWEB_DIR");
    if (!rootDir) {
      throw new Error("SMALLWEB_DIR is not set; are you sure you're app has admin permissions?")
    }

    const url = new URL(req.url);
    if (url.pathname == "/") {
      const usage = `Usage: ${url.origin}/<app>/<file>`;
      return new Response(usage, { status: 400 });
    }

    if (req.method == "POST") {
      await Deno.writeTextFile(path.join(rootDir, url.pathname), await req.text());
      return new Response("File created", { status: 200 });
    }

    if (req.method != "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (req.headers.get("accept") == "text/plain") {
      const content = await Deno.readTextFile(path.join(rootDir, url.pathname));
      return new Response(content, {
        headers: {
          "Content-Type": "text/plain",
        },
      });

    }

    return new Response(homepage, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  }
}

const homepage = /* html */ `<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Editor - Smallweb</title>
  <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" rel="stylesheet">
  <link rel="icon" href="https://fav.farm/✏️">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
    }

    .editor {
      background: #fff;
      font-family: "Source Code Pro", monospace;
      font-size: 14px;
      font-weight: 400;
      min-height: 240px;
      letter-spacing: normal;
      line-height: 20px;
      padding: 10px;
      tab-size: 4;
    }
  </style>
</head>
<body>
<div class="editor" data-manual data-gramm="false"></div>
<script type="module">
  import {CodeJar} from 'https://raw.esm.sh/codejar/dist/codejar.js'
  const editor = document.querySelector('.editor')

  const highlight = editor => {
    const extension = getFileExtension(window.location.pathname);
    const language = getLanguageFromExtension(extension);
    if (language && Prism.languages[language]) {
      editor.innerHTML = Prism.highlight(editor.textContent, Prism.languages[language], language);
    } else {
      // Fallback to plain text if language is not supported
      editor.textContent = editor.textContent;
    }
  }

  function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
  }

  function getLanguageFromExtension(extension) {
    const languageMap = {
      'js': 'javascript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'md': 'markdown',
      'json': 'json',
      'jsonl': 'json',
      'jsx': 'jsx',
      'tsx': 'tsx',
      // Add more mappings as needed
    };
    return languageMap[extension.toLowerCase()] || 'plaintext';
  }

  const jar = CodeJar(editor, highlight, {
    tab: '  ',
  })

  const resp = await fetch(window.location.href, {
    headers: {
        accept: 'text/plain'
    }
  })

  if (!resp.ok) {
    throw new Error('Failed to fetch code')
  }

  const code = await resp.text()

  jar.updateCode(code)

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
  }

  const debouncedUpdate = debounce(async (code) => {
    try {
      const response = await fetch(window.location.href, {
        method: 'POST',
        body: code
      });
      if (!response.ok) {
        console.error('Failed to update code');
      }
    } catch (error) {
      console.error('Error updating code:', error);
    }
  }, 500); // 500ms debounce

  jar.onUpdate(code => {
    debouncedUpdate(code);
  });
</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markdown.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-jsx.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-tsx.min.js"></script>
</body>
</html>`
