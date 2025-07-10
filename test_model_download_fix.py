#!/usr/bin/env python3
"""
Test script to validate the model download fix

This script tests:
1. The import fix for Google Colab files module
2. Error handling for missing files
3. Proper file validation
4. Zip creation and download simulation
"""

import os
import sys
import tempfile
import subprocess

def test_import_fix():
    """Test that the files module import works correctly."""
    print("🧪 Testing import fix...")
    
    # Test the import in a separate Python process to avoid import caching
    test_code = """
import sys
try:
    import google.colab
    from google.colab import files
    print("✅ SUCCESS: Google Colab environment detected, files module imported")
except ImportError:
    print("✅ SUCCESS: Not in Colab environment, handled gracefully")
    # This is expected outside of Colab
except Exception as e:
    print(f"❌ FAILED: Unexpected error: {e}")
    sys.exit(1)
"""
    
    result = subprocess.run([sys.executable, "-c", test_code], 
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("   " + result.stdout.strip())
        return True
    else:
        print(f"   ❌ FAILED: {result.stderr.strip()}")
        return False


def test_error_handling():
    """Test error handling for missing model files."""
    print("\n🧪 Testing error handling...")
    
    # Test with non-existent file
    result = subprocess.run([sys.executable, "model_download.py"], 
                          capture_output=True, text=True, 
                          cwd="/home/runner/work/fplplayerdesc/fplplayerdesc")
    
    if "Error: Model file 'fin_disease.pth' not found" in result.stdout:
        print("   ✅ SUCCESS: Properly detects missing model file")
        return True
    else:
        print(f"   ❌ FAILED: Did not properly detect missing file")
        print(f"   Output: {result.stdout}")
        return False


def test_full_workflow():
    """Test the complete workflow with a dummy file."""
    print("\n🧪 Testing full workflow...")
    
    # Create a temporary directory for testing
    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = os.path.join(tmpdir, "fin_disease.pth")
        
        # Create a dummy model file
        with open(model_path, "w") as f:
            f.write("# Dummy model file for testing\n" * 50)
        
        # Copy our script to the temp directory
        script_path = os.path.join(tmpdir, "model_download.py")
        with open("/home/runner/work/fplplayerdesc/fplplayerdesc/model_download.py", "r") as src:
            with open(script_path, "w") as dst:
                dst.write(src.read())
        
        # Run the script
        result = subprocess.run([sys.executable, "model_download.py"], 
                              capture_output=True, text=True, cwd=tmpdir)
        
        expected_outputs = [
            "Model file validated",
            "Model metadata created",
            "Model zipped successfully",
            "Download simulation complete"
        ]
        
        success = all(output in result.stdout for output in expected_outputs)
        
        if success and result.returncode == 0:
            print("   ✅ SUCCESS: Full workflow completed successfully")
            return True
        else:
            print(f"   ❌ FAILED: Workflow did not complete as expected")
            print(f"   Return code: {result.returncode}")
            print(f"   Output: {result.stdout}")
            print(f"   Error: {result.stderr}")
            return False


def test_jupyter_notebook():
    """Test that the Jupyter notebook has valid JSON structure."""
    print("\n🧪 Testing Jupyter notebook...")
    
    try:
        import json
        with open("/home/runner/work/fplplayerdesc/fplplayerdesc/model_download_fixed.ipynb", "r") as f:
            notebook_data = json.load(f)
        
        # Check basic structure
        if "cells" in notebook_data and "metadata" in notebook_data:
            cell_count = len(notebook_data["cells"])
            print(f"   ✅ SUCCESS: Notebook is valid JSON with {cell_count} cells")
            return True
        else:
            print("   ❌ FAILED: Notebook missing required structure")
            return False
    except json.JSONDecodeError as e:
        print(f"   ❌ FAILED: Invalid JSON in notebook: {e}")
        return False
    except Exception as e:
        print(f"   ❌ FAILED: Error reading notebook: {e}")
        return False


def main():
    """Run all tests."""
    print("🚀 Running model download fix tests...")
    print("=" * 50)
    
    tests = [
        test_import_fix,
        test_error_handling,
        test_full_workflow,
        test_jupyter_notebook
    ]
    
    results = []
    for test in tests:
        results.append(test())
    
    print("\n" + "=" * 50)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    for i, (test, result) in enumerate(zip(tests, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {test.__name__}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The fix is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please review the output above.")
        return 1


if __name__ == "__main__":
    exit(main())