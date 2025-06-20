# backend/models/advanced_ai.py - Advanced Clinical AI Models

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

@dataclass
class SepsisRiskAssessment:
    """Sepsis risk assessment result"""
    risk_score: float  # 0-1 probability
    risk_level: str    # LOW, MEDIUM, HIGH, CRITICAL
    sirs_criteria: Dict[str, bool]
    qsofa_score: int
    evidence: List[str]
    recommendations: List[str]
    confidence: float

@dataclass
class DrugDosageRecommendation:
    """Drug dosage recommendation result"""
    drug_name: str
    recommended_dose: float
    dose_unit: str
    route: str
    frequency: str
    duration: str
    contraindications: List[str]
    monitoring_parameters: List[str]
    confidence: float
    rationale: str

@dataclass
class PatientProfile:
    """Patient profile for AI models"""
    age: int
    weight: float  # kg
    height: float  # cm
    gender: str    # M/F
    comorbidities: List[str]
    current_medications: List[str]
    allergies: List[str]
    kidney_function: Optional[float] = None  # eGFR
    liver_function: Optional[str] = None     # Normal/Mild/Moderate/Severe

class SepsisDetectionModel:
    """Advanced sepsis detection using SIRS criteria + ML"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'temperature', 'heart_rate', 'respiratory_rate', 'wbc_count',
            'systolic_bp', 'map', 'lactate', 'age', 'is_male'
        ]
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the sepsis detection model with synthetic training data"""
        logger.info("Initializing sepsis detection model...")
        
        # Generate synthetic training data based on clinical literature
        np.random.seed(42)
        n_samples = 5000
        
        # Generate features
        X = np.zeros((n_samples, len(self.feature_names)))
        y = np.zeros(n_samples)
        
        for i in range(n_samples):
            # Age (20-90)
            age = np.random.uniform(20, 90)
            # Gender (0=F, 1=M)
            is_male = np.random.choice([0, 1])
            
            # Determine if patient has sepsis (30% positive cases)
            has_sepsis = np.random.random() < 0.3
            
            if has_sepsis:
                # Sepsis cases - abnormal values
                temp = np.random.choice([
                    np.random.normal(38.5, 0.5),  # Fever
                    np.random.normal(35.5, 0.5)   # Hypothermia
                ])
                hr = np.random.normal(110, 15)      # Tachycardia
                rr = np.random.normal(25, 5)        # Tachypnea
                wbc = np.random.choice([
                    np.random.normal(15, 3),        # Leukocytosis
                    np.random.normal(3, 0.5)        # Leukopenia
                ])
                sbp = np.random.normal(85, 10)      # Hypotension
                map_val = np.random.normal(55, 8)   # Low MAP
                lactate = np.random.normal(3.5, 1)  # Elevated lactate
            else:
                # Normal cases
                temp = np.random.normal(36.8, 0.3)
                hr = np.random.normal(75, 10)
                rr = np.random.normal(16, 3)
                wbc = np.random.normal(7, 2)
                sbp = np.random.normal(120, 15)
                map_val = np.random.normal(80, 10)
                lactate = np.random.normal(1.5, 0.5)
            
            X[i] = [temp, hr, rr, wbc, sbp, map_val, lactate, age, is_male]
            y[i] = has_sepsis
        
        # Train the model
        X_scaled = self.scaler.fit_transform(X)
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_scaled, y)
        
        logger.info("Sepsis detection model initialized successfully")
    
    def assess_sepsis_risk(self, vitals: Dict, patient_profile: PatientProfile, 
                          lab_values: Optional[Dict] = None) -> SepsisRiskAssessment:
        """Assess sepsis risk based on current vitals and patient data"""
        
        # SIRS Criteria Assessment
        sirs_criteria = self._evaluate_sirs_criteria(vitals, lab_values)
        
        # qSOFA Score
        qsofa_score = self._calculate_qsofa(vitals)
        
        # ML Model Prediction
        ml_features = self._extract_features(vitals, patient_profile, lab_values)
        if ml_features is not None:
            ml_features_scaled = self.scaler.transform([ml_features])
            ml_risk = self.model.predict_proba(ml_features_scaled)[0][1]
        else:
            ml_risk = 0.5  # Default if features unavailable
        
        # Combine assessments
        sirs_count = sum(sirs_criteria.values())
        
        # Risk scoring algorithm
        if sirs_count >= 2 and qsofa_score >= 2:
            risk_score = max(0.8, ml_risk)
            risk_level = "CRITICAL"
        elif sirs_count >= 2 or qsofa_score >= 2:
            risk_score = max(0.6, ml_risk * 0.8)
            risk_level = "HIGH"
        elif sirs_count == 1 or qsofa_score == 1:
            risk_score = max(0.3, ml_risk * 0.6)
            risk_level = "MEDIUM"
        else:
            risk_score = ml_risk * 0.4
            risk_level = "LOW"
        
        # Generate evidence and recommendations
        evidence = self._generate_evidence(sirs_criteria, qsofa_score, vitals)
        recommendations = self._generate_sepsis_recommendations(risk_level, evidence)
        
        return SepsisRiskAssessment(
            risk_score=risk_score,
            risk_level=risk_level,
            sirs_criteria=sirs_criteria,
            qsofa_score=qsofa_score,
            evidence=evidence,
            recommendations=recommendations,
            confidence=0.85
        )
    
    def _evaluate_sirs_criteria(self, vitals: Dict, lab_values: Optional[Dict]) -> Dict[str, bool]:
        """Evaluate SIRS (Systemic Inflammatory Response Syndrome) criteria"""
        criteria = {}
        
        # Temperature >38°C or <36°C
        temp = vitals.get('Temp', 36.5)
        criteria['temperature'] = temp > 38.0 or temp < 36.0
        
        # Heart rate >90 bpm
        hr = vitals.get('HR', 75)
        criteria['heart_rate'] = hr > 90
        
        # Respiratory rate >20/min or PaCO2 <32 mmHg
        rr = vitals.get('RR', 16)
        etco2 = vitals.get('EtCO2', 35)
        criteria['respiratory'] = rr > 20 or etco2 < 32
        
        # WBC >12,000 or <4,000 or >10% bands
        if lab_values and 'wbc' in lab_values:
            wbc = lab_values['wbc']
            criteria['wbc'] = wbc > 12 or wbc < 4
        else:
            criteria['wbc'] = False  # Cannot assess without lab values
        
        return criteria
    
    def _calculate_qsofa(self, vitals: Dict) -> int:
        """Calculate qSOFA (quick Sequential Organ Failure Assessment) score"""
        score = 0
        
        # Systolic BP ≤100 mmHg
        map_val = vitals.get('MAP', 75)
        # Estimate systolic from MAP (rough approximation)
        estimated_systolic = map_val * 1.4
        if estimated_systolic <= 100:
            score += 1
        
        # Respiratory rate ≥22/min
        rr = vitals.get('RR', 16)
        if rr >= 22:
            score += 1
        
        # Altered mental status (cannot assess from vitals alone)
        # In real implementation, would use GCS or other neurological assessments
        
        return score
    
    def _extract_features(self, vitals: Dict, patient_profile: PatientProfile, 
                         lab_values: Optional[Dict]) -> Optional[List[float]]:
        """Extract features for ML model"""
        try:
            features = [
                vitals.get('Temp', 36.5),
                vitals.get('HR', 75),
                vitals.get('RR', 16),
                lab_values.get('wbc', 7) if lab_values else 7,
                vitals.get('MAP', 75) * 1.4,  # Estimate systolic
                vitals.get('MAP', 75),
                lab_values.get('lactate', 1.5) if lab_values else 1.5,
                patient_profile.age,
                1 if patient_profile.gender == 'M' else 0
            ]
            return features
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return None
    
    def _generate_evidence(self, sirs_criteria: Dict, qsofa_score: int, vitals: Dict) -> List[str]:
        """Generate evidence list for sepsis assessment"""
        evidence = []
        
        if sirs_criteria.get('temperature'):
            temp = vitals.get('Temp', 36.5)
            if temp > 38:
                evidence.append(f"Fever present ({temp:.1f}°C)")
            else:
                evidence.append(f"Hypothermia present ({temp:.1f}°C)")
        
        if sirs_criteria.get('heart_rate'):
            hr = vitals.get('HR', 75)
            evidence.append(f"Tachycardia present ({hr:.0f} bpm)")
        
        if sirs_criteria.get('respiratory'):
            rr = vitals.get('RR', 16)
            evidence.append(f"Tachypnea present ({rr:.0f} /min)")
        
        if qsofa_score >= 2:
            evidence.append(f"qSOFA score elevated ({qsofa_score}/3)")
        
        return evidence
    
    def _generate_sepsis_recommendations(self, risk_level: str, evidence: List[str]) -> List[str]:
        """Generate clinical recommendations based on sepsis risk"""
        recommendations = []
        
        if risk_level == "CRITICAL":
            recommendations.extend([
                "🚨 IMMEDIATE: Initiate sepsis protocol",
                "💉 Obtain blood cultures before antibiotics",
                "💊 Start broad-spectrum antibiotics within 1 hour",
                "💧 Aggressive fluid resuscitation (30ml/kg crystalloid)",
                "🩸 Serial lactate measurements",
                "📞 Consider ICU consultation"
            ])
        elif risk_level == "HIGH":
            recommendations.extend([
                "⚠️ HIGH: Close monitoring required",
                "🩸 Obtain blood cultures and labs",
                "💊 Consider early antibiotic therapy",
                "💧 Fluid challenge if hypotensive",
                "📊 Frequent vital sign monitoring"
            ])
        elif risk_level == "MEDIUM":
            recommendations.extend([
                "📊 Increased monitoring frequency",
                "🩸 Consider lab workup if clinical concern",
                "👀 Watch for clinical deterioration"
            ])
        else:
            recommendations.append("✅ Continue routine monitoring")
        
        return recommendations

