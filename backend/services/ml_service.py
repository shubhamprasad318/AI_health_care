"""
ML Model Service
Disease prediction using ensemble models
"""
import logging
import pickle
import csv
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple
from collections import Counter

logger = logging.getLogger(__name__)

# Global ML models
svm_model = None
nb_model = None
rf_model = None
data_dict = {}
specialization = {}
disease_descriptions = {}
disease_precautions = {}


async def load_models():
    """Load ML models and CSV data"""
    global svm_model, nb_model, rf_model, data_dict, specialization
    global disease_descriptions, disease_precautions
    
    try:
        base_dir = Path(__file__).parent.parent
        models_dir = base_dir / 'models'
        
        logger.info("[LOADING] ML models...")
        
        # Load models
        with open(models_dir / 'svm_model.pkl', 'rb') as f:
            svm_model = pickle.load(f)
        
        with open(models_dir / 'nb_model.pkl', 'rb') as f:
            nb_model = pickle.load(f)
        
        with open(models_dir / 'rf_model.pkl', 'rb') as f:
            rf_model = pickle.load(f)
        
        with open(models_dir / 'data_dict.pkl', 'rb') as f:
            data_dict = pickle.load(f)
        
        with open(models_dir / 'Doctor_Specialist_Model.pkl', 'rb') as f:
            specialization = pickle.load(f)
        
        # Fix RF model estimators
        if rf_model:
            for estimator in rf_model.estimators_:
                if not hasattr(estimator, 'monotonic_cst'):
                    estimator.monotonic_cst = None
        
        logger.info("[LOADING] CSV data...")
        
        # Load disease descriptions
        desc_path = models_dir / 'symptom_Description.csv'
        with open(desc_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)
            for row in reader:
                if len(row) >= 2:
                    disease_descriptions[row[0]] = row[1]
        
        # Load disease precautions
        prec_path = models_dir / 'symptom_precaution.csv'
        with open(prec_path, 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            next(reader)
            for row in reader:
                if len(row) >= 5:
                    disease_precautions[row[0]] = [row[1], row[2], row[3], row[4]]
        
        logger.info("[OK] All ML models loaded successfully")
        logger.info(f"[OK] Diseases: {len(disease_descriptions)}")
        logger.info(f"[OK] Symptoms: {len(data_dict.get('symptom_index', {}))}")
        
    except Exception as e:
        logger.error(f"[ERROR] Error loading ML models: {e}")
        raise


def mode(arr: List[str]) -> str:
    """Get most common element"""
    counter = Counter(arr)
    max_count = max(counter.values())
    return next(k for k, v in counter.items() if v == max_count)


def normalize_symptom_name(symptom: str) -> str:
    """
    Convert symptom name to match training format
    'Abdominal Pain' -> 'abdominal_pain'
    'Vomiting' -> 'vomiting'
    """
    return symptom.lower().replace(' ', '_').replace('-', '_')


async def predict_disease(symptoms: List[str]) -> Tuple[str, str, List[str], str]:
    """
    Predict disease from symptoms using ensemble models
    Returns: (prediction, description, precautions, specialist)
    """
    if not all([svm_model, nb_model, rf_model]):
        raise Exception("ML models not loaded")
    
    # Prepare input vector
    input_data = [0] * len(data_dict["symptom_index"])
    
    for symptom in symptoms:
        index = data_dict["symptom_index"].get(symptom, -1)
        if index != -1:
            input_data[index] = 1
    
    # ✅ FIX: Get feature names from the trained model
    # The models were trained with lowercase + underscores
    if hasattr(rf_model, 'feature_names_in_'):
        # Use actual feature names from training
        feature_names = rf_model.feature_names_in_.tolist()
    else:
        # Fallback: normalize the symptom names from data_dict
        feature_names = [normalize_symptom_name(s) for s in data_dict["symptom_index"].keys()]
    
    # Create DataFrame with correct feature names
    input_df = pd.DataFrame([input_data], columns=feature_names)
    
    logger.info(f"[PREDICT] Input shape: {input_df.shape}, Active symptoms: {sum(input_data)}")
    logger.info(f"[PREDICT] Using feature names: {feature_names[:5]}...")  # Show first 5
    
    # Get predictions from all models
    rf_pred = data_dict["predictions_classes"][rf_model.predict(input_df)[0]]
    nb_pred = data_dict["predictions_classes"][nb_model.predict(input_df)[0]]
    svm_pred = data_dict["predictions_classes"][svm_model.predict(input_df)[0]]
    
    logger.info(f"[PREDICT] RF: {rf_pred}, NB: {nb_pred}, SVM: {svm_pred}")
    
    # Ensemble prediction (mode/majority voting)
    final_prediction = mode([rf_pred, nb_pred, svm_pred])
    
    logger.info(f"[OK] Final prediction: {final_prediction}")
    
    # Get additional info
    description = disease_descriptions.get(final_prediction, "No description available")
    precautions = disease_precautions.get(final_prediction, [])
    specialist = specialization.get(final_prediction, "General Physician")
    
    return final_prediction, description, precautions, specialist


def are_models_loaded() -> bool:
    """Check if ML models are loaded"""
    return all([svm_model, nb_model, rf_model, data_dict])


def get_available_symptoms() -> List[str]:
    """Get list of all available symptoms"""
    if data_dict and "symptom_index" in data_dict:
        return list(data_dict["symptom_index"].keys())
    return []


def get_disease_info(disease_name: str) -> Dict:
    """Get complete information about a disease"""
    return {
        "disease": disease_name,
        "description": disease_descriptions.get(disease_name, "No description available"),
        "precautions": disease_precautions.get(disease_name, []),
        "specialist": specialization.get(disease_name, "General Physician")
    }
