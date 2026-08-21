import os
import re

def fix_dist():
    dist_dir = r"C:\Users\Admin\.gemini\antigravity\scratch\translation-pms\frontend\dist"
    index_file = os.path.join(dist_dir, "index.html")
    
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace absolute /assets/ with relative ./assets/
        fixed_content = content.replace('src="/assets/', 'src="./assets/').replace('href="/assets/', 'href="./assets/')
        
        with open(index_file, "w", encoding="utf-8") as f:
            f.write(fixed_content)
        print("✅ Fixed index.html relative asset links!")

if __name__ == "__main__":
    fix_dist()
