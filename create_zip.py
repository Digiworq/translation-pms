import os
import zipfile

# Execute create_mongodb_zip.js first via node
os.system('node C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\translation-pms\\backend\\create_mongodb_zip.js')

export_dir = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\backend\mongodb_export"
zip_path_scratch = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\mongodb_data.zip"
zip_path_brain = r"C:\Users\Admin\.gemini\antigravity\brain\2aceac9b-44fe-4d60-9a2d-4d19ceecbdea\mongodb_data.zip"

def make_zip(out_path):
    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(export_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.basename(file_path)
                zipf.write(file_path, arcname)

make_zip(zip_path_scratch)
make_zip(zip_path_brain)

print(f"Created ZIP archives:\n- {zip_path_scratch}\n- {zip_path_brain}")
