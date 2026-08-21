import os
import zipfile

def zip_backend():
    backend_dir = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\backend"
    output_zip = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\backend.zip"
    
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as ziph:
        for root, dirs, files in os.walk(backend_dir):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, backend_dir)
                ziph.write(file_path, os.path.join('backend', rel_path))

    print("✅ Created backend.zip successfully!")

if __name__ == "__main__":
    zip_backend()
