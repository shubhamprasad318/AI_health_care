"""
Validation utilities
"""
from typing import List, Dict


def validate_symptoms(symptoms: Dict) -> List[str]:
    """Validate and extract symptoms from request"""
    symptom_list = []
    
    for key, value in symptoms.items():
        if isinstance(value, dict) and 'value' in value:
            symptom = str(value['value']).strip()
        elif isinstance(value, str):
            symptom = value.strip()
        else:
            continue
        
        if symptom:
            symptom_list.append(symptom)
    
    return symptom_list
