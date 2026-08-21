import os
import zipfile

os.system('node C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\translation-pms\\backend\\generate_lingotech_export.js')

export_dir = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\backend\lingotech_export"
zip_path_scratch = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\lingotech_pms_data.zip"
zip_path_brain = r"C:\Users\Admin\.gemini\antigravity\brain\2aceac9b-44fe-4d60-9a2d-4d19ceecbdea\lingotech_pms_data.zip"

def create_zip(target_file):
    with zipfile.ZipFile(target_file, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, dirs, files in os.walk(export_dir):
            for file in files:
                full_p = os.path.join(root, file)
                arc_p = os.path.basename(full_p)
                z.write(full_p, arc_p)

create_zip(zip_path_scratch)
create_zip(zip_path_brain)

print("Created ZIP files successfully.")
