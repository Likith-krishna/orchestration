"""
Debug script to identify NaN issues in the dataset
"""
import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('patient_dataset_5000_realistic.csv')

print("="*80)
print("DEBUGGING NaN ISSUES")
print("="*80)

print("\n1. Missing values per column:")
missing = df.isnull().sum()
print(missing)

print("\n2. Data types:")
print(df.dtypes)

print("\n3. Sample of first 5 rows:")
print(df.head())

print("\n4. Check for problematic values:")
for col in df.columns:
    unique_count = df[col].nunique()
    print(f"\n{col}:")
    print(f"  - Type: {df[col].dtype}")
    print(f"  - Unique values: {unique_count}")
    print(f"  - Missing: {df[col].isnull().sum()}")
    
    # Check for empty strings or whitespace in object columns
    if df[col].dtype == 'object':
        empty_str = (df[col] == '').sum()
        whitespace = df[col].str.strip().eq('').sum() if df[col].dtype == 'object' else 0
        print(f"  - Empty strings: {empty_str}")
        print(f"  - Whitespace only: {whitespace}")
        
        # Show some sample values
        if unique_count < 20:
            print(f"  - Values: {df[col].unique()[:10]}")

print("\n5. Checking for text/numeric mixed columns:")
for col in df.columns:
    if df[col].dtype == 'object':
        # Try to convert to numeric
        try:
            numeric_version = pd.to_numeric(df[col], errors='coerce')
            nan_after = numeric_version.isnull().sum()
            nan_before = df[col].isnull().sum()
            if nan_after > nan_before:
                print(f"\n  {col}: Contains {nan_after - nan_before} non-numeric values")
        except:
            pass