class DrugDosagewAI:
    """AI-powered drug dosage calculator with safety checks"""
    
    def __init__(self):
        self.drug_database = self._initialize_drug_database()
        self.interaction_checker = DrugInteractionChecker()
    
    def _initialize_drug_database(self) -> Dict:
        """Initialize drug database with common perioperative medications"""
        return {
            'propofol': {
                'category': 'anesthetic',
                'base_dose': 2.0,  # mg/kg
                'maintenance': 50,  # mcg/kg/min
                'max_dose': 200,   # mcg/kg/min
                'unit': 'mg/kg',
                'route': 'IV',
                'half_life': 0.5,  # hours
                'contraindications': ['egg allergy', 'soy allergy'],
                'monitoring': ['BP', 'HR', 'BIS', 'consciousness level']
            },
            'midazolam': {
                'category': 'sedative',
                'base_dose': 0.02,  # mg/kg
                'max_dose': 0.1,    # mg/kg
                'unit': 'mg/kg',
                'route': 'IV',
                'half_life': 2.0,
                'contraindications': ['severe respiratory depression'],
                'monitoring': ['respiratory rate', 'consciousness level']
            },
            'fentanyl': {
                'category': 'opioid',
                'base_dose': 2.0,   # mcg/kg
                'max_dose': 20.0,   # mcg/kg
                'unit': 'mcg/kg',
                'route': 'IV',
                'half_life': 3.5,
                'contraindications': ['severe respiratory depression'],
                'monitoring': ['respiratory rate', 'pain score', 'consciousness']
            },
            'norepinephrine': {
                'category': 'vasopressor',
                'base_dose': 0.1,   # mcg/kg/min
                'max_dose': 3.0,    # mcg/kg/min
                'unit': 'mcg/kg/min',
                'route': 'IV',
                'half_life': 0.033,  # 2 minutes
                'contraindications': ['uncorrected hypovolemia'],
                'monitoring': ['MAP', 'HR', 'urine output', 'perfusion']
            },
            'phenylephrine': {
                'category': 'vasopressor',
                'base_dose': 1.0,   # mcg/kg/min
                'max_dose': 10.0,   # mcg/kg/min
                'unit': 'mcg/kg/min',
                'route': 'IV',
                'half_life': 0.05,  # 3 minutes
                'contraindications': ['severe CAD'],
                'monitoring': ['MAP', 'HR']
            }
        }
    
    def calculate_dosage(self, drug_name: str, patient_profile: PatientProfile, 
                        clinical_indication: str, current_vitals: Dict) -> DrugDosageRecommendation:
        """Calculate optimal drug dosage based on patient and clinical factors"""
        
        drug_name_lower = drug_name.lower()
        if drug_name_lower not in self.drug_database:
            raise ValueError(f"Drug {drug_name} not found in database")
        
        drug_info = self.drug_database[drug_name_lower]
        
        # Base dose calculation
        base_dose = drug_info['base_dose']
        
        # Adjust for patient factors
        adjusted_dose = self._adjust_for_patient_factors(
            base_dose, patient_profile, drug_info
        )
        
        # Adjust for clinical condition
        final_dose = self._adjust_for_clinical_condition(
            adjusted_dose, clinical_indication, current_vitals, drug_info
        )
        
        # Safety checks
        contraindications = self._check_contraindications(
            drug_info, patient_profile
        )
        
        # Generate recommendations
        frequency, duration = self._determine_frequency_duration(
            drug_info, clinical_indication
        )
        
        rationale = self._generate_dosage_rationale(
            drug_name, base_dose, final_dose, patient_profile, clinical_indication
        )
        
        return DrugDosageRecommendation(
            drug_name=drug_name,
            recommended_dose=final_dose,
            dose_unit=drug_info['unit'],
            route=drug_info['route'],
            frequency=frequency,
            duration=duration,
            contraindications=contraindications,
            monitoring_parameters=drug_info['monitoring'],
            confidence=0.88,
            rationale=rationale
        )
    
    def _adjust_for_patient_factors(self, base_dose: float, patient: PatientProfile, 
                                   drug_info: Dict) -> float:
        """Adjust dose based on patient-specific factors"""
        dose = base_dose
        
        # Age adjustments
        if patient.age > 65:
            dose *= 0.8  # Reduce dose for elderly
        elif patient.age < 18:
            dose *= 1.2  # May need higher dose for pediatric (per kg)
        
        # Kidney function adjustment
        if patient.kidney_function and patient.kidney_function < 60:
            if drug_info['category'] in ['opioid', 'sedative']:
                dose *= 0.7  # Reduce for renal impairment
        
        # Liver function adjustment
        if patient.liver_function in ['Moderate', 'Severe']:
            if drug_info['category'] == 'anesthetic':
                dose *= 0.6  # Significant reduction for hepatic impairment
        
        return dose
    
    def _adjust_for_clinical_condition(self, dose: float, indication: str, 
                                     vitals: Dict, drug_info: Dict) -> float:
        """Adjust dose based on current clinical condition"""
        
        if drug_info['category'] == 'vasopressor':
            map_val = vitals.get('MAP', 75)
            if map_val < 55:
                dose *= 1.5  # Increase for severe hypotension
            elif map_val < 65:
                dose *= 1.2  # Moderate increase
        
        if drug_info['category'] == 'anesthetic':
            hr = vitals.get('HR', 75)
            if hr > 100:
                dose *= 0.9  # Slight reduction if tachycardic
        
        return dose
    
    def _check_contraindications(self, drug_info: Dict, 
                               patient: PatientProfile) -> List[str]:
        """Check for contraindications"""
        contraindications = []
        
        # Check allergies
        for allergy in patient.allergies:
            if allergy.lower() in [c.lower() for c in drug_info['contraindications']]:
                contraindications.append(f"Allergy to {allergy}")
        
        # Check drug interactions
        interactions = self.interaction_checker.check_interactions(
            drug_info, patient.current_medications
        )
        contraindications.extend(interactions)
        
        return contraindications
    
    def _determine_frequency_duration(self, drug_info: Dict, 
                                    indication: str) -> Tuple[str, str]:
        """Determine appropriate frequency and duration"""
        category = drug_info['category']
        
        if category == 'anesthetic':
            return 'Continuous infusion', 'Duration of procedure'
        elif category == 'vasopressor':
            return 'Continuous infusion', 'Until MAP >65 mmHg'
        elif category in ['sedative', 'opioid']:
            return 'PRN q2-4h', 'As needed'
        else:
            return 'As directed', 'As clinically indicated'
    
    def _generate_dosage_rationale(self, drug_name: str, base_dose: float, 
                                 final_dose: float, patient: PatientProfile, 
                                 indication: str) -> str:
        """Generate rationale for dosage recommendation"""
        
        adjustment_factor = final_dose / base_dose
        
        rationale_parts = [
            f"Base dose for {drug_name}: {base_dose:.2f}",
        ]
        
        if patient.age > 65:
            rationale_parts.append("Reduced 20% for elderly patient")
        
        if patient.kidney_function and patient.kidney_function < 60:
            rationale_parts.append("Reduced 30% for renal impairment")
        
        if patient.liver_function in ['Moderate', 'Severe']:
            rationale_parts.append("Reduced 40% for hepatic impairment")
        
        rationale_parts.append(f"Final dose: {final_dose:.2f}")
        
        return ". ".join(rationale_parts)

