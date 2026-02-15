"""
Quick dataset analysis to identify target column and features
"""
import pandas as pd
import numpy as np

# Load the dataset
df = pd.read_csv('patient_dataset_5000_realistic.csv')

print("="*80)
print("COMPLETE DATASET ANALYSIS")
print("="*80)

print(f"\n1. SHAPE: {df.shape[0]} rows × {df.shape[1]} columns")

print("\n2. COLUMNS:")
for i, col in enumerate(df.columns, 1):
    print(f"   {i}. {col}")

print("\n3. DATA TYPES:")
print(df.dtypes)

print("\n4. MISSING VALUES:")
missing = df.isnull().sum()
if missing.sum() == 0:
    print("   No missing values found!")
else:
    print(missing[missing > 0])

print("\n5. SAMPLE DATA (first 3 rows):")
pd.set_option('display.max_columns', None)
pd.set_option('display.width', None)
pd.set_option('display.max_colwidth', 50)
print(df.head(3))

print("\n6. UNIQUE VALUE COUNTS PER COLUMN:")
for col in df.columns:
    n_unique = df[col].nunique()
    print(f"\n   {col}: {n_unique} unique values", end="")
    if n_unique <= 15:  # Show values if categorical
        print(f"\n      → {sorted(df[col].dropna().unique())}")
    else:
        print()

print("\n7. IDENTIFYING TARGET COLUMN:")
print("   Looking for classification target...")
for col in df.columns:
    if col != 'Patient_ID' and df[col].nunique() < 20:
        print(f"\n   Possible target: {col}")
        print(f"   - Unique values: {df[col].nunique()}")
        print(f"   - Distribution:\n{df[col].value_counts()}")

print("\n" + "="*80)
print("ANALYSIS COMPLETE")
print("="*80)
