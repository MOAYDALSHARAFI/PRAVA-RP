#!/usr/bin/env python3
import zipfile
import os

def package_project():
    output_path = 'public/prava-rp-project.zip'
    os.makedirs('public', exist_ok=True)
    
    exclude_dirs = {
        'node_modules', '.git', 'dist', '.aistudio', '__pycache__', '.vite'
    }
    exclude_files = {
        'prava-rp-project.zip', 'brava-system-project.zip', '.DS_Store'
    }

    count = 0
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Exclude specified directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files or file.endswith('.zip'):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, '.')
                zipf.write(full_path, rel_path)
                count += 1

    print(f"✅ Successfully packaged {count} files into {output_path}")

if __name__ == '__main__':
    package_project()