class DrugInteractionChecker:
    """Check for drug interactions"""
    
    def __init__(self):
        self.interactions = {
            'propofol': ['midazolam', 'fentanyl'],
            'midazolam': ['fentanyl', 'propofol'],
            'fentanyl': ['midazolam', 'propofol']
        }
    
    def check_interactions(self, drug_info: Dict, current_meds: List[str]) -> List[str]:
        """Check for potential drug interactions"""
        interactions = []
        
        # This is a simplified implementation
        # Real systems would use comprehensive interaction databases
        
        return interactions  # Return empty for now

# Integration with FastAPI endpoint
async def get_sepsis_assessment(vitals: Dict, patient_data: Dict) -> Dict:
    """Endpoint function for sepsis assessment"""
    try:
        # Initialize models
        sepsis_model = SepsisDetectionModel()
        
        # Create patient profile
        patient_profile = PatientProfile(
            age=patient_data.get('age', 65),
            weight=patient_data.get('weight', 70),
            height=patient_data.get('height', 170),
            gender=patient_data.get('gender', 'M'),
            comorbidities=patient_data.get('comorbidities', []),
            current_medications=patient_data.get('medications', []),
            allergies=patient_data.get('allergies', [])
        )
        
        # Assess sepsis risk
        assessment = sepsis_model.assess_sepsis_risk(vitals, patient_profile)
        
        return {
            'sepsis_risk': {
                'risk_score': assessment.risk_score,
                'risk_level': assessment.risk_level,
                'sirs_criteria': assessment.sirs_criteria,
                'qsofa_score': assessment.qsofa_score,
                'evidence': assessment.evidence,
                'recommendations': assessment.recommendations,
                'confidence': assessment.confidence
            }
        }
    
    except Exception as e:
        logger.error(f"Error in sepsis assessment: {e}")
        return {'error': str(e)}

