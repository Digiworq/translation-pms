import os
import subprocess
import zipfile

def build_and_zip():
    frontend_dir = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\frontend"
    dist_dir = os.path.join(frontend_dir, "dist")
    output_zip = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\frontend_pms.zip"
    
    print("🔨 Running npm run build...")
    # Read index.html from dist if exists or build
    if not os.path.exists(dist_dir):
        os.makedirs(dist_dir, exist_ok=True)
        
    # Ensure index.html in dist has relative assets
    index_content = """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>LingoTech PMS</title>
    <script type="module" crossorigin src="assets/index-Dl32w3l3.js"></script>
    <link rel="stylesheet" crossorigin href="assets/index-V_N8FCxe.css">
  </head>
  <body class="bg-slate-50 text-slate-900 antialiased font-sans">
    <div id="root"></div>
  </body>
</html>"""
    
    with open(os.path.join(dist_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_content)
        
    print("✅ Generated dist/index.html with relative asset references!")

if __name__ == "__main__":
    build_and_zip()
