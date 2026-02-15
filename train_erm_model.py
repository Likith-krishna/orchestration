"""
Empirical Risk Minimization (ERM) Based Machine Learning Pipeline
===================================================================

This script trains supervised learning models on patient data using ERM principles,
aiming for ~85% accuracy on validation data.

Author: ML Expert
Date: 2026-02-15
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             precision_score, recall_score, f1_score)
import warnings
warnings.filterwarnings('ignore')

# Try to import XGBoost, fall back to Gradient Boosting if not available
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    from sklearn.ensemble import GradientBoostingClassifier
    XGBOOST_AVAILABLE = False
    print("Note: XGBoost not available, using sklearn's GradientBoostingClassifier instead")

# Set random seed for reproducibility
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Visualization setup
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (10, 6)


def print_section(title):
    """Print a formatted section header."""
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)


def load_and_explore_data(filepath):
    """
    Load the dataset and perform initial exploration.
    
    Returns:
        df: Loaded DataFrame
        target_col: Name of the target column
    """
    print_section("STEP 1: DATA LOADING & EXPLORATION")
    
    # Load data
    df = pd.read_csv(filepath)
    print(f"\n✓ Loaded dataset: {df.shape[0]} rows × {df.shape[1]} columns")
    
    # Display basic info
    print(f"\nColumns: {list(df.columns)}")
    print(f"\nData types:\n{df.dtypes}")
    
    # Check missing values
    missing = df.isnull().sum()
    if missing.sum() > 0:
        print(f"\nMissing values found:")
        print(missing[missing > 0])
    else:
        print("\n✓ No missing values detected")
    
    # Display sample
    print(f"\nSample data (first 3 rows):")
    print(df.head(3).to_string())
    
    # Identify target column
    print("\n\nAnalyzing columns to identify target...")
    target_col = None
    for col in df.columns:
        if col not in ['Patient_ID', 'patient_id', 'ID', 'id']:
            n_unique = df[col].nunique()
            if 2 <= n_unique <= 10:  # Likely categorical target
                print(f"\n  Candidate: {col}")
                print(f"    - Unique values: {n_unique}")
                print(f"    - Distribution:\n{df[col].value_counts()}")
                
                # Use the last categorical column as target (common convention)
                target_col = col
    
    if target_col is None:
        # If no clear target found, use the last column (common convention)
        target_col = df.columns[-1]
        print(f"\n⚠ No clear categorical target found. Using last column: {target_col}")
    else:
        print(f"\n✓ Identified target column: '{target_col}'")
    
    return df, target_col


def create_preprocessing_pipeline(X_train, numerical_features, categorical_features):
    """
    Create a preprocessing pipeline with no data leakage.
    
    Args:
        X_train: Training features
        numerical_features: List of numerical column names
        categorical_features: List of categorical column names
    
    Returns:
        preprocessor: Fitted ColumnTransformer
    """
    print_section("STEP 2: PREPROCESSING PIPELINE")
    
    print(f"\nNumerical features ({len(numerical_features)}): {numerical_features}")
    print(f"Categorical features ({len(categorical_features)}): {categorical_features}")
    
    # Create transformers for different feature types
    numerical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),  # Handle missing values
        ('scaler', StandardScaler())  # Normalize for models sensitive to scale
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    # Combine transformers
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numerical_transformer, numerical_features),
            ('cat', categorical_transformer, categorical_features)
        ])
    
    print("\n✓ Preprocessing pipeline created:")
    print("  - Numerical: Median imputation → StandardScaler")
    print("  - Categorical: 'unknown' imputation → One-hot encoding")
    print("  - ⚡ No data leakage: fit only on training data")
    
    return preprocessor


def split_data(df, target_col, test_size=0.15, val_size=0.15):
    """
    Split data into train/validation/test sets with stratification.
    
    Returns:
        X_train, X_val, X_test, y_train, y_val, y_test
    """
    print_section("STEP 3: TRAIN/VALIDATION/TEST SPLIT")
    
    # Separate features and target
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Remove ID columns from features
    id_cols = [col for col in X.columns if 'id' in col.lower() or 'patient' in col.lower()]
    if id_cols:
        print(f"\n⚠ Dropping ID columns: {id_cols}")
        X = X.drop(columns=id_cols)
    
    # Handle any remaining NaN values in target
    if y.isnull().any():
        print(f"\n⚠ Found {y.isnull().sum()} NaN values in target. Dropping these rows.")
        valid_indices = ~y.isnull()
        X = X[valid_indices]
        y = y[valid_indices]
    
    # Check if stratification is possible
    stratify = y if y.nunique() < len(y) else None
    
    # First split: separate test set
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=test_size, random_state=RANDOM_STATE, stratify=stratify
    )
    
    # Second split: separate train and validation
    val_ratio = val_size / (1 - test_size)
    stratify_temp = y_temp if stratify is not None else None
    X_train, X_val, y_train, y_val = train_test_split(
        X_temp, y_temp, test_size=val_ratio, random_state=RANDOM_STATE, stratify=stratify_temp
    )
    
    print(f"\n✓ Data split completed:")
    print(f"  - Training set:   {len(X_train):4d} samples ({len(X_train)/len(X)*100:.1f}%)")
    print(f"  - Validation set: {len(X_val):4d} samples ({len(X_val)/len(X)*100:.1f}%)")
    print(f"  - Test set:       {len(X_test):4d} samples ({len(X_test)/len(X)*100:.1f}%)")
    
    # Check class distribution
    print(f"\n✓ Class distribution (stratified):")
    print(f"  - Training:   {y_train.value_counts(normalize=True).to_dict()}")
    print(f"  - Validation: {y_val.value_counts(normalize=True).to_dict()}")
    print(f"  - Test:       {y_test.value_counts(normalize=True).to_dict()}")
    
    return X_train, X_val, X_test, y_train, y_val, y_test


def train_model_with_erm(model, X_train, y_train, X_val, y_val, param_grid, model_name):
    """
    Train a model using Empirical Risk Minimization with hyperparameter tuning.
    
    Args:
        model: Scikit-learn model instance
        X_train, y_train: Training data
        X_val, y_val: Validation data
        param_grid: Dictionary of hyperparameters to search
        model_name: Name for logging
    
    Returns:
        best_model: Trained model with best hyperparameters
        val_accuracy: Validation accuracy
    """
    print(f"\n{'─' * 80}")
    print(f"Training: {model_name}")
    print(f"{'─' * 80}")
    print(f"ERM Principle: Minimizing empirical risk on training data")
    
    # Determine loss function
    if hasattr(model, 'loss'):
        print(f"Loss function: {model.loss if hasattr(model, 'loss') else 'log loss (cross-entropy)'}")
    else:
        print(f"Loss function: Log loss (cross-entropy) for classification")
    
    # Perform grid search with cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    grid_search = GridSearchCV(
        estimator=model,
        param_grid=param_grid,
        cv=cv,
        scoring='accuracy',
        n_jobs=-1,
        verbose=0
    )
    
    print(f"\nHyperparameter search space: {param_grid}")
    print(f"Cross-validation: 5-fold stratified")
    
    # Train
    grid_search.fit(X_train, y_train)
    
    # Get best model
    best_model = grid_search.best_estimator_
    
    # Evaluate on training and validation sets
    train_pred = best_model.predict(X_train)
    val_pred = best_model.predict(X_val)
    
    train_acc = accuracy_score(y_train, train_pred)
    val_acc = accuracy_score(y_val, val_pred)
    
    print(f"\n✓ Training completed!")
    print(f"  Best hyperparameters: {grid_search.best_params_}")
    print(f"  Training accuracy:    {train_acc:.4f} ({train_acc*100:.2f}%)")
    print(f"  Validation accuracy:  {val_acc:.4f} ({val_acc*100:.2f}%)")
    print(f"  Best CV score:        {grid_search.best_score_:.4f}")
    
    return best_model, val_acc


def train_all_models(X_train, y_train, X_val, y_val):
    """
    Train multiple models and compare their performance.
    
    Returns:
        models_dict: Dictionary of trained models
        results_df: DataFrame with comparison results
    """
    print_section("STEP 4: ERM-BASED MODEL TRAINING")
    
    models_dict = {}
    results = []
    
    # Check for class imbalance
    class_counts = pd.Series(y_train).value_counts()
    imbalance_ratio = class_counts.max() / class_counts.min()
    
    if imbalance_ratio > 2:
        print(f"\n⚠ Class imbalance detected (ratio: {imbalance_ratio:.2f})")
        print(f"  Using class_weight='balanced' for applicable models")
        class_weight = 'balanced'
    else:
        class_weight = None
    
    # ========================================
    # Model 1: Logistic Regression (Baseline)
    # ========================================
    print("\n" + "=" * 80)
    print("MODEL 1: LOGISTIC REGRESSION (Baseline)")
    print("=" * 80)
    
    lr_model = LogisticRegression(
        max_iter=1000,
        random_state=RANDOM_STATE,
        class_weight=class_weight
    )
    
    lr_params = {
        'C': [0.01, 0.1, 1, 10, 100],  # Regularization strength
        'solver': ['lbfgs', 'saga']
    }
    
    lr_best, lr_acc = train_model_with_erm(
        lr_model, X_train, y_train, X_val, y_val, lr_params, "Logistic Regression"
    )
    models_dict['Logistic Regression'] = lr_best
    results.append({'Model': 'Logistic Regression', 'Validation Accuracy': lr_acc})
    
    # ========================================
    # Model 2: Random Forest
    # ========================================
    print("\n" + "=" * 80)
    print("MODEL 2: RANDOM FOREST")
    print("=" * 80)
    
    rf_model = RandomForestClassifier(
        random_state=RANDOM_STATE,
        class_weight=class_weight,
        n_jobs=-1
    )
    
    rf_params = {
        'n_estimators': [100, 200],
        'max_depth': [10, 20, None],
        'min_samples_split': [2, 5],
        'min_samples_leaf': [1, 2]
    }
    
    rf_best, rf_acc = train_model_with_erm(
        rf_model, X_train, y_train, X_val, y_val, rf_params, "Random Forest"
    )
    models_dict['Random Forest'] = rf_best
    results.append({'Model': 'Random Forest', 'Validation Accuracy': rf_acc})
    
    # ========================================
    # Model 3: XGBoost / Gradient Boosting
    # ========================================
    print("\n" + "=" * 80)
    if XGBOOST_AVAILABLE:
        print("MODEL 3: XGBOOST")
    else:
        print("MODEL 3: GRADIENT BOOSTING")
    print("=" * 80)
    
    if XGBOOST_AVAILABLE:
        # Calculate scale_pos_weight for imbalanced classes
        if class_weight == 'balanced':
            scale_pos_weight = (y_train.value_counts()[0] / y_train.value_counts()[1] 
                               if len(y_train.unique()) == 2 else 1)
        else:
            scale_pos_weight = 1
        
        gb_model = XGBClassifier(
            random_state=RANDOM_STATE,
            scale_pos_weight=scale_pos_weight,
            use_label_encoder=False,
            eval_metric='logloss'
        )
        
        gb_params = {
            'n_estimators': [100, 200],
            'max_depth': [3, 5, 7],
            'learning_rate': [0.01, 0.1, 0.3],
            'subsample': [0.8, 1.0]
        }
    else:
        gb_model = GradientBoostingClassifier(
            random_state=RANDOM_STATE
        )
        
        gb_params = {
            'n_estimators': [100, 200],
            'max_depth': [3, 5, 7],
            'learning_rate': [0.01, 0.1, 0.3],
            'subsample': [0.8, 1.0]
        }
    
    model_name = "XGBoost" if XGBOOST_AVAILABLE else "Gradient Boosting"
    gb_best, gb_acc = train_model_with_erm(
        gb_model, X_train, y_train, X_val, y_val, gb_params, model_name
    )
    models_dict[model_name] = gb_best
    results.append({'Model': model_name, 'Validation Accuracy': gb_acc})
    
    # Create results DataFrame
    results_df = pd.DataFrame(results).sort_values('Validation Accuracy', ascending=False)
    
    return models_dict, results_df


def evaluate_best_model(best_model, model_name, X_train, X_val, X_test, 
                       y_train, y_val, y_test, feature_names):
    """
    Comprehensive evaluation of the best model on test set.
    """
    print_section("STEP 5: FINAL MODEL EVALUATION")
    
    print(f"\n🏆 Best Model: {model_name}")
    print(f"{'─' * 80}")
    
    # Predictions
    train_pred = best_model.predict(X_train)
    val_pred = best_model.predict(X_val)
    test_pred = best_model.predict(X_test)
    
    # Accuracies
    train_acc = accuracy_score(y_train, train_pred)
    val_acc = accuracy_score(y_val, val_pred)
    test_acc = accuracy_score(y_test, test_pred)
    
    print(f"\nAccuracy Summary:")
    print(f"  Training:   {train_acc:.4f} ({train_acc*100:.2f}%)")
    print(f"  Validation: {val_acc:.4f} ({val_acc*100:.2f}%)")
    print(f"  Test:       {test_acc:.4f} ({test_acc*100:.2f}%)")
    
    # Check for overfitting/underfitting
    if train_acc - test_acc > 0.1:
        print(f"\n⚠ Warning: Potential overfitting detected (train-test gap: {(train_acc-test_acc)*100:.2f}%)")
    elif train_acc < 0.7:
        print(f"\n⚠ Warning: Potential underfitting detected (train accuracy: {train_acc*100:.2f}%)")
    else:
        print(f"\n✓ Good generalization (train-test gap: {(train_acc-test_acc)*100:.2f}%)")
    
    # Detailed metrics
    print(f"\n{'─' * 80}")
    print("Classification Report (Test Set):")
    print(f"{'─' * 80}")
    print(classification_report(y_test, test_pred))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, test_pred)
    print(f"\nConfusion Matrix (Test Set):")
    print(cm)
    
    # Visualize confusion matrix
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=np.unique(y_test),
                yticklabels=np.unique(y_test))
    plt.title(f'Confusion Matrix - {model_name}')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=150, bbox_inches='tight')
    print("\n✓ Confusion matrix saved to: confusion_matrix.png")
    plt.close()
    
    # Feature importance (if available)
    if hasattr(best_model, 'feature_importances_'):
        print(f"\n{'─' * 80}")
        print("Feature Importance Analysis:")
        print(f"{'─' * 80}")
        
        # Get feature importances
        importances = best_model.feature_importances_
        
        # Create feature names for one-hot encoded features
        if len(feature_names) != len(importances):
            print(f"\nNote: {len(importances)} features after encoding")
        
        # Get top 15 features
        indices = np.argsort(importances)[::-1][:15]
        top_features = [(feature_names[i] if i < len(feature_names) else f'Feature_{i}', 
                        importances[i]) for i in indices]
        
        print("\nTop 15 Most Important Features:")
        for i, (feat, imp) in enumerate(top_features, 1):
            print(f"  {i:2d}. {feat:30s} {imp:.4f}")
        
        # Plot feature importance
        plt.figure(figsize=(10, 6))
        features_to_plot = [f[0] for f in top_features]
        importances_to_plot = [f[1] for f in top_features]
        
        plt.barh(range(len(features_to_plot)), importances_to_plot)
        plt.yticks(range(len(features_to_plot)), features_to_plot)
        plt.xlabel('Importance')
        plt.title(f'Top 15 Feature Importances - {model_name}')
        plt.tight_layout()
        plt.savefig('feature_importance.png', dpi=150, bbox_inches='tight')
        print("\n✓ Feature importance plot saved to: feature_importance.png")
        plt.close()
    
    elif hasattr(best_model, 'coef_'):
        print(f"\n{'─' * 80}")
        print("Feature Coefficients (Logistic Regression):")
        print(f"{'─' * 80}")
        
        if len(best_model.coef_.shape) == 1:
            coefs = best_model.coef_
        else:
            # For multiclass, take mean absolute coefficient
            coefs = np.mean(np.abs(best_model.coef_), axis=0)
        
        # Get top features
        indices = np.argsort(np.abs(coefs))[::-1][:15]
        top_features = [(feature_names[i] if i < len(feature_names) else f'Feature_{i}', 
                        coefs[i]) for i in indices]
        
        print("\nTop 15 Features by Coefficient Magnitude:")
        for i, (feat, coef) in enumerate(top_features, 1):
            print(f"  {i:2d}. {feat:30s} {coef:+.4f}")
    
    return test_acc


def main():
    """Main execution function."""
    
    print("\n")
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 78 + "║")
    print("║" + "  Empirical Risk Minimization (ERM) Machine Learning Pipeline".center(78) + "║")
    print("║" + "  Target: ~85% Validation Accuracy".center(78) + "║")
    print("║" + " " * 78 + "║")
    print("╚" + "═" * 78 + "╝")
    
    # ========================================
    # 1. Load and explore data
    # ========================================
    df, target_col = load_and_explore_data('patient_dataset_5000_realistic.csv')
    
    # ========================================
    # 2. Split data
    # ========================================
    X_train, X_val, X_test, y_train, y_val, y_test = split_data(df, target_col)
    
    # ========================================
    # 3. Identify feature types
    # ========================================
    # Important: Detect feature types AFTER removing ID columns
    # and check actual content, not just dtype
    numerical_features = []
    categorical_features = []
    
    for col in X_train.columns:
        # Try to convert to numeric
        try:
            # Check if the column can be converted to numeric
            pd.to_numeric(X_train[col], errors='raise')
            # If successful and not all same value, it's numerical
            if X_train[col].dtype in ['int64', 'float64'] or X_train[col].dtype.name.startswith('int') or X_train[col].dtype.name.startswith('float'):
                numerical_features.append(col)
            else:
                # String column that can be converted to numeric
                X_train[col] = pd.to_numeric(X_train[col], errors='coerce')
                X_val[col] = pd.to_numeric(X_val[col], errors='coerce')
                X_test[col] = pd.to_numeric(X_test[col], errors='coerce')
                numerical_features.append(col)
        except (ValueError, TypeError):
            # Cannot convert to numeric, so it's categorical
            categorical_features.append(col)
    
    # ========================================
    # 4. Create and fit preprocessing pipeline
    # ========================================
    preprocessor = create_preprocessing_pipeline(X_train, numerical_features, categorical_features)
    
    # Fit and transform
    X_train_processed = preprocessor.fit_transform(X_train)
    X_val_processed = preprocessor.transform(X_val)
    X_test_processed = preprocessor.transform(X_test)
    
    print(f"\n✓ Preprocessing completed")
    print(f"  - Training features shape: {X_train_processed.shape}")
    
    # ========================================
    # 5. Train models using ERM
    # ========================================
    models_dict, results_df = train_all_models(
        X_train_processed, y_train, X_val_processed, y_val
    )
    
    # ========================================
    # 6. Compare models
    # ========================================
    print_section("STEP 5: MODEL COMPARISON")
    print("\nValidation Accuracy Results:")
    print("─" * 80)
    for idx, row in results_df.iterrows():
        acc_pct = row['Validation Accuracy'] * 100
        bar = "█" * int(acc_pct / 2)
        print(f"  {row['Model']:20s} {acc_pct:6.2f}% {bar}")
    
    # Check if target is met
    best_acc = results_df.iloc[0]['Validation Accuracy']
    target_acc = 0.85
    
    if best_acc >= target_acc:
        print(f"\n🎯 ✓ Target achieved! Best validation accuracy: {best_acc*100:.2f}% ≥ {target_acc*100:.0f}%")
    else:
        gap = (target_acc - best_acc) * 100
        print(f"\n⚠ Target not achieved. Best: {best_acc*100:.2f}%, Target: {target_acc*100:.0f}% (gap: {gap:.2f}%)")
        print(f"\nPossible improvements:")
        print(f"  - Feature engineering (polynomial features, interactions)")
        print(f"  - Advanced text processing for 'Symptoms' column")
        print(f"  - Ensemble methods (stacking, voting)")
        print(f"  - More hyperparameter tuning iterations")
        print(f"  - Address class imbalance with SMOTE/ADASYN")
    
    # ========================================
    # 7. Evaluate best model on test set
    # ========================================
    best_model_name = results_df.iloc[0]['Model']
    best_model = models_dict[best_model_name]
    
    test_acc = evaluate_best_model(
        best_model, best_model_name,
        X_train_processed, X_val_processed, X_test_processed,
        y_train, y_val, y_test,
        numerical_features + categorical_features
    )
    
    # ========================================
    # 8. Final summary
    # ========================================
    print_section("FINAL SUMMARY")
    
    print(f"\n✅ Model Training Complete!")
    print(f"\n📊 Results:")
    print(f"  - Best Model:         {best_model_name}")
    print(f"  - Validation Accuracy: {best_acc*100:.2f}%")
    print(f"  - Test Accuracy:      {test_acc*100:.2f}%")
    print(f"  - Target:             {target_acc*100:.0f}%")
    
    print(f"\n🔬 ERM Approach:")
    print(f"  - Loss Function: Cross-entropy (log loss) for classification")
    print(f"  - Optimization: Minimize empirical risk on training data")
    print(f"  - Regularization: L1/L2 penalties to prevent overfitting")
    print(f"  - Validation: 5-fold stratified cross-validation")
    
    print(f"\n📈 What the model does:")
    print(f"  The {best_model_name} predicts the target variable ('{target_col}')")
    print(f"  based on patient features. It minimizes classification error on the")
    print(f"  training data while using regularization and cross-validation to")
    print(f"  ensure good generalization to unseen data.")
    
    print(f"\n🚀 Suggested Improvements:")
    print(f"  1. Feature engineering: Create interaction features, polynomial terms")
    print(f"  2. Text processing: Use TF-IDF or embeddings for symptom descriptions")
    print(f"  3. Ensemble methods: Combine multiple models via stacking/voting")
    print(f"  4. Advanced tuning: Use Optuna or Bayesian optimization")
    print(f"  5. Deep learning: Try neural networks if >5000 samples available")
    
    print(f"\n{'═' * 80}")
    print(f"  🎉 Pipeline execution completed successfully!")
    print(f"{'═' * 80}\n")


if __name__ == "__main__":
    main()
