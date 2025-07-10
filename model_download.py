#!/usr/bin/env python3
"""
Model Download Script with Google Colab Integration

This script fixes the NameError issue where the 'files' module from Google Colab
was not imported, preventing model download functionality.

Features:
- Proper import of Google Colab files module
- Error handling and file existence checks
- Better user feedback and validation
- Model metadata reporting
- Robust zip creation with error handling
"""

import os
import sys
from pathlib import Path

# Check if running in Google Colab environment
try:
    import google.colab
    IN_COLAB = True
    from google.colab import files
except ImportError:
    IN_COLAB = False
    print("⚠️  Note: Not running in Google Colab environment")
    print("   files.download() functionality will be simulated")


def get_file_size_mb(file_path):
    """Get file size in MB with proper formatting."""
    if os.path.exists(file_path):
        size_bytes = os.path.getsize(file_path)
        size_mb = size_bytes / (1024 * 1024)
        return f"{size_mb:.2f} MB"
    return "Unknown"


def validate_model_file(model_path):
    """Validate that the model file exists and is accessible."""
    if not os.path.exists(model_path):
        print(f"❌ Error: Model file '{model_path}' not found")
        return False
    
    if os.path.getsize(model_path) == 0:
        print(f"❌ Error: Model file '{model_path}' is empty")
        return False
    
    print(f"✅ Model file validated: {model_path} ({get_file_size_mb(model_path)})")
    return True


def create_model_metadata(model_path):
    """Create metadata file for the model."""
    metadata_content = f"""Model Information
==================
Model file: {os.path.basename(model_path)}
File size: {get_file_size_mb(model_path)}
Created: {os.path.getctime(model_path)}
Description: Fine-tuned disease classification model
"""
    
    metadata_path = f"{os.path.splitext(model_path)[0]}_info.txt"
    try:
        with open(metadata_path, 'w') as f:
            f.write(metadata_content)
        print(f"✅ Model metadata created: {metadata_path}")
        return metadata_path
    except Exception as e:
        print(f"⚠️  Warning: Could not create metadata file: {e}")
        return None


def create_zip_archive(model_path, zip_name):
    """Create a zip archive containing the model and metadata."""
    print("📦 Creating zip file...")
    
    # Validate model file first
    if not validate_model_file(model_path):
        return False
    
    # Create metadata file
    metadata_path = create_model_metadata(model_path)
    
    # Create zip command
    zip_command = f"zip -r {zip_name} {model_path}"
    if metadata_path and os.path.exists(metadata_path):
        zip_command += f" {metadata_path}"
    
    # Execute zip command
    exit_code = os.system(zip_command)
    
    if exit_code != 0:
        print(f"❌ Error: Failed to create zip file (exit code: {exit_code})")
        return False
    
    return True


def download_model_zip(zip_path):
    """Download the zipped model with proper error handling."""
    if not os.path.exists(zip_path):
        print(f"❌ Error: Zip file '{zip_path}' was not created")
        return False
    
    file_size = get_file_size_mb(zip_path)
    print(f"✅ Model zipped successfully as {zip_path} ({file_size})")
    
    if IN_COLAB:
        try:
            print("🔄 Starting download...")
            files.download(zip_path)
            print("✅ Download initiated!")
            return True
        except Exception as e:
            print(f"❌ Error during download: {e}")
            return False
    else:
        print("🔄 Simulating download (not in Colab environment)...")
        print(f"   File '{zip_path}' would be downloaded in Google Colab")
        print("✅ Download simulation complete!")
        return True


def main():
    """Main function to orchestrate the model download process."""
    model_path = "fin_disease.pth"
    zip_name = "fin_disease.zip"
    
    print("🚀 Starting model download process...")
    print("=" * 50)
    
    # Step 1: Create zip archive
    if not create_zip_archive(model_path, zip_name):
        print("❌ Failed to create zip archive. Aborting.")
        sys.exit(1)
    
    # Step 2: Download the zip file
    if not download_model_zip(zip_name):
        print("❌ Failed to download zip file. Aborting.")
        sys.exit(1)
    
    print("=" * 50)
    print("🎉 Model download process completed successfully!")


if __name__ == "__main__":
    main()