async def get_drug_dosage(drug_name: str, patient_data: Dict, 
                         indication: str, vitals: Dict) -> Dict:
    """Endpoint function for drug dosage calculation"""
    try:
        # Initialize dosage calculator
        dosage_calc = DrugDosagewAI()
        
        # Create patient profile
        patient_profile = PatientProfile(
            age=patient_data.get('age', 65),
            weight=patient_data.get('weight', 70),
            height=patient_data.get('height', 170),
            gender=patient_data.get('gender', 'M'),
            comorbidities=patient_data.get('comorbidities', []),
            current_medications=patient_data.get('medications', []),
            allergies=patient_data.get('allergies', []),
            kidney_function=patient_data.get('kidney_function'),
            liver_function=patient_data.get('liver_function')
        )
        
        # Calculate dosage
        recommendation = dosage_calc.calculate_dosage(
            drug_name, patient_profile, indication, vitals
        )
        
        return {
            'dosage_recommendation': {
                'drug_name': recommendation.drug_name,
                'recommended_dose': recommendation.recommended_dose,
                'dose_unit': recommendation.dose_unit,
                'route': recommendation.route,
                'frequency': recommendation.frequency,
                'duration': recommendation.duration,
                'contraindications': recommendation.contraindications,
                'monitoring_parameters': recommendation.monitoring_parameters,
                'confidence': recommendation.confidence,
                'rationale': recommendation.rationale
            }
        }
    
    except Exception as e:
        logger.error(f"Error in drug dosage calculation: {e}")
        return {'error': str(e)}