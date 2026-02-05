/**
 * Database Seeder
 * Generates and inserts all sample data for the Prior Authorization demo.
 */

import { query } from './connection.js';

// ============================================================================
// MEMBERS (15 records)
// ============================================================================
const members = [
  ['MEM-100001','John','Doe','1975-03-15','M','4532','123 Oak St','Hartford','CT','06101','860-555-0101','john.doe@email.com','Gold Plus HMO','PLN-GOLD-001','GRP-5001','2025-01-01',null,'Family',25,50,3000,1875,8000,3200,true,true,'Dr. Robert Chen','1234567001'],
  ['MEM-100002','Jane','Smith','1982-07-22','F','7891','456 Maple Ave','Boston','MA','02101','617-555-0202','jane.smith@email.com','Silver PPO','PLN-SILV-002','GRP-5002','2025-01-01',null,'Individual',35,65,4000,2100,10000,4500,true,true,'Dr. Linda Park','1234567002'],
  ['MEM-100003','Robert','Johnson','1990-11-05','M','3456','789 Pine Rd','New Haven','CT','06510','203-555-0303','r.johnson@email.com','Bronze HMO','PLN-BRNZ-003','GRP-5003','2025-01-01',null,'Individual',40,75,5000,800,12000,1200,true,true,'Dr. James Wright','1234567003'],
  ['MEM-100004','Maria','Garcia','1968-04-10','F','2234','321 Elm St','Springfield','MA','01101','413-555-0404','m.garcia@email.com','Gold Plus HMO','PLN-GOLD-001','GRP-5001','2024-06-01',null,'Family',25,50,3000,2950,8000,5600,true,true,'Dr. Anita Patel','1234567004'],
  ['MEM-100005','James','Wilson','1955-09-28','M','8876','654 Cedar Ln','Providence','RI','02901','401-555-0505','j.wilson@email.com','Platinum PPO','PLN-PLAT-004','GRP-5004','2024-01-01',null,'Family',15,30,1500,1500,5000,3800,true,true,'Dr. Michael Torres','1234567005'],
  ['MEM-100006','Sarah','Davis','1978-12-03','F','5543','987 Birch Dr','Stamford','CT','06901','203-555-0606','s.davis@email.com','Gold Plus HMO','PLN-GOLD-001','GRP-5001','2025-01-01',null,'Individual',25,50,3000,1200,8000,2100,true,true,'Dr. Karen Liu','1234567006'],
  ['MEM-100007','Michael','Brown','1965-06-17','M','9912','147 Walnut St','Worcester','MA','01601','508-555-0707','m.brown@email.com','Silver PPO','PLN-SILV-002','GRP-5002','2025-01-01',null,'Family',35,65,4000,3800,10000,7200,true,true,'Dr. Steven Grant','1234567007'],
  ['MEM-100008','Emily','Taylor','1988-01-25','F','6678','258 Ash Ave','Bridgeport','CT','06601','203-555-0808','e.taylor@email.com','Bronze HMO','PLN-BRNZ-003','GRP-5003','2025-01-01',null,'Individual',40,75,5000,600,12000,900,true,true,'Dr. Nancy Kim','1234567008'],
  ['MEM-100009','David','Anderson','1972-08-14','M','1123','369 Spruce Ct','Waterbury','CT','06701','203-555-0909','d.anderson@email.com','Gold Plus HMO','PLN-GOLD-001','GRP-5001','2025-01-01',null,'Family',25,50,3000,2400,8000,4100,true,true,'Dr. Paul Reeves','1234567009'],
  ['MEM-100010','Lisa','Martinez','1960-05-20','F','4456','741 Poplar Way','New London','CT','06320','860-555-1010','l.martinez@email.com','Platinum PPO','PLN-PLAT-004','GRP-5004','2024-01-01',null,'Individual',15,30,1500,1500,5000,4200,true,true,'Dr. Grace Huang','1234567010'],
  ['MEM-100011','Thomas','White','1985-10-09','M','7789','852 Willow Blvd','Danbury','CT','06810','203-555-1111','t.white@email.com','Silver PPO','PLN-SILV-002','GRP-5002','2025-01-01',null,'Individual',35,65,4000,1600,10000,2800,true,true,'Dr. Mark Evans','1234567011'],
  ['MEM-100012','Jennifer','Lee','1976-02-28','F','3321','963 Hickory Ln','Norwalk','CT','06850','203-555-1212','j.lee@email.com','Gold Plus HMO','PLN-GOLD-001','GRP-5001','2025-01-01',null,'Family',25,50,3000,2700,8000,4800,true,true,'Dr. Susan Cho','1234567012'],
  ['MEM-100013','Christopher','Clark','1958-11-12','M','5567','174 Chestnut St','Meriden','CT','06450','203-555-1313','c.clark@email.com','Bronze HMO','PLN-BRNZ-003','GRP-5003','2024-06-01',null,'Individual',40,75,5000,4200,12000,6500,true,true,'Dr. Richard Gomez','1234567013'],
  ['MEM-100014','Amanda','Harris','1970-07-04','F','8834','285 Sycamore Rd','Milford','CT','06460','203-555-1414','a.harris@email.com','Platinum PPO','PLN-PLAT-004','GRP-5004','2024-01-01',null,'Family',15,30,1500,1500,5000,4600,true,true,'Dr. Helen Wu','1234567014'],
  ['MEM-100015','Daniel','Moore','1992-03-30','M','2245','396 Magnolia Dr','Shelton','CT','06484','203-555-1515','d.moore@email.com','Silver PPO','PLN-SILV-002','GRP-5002','2025-01-01',null,'Individual',35,65,4000,500,10000,750,true,true,'Dr. Brian Foster','1234567015'],
];

const memberCols = 'member_id,first_name,last_name,date_of_birth,gender,ssn_last4,address_line1,address_city,address_state,address_zip,phone,email,plan_type,plan_id,group_number,effective_date,termination_date,coverage_level,copay_primary,copay_specialist,deductible_annual,deductible_met,max_out_of_pocket,oop_met,is_active,pre_auth_required,pcp_name,pcp_npi';

// ============================================================================
// COVERAGE POLICIES (15 records)
// ============================================================================
const policies = [
  {
    policy_id: 'NCD-220.1', policy_type: 'NCD', title: 'Electrocardiography - Diagnostic ECG',
    procedure_codes: ['93000','93005','93010'], diagnosis_codes: ['I25.10','I50.9','R00.0','R00.1','I10','E11.9','R94.31'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Documented symptoms of cardiac arrhythmia or chest pain','History of cardiovascular disease or risk factors','Baseline ECG for pre-operative cardiac evaluation','Monitoring of known cardiac condition']),
    required_documentation: JSON.stringify(['Clinical notes documenting cardiac symptoms','Patient history and physical examination','Ordering physician rationale']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['Active cardiac symptoms documented','Pre-operative clearance with surgery scheduled']}),
    denial_conditions: JSON.stringify({conditions: ['Routine screening without documented symptoms','Duplicate ECG within 30 days without clinical change']}),
    review_triggers: JSON.stringify({conditions: ['Multiple ECGs in 90-day period','Non-standard diagnosis code pairing']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerYear: 4, minDaysBetween: 30}),
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=220.1',
    last_reviewed: '2025-06-15'
  },
  {
    policy_id: 'LCD-035', policy_type: 'LCD', title: 'MRI Brain - Neurological Imaging',
    procedure_codes: ['70553','70551','70552'], diagnosis_codes: ['G43.909','R51.9','G40.909','R55','G45.9','R47.01'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Persistent headaches unresponsive to initial treatment (>6 weeks)','New onset seizure activity','Focal neurological deficits on examination','Suspicion of intracranial pathology based on clinical findings']),
    required_documentation: JSON.stringify(['Neurological examination findings','Prior imaging results if applicable','Treatment history for headaches/symptoms','Referral from treating physician']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['Emergency presentation with acute neurological deficit']}),
    denial_conditions: JSON.stringify({conditions: ['Routine headache screening without red flag symptoms','Repeat MRI within 6 months without clinical change']}),
    review_triggers: JSON.stringify({conditions: ['Age under 18','Prior normal MRI within 12 months','Request for contrast without documented indication']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerYear: 2, minDaysBetween: 180}),
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: '6 weeks', treatments: ['Analgesic therapy','Neurological consultation']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=35',
    last_reviewed: '2025-03-20'
  },
  {
    policy_id: 'LCD-032', policy_type: 'LCD', title: 'Physical Therapy - Therapeutic Exercises',
    procedure_codes: ['97110','97112','97116','97140','97530'], diagnosis_codes: ['M54.5','M79.3','S83.512A','M54.2','M25.561','M79.604'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Documented functional limitation requiring skilled PT intervention','Measurable therapy goals with expected improvement timeline','Physician referral with diagnosis supporting medical necessity','Failure of home exercise program or self-management']),
    required_documentation: JSON.stringify(['Physician referral/prescription','Initial PT evaluation with objective measurements','Treatment plan with measurable goals','Progress notes for continued sessions']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['Initial 12 sessions with documented physician order','Post-surgical rehabilitation within 90 days']}),
    denial_conditions: JSON.stringify({conditions: ['No functional improvement after 30 sessions','Maintenance therapy without skilled need','No physician referral on file']}),
    review_triggers: JSON.stringify({conditions: ['Request exceeds 36 sessions per year','Treatment extending beyond 90 days','Multiple body regions treated simultaneously']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxSessionsPerYear: 36, requiresReEvalEvery: 10}),
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=32',
    last_reviewed: '2025-04-10'
  },
  {
    policy_id: 'NCD-150.4', policy_type: 'NCD', title: 'Total Knee Arthroplasty (TKA)',
    procedure_codes: ['27447','27446'], diagnosis_codes: ['M17.11','M17.12','M17.0','M17.9'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Radiographic evidence of moderate-to-severe osteoarthritis (Kellgren-Lawrence Grade 3-4)','Failure of conservative treatment for minimum 3 months','Significant functional impairment documented by validated outcome measure','BMI below 40 or documented weight management plan']),
    required_documentation: JSON.stringify(['Weight-bearing knee radiographs','Conservative treatment history (PT, injections, NSAIDs)','Functional assessment scores (KOOS or WOMAC)','Surgical clearance and pre-operative evaluation','BMI documentation']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['All medical necessity criteria met with complete documentation']}),
    denial_conditions: JSON.stringify({conditions: ['BMI over 40 without documented weight management','Less than 3 months conservative treatment','No radiographic evidence of significant arthritis']}),
    review_triggers: JSON.stringify({conditions: ['Age under 55 or over 85','Bilateral TKA request','History of prior knee surgery','Active infection or wound healing issues']}),
    age_restrictions: JSON.stringify({minAge: 40}), gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerLifetime: 2, perKnee: 1}),
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: '3 months', treatments: ['Physical therapy','Corticosteroid injections','NSAIDs','Weight management','Activity modification']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=150.4',
    last_reviewed: '2025-01-30'
  },
  {
    policy_id: 'LCD-078', policy_type: 'LCD', title: 'Cardiac Catheterization - Diagnostic',
    procedure_codes: ['93458','93459','93460','93461'], diagnosis_codes: ['I25.10','I20.0','R07.9','I25.110','I25.810'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Abnormal non-invasive cardiac testing (stress test, nuclear imaging)','Unstable angina or acute coronary syndrome presentation','Evaluation of known coronary artery disease with change in symptoms','Pre-operative cardiac assessment for high-risk surgery']),
    required_documentation: JSON.stringify(['Prior non-invasive test results','Cardiology consultation notes','ECG and troponin levels if acute presentation','Risk factor documentation','Medication list']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['Acute MI or unstable angina presentation']}),
    denial_conditions: JSON.stringify({conditions: ['No prior non-invasive testing performed','Routine screening without symptoms','Repeat catheterization within 12 months without clinical change']}),
    review_triggers: JSON.stringify({conditions: ['Age over 80','Prior CABG or PCI within 12 months','Multiple comorbidities']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerYear: 2, minDaysBetween: 180}),
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: 'Prior non-invasive evaluation required', treatments: ['Stress testing','Cardiac CT','Echocardiography','Medication optimization']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=78',
    last_reviewed: '2025-05-01'
  },
  {
    policy_id: 'NCD-210.3', policy_type: 'NCD', title: 'Screening Colonoscopy',
    procedure_codes: ['45380','45378','45385'], diagnosis_codes: ['K63.5','Z12.11','D12.6','K57.30','Z86.010'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Age 45+ for average-risk screening (per ACS guidelines)','Positive fecal occult blood test or FIT test','Personal history of colorectal polyps','Family history of colorectal cancer in first-degree relative','Symptoms: rectal bleeding, change in bowel habits, unexplained anemia']),
    required_documentation: JSON.stringify(['Patient age and risk assessment','Prior colonoscopy date and findings','Family history documentation','Stool test results if applicable','Symptom documentation for diagnostic indication']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['Screening age 45+ with no colonoscopy in 10 years','Positive FIT/FOBT result','Documented high-risk family history']}),
    denial_conditions: JSON.stringify({conditions: ['Screening interval not met (less than 10 years for average risk)','No documented indication','Patient under 45 without high-risk indication']}),
    review_triggers: JSON.stringify({conditions: ['Request within 5 years of prior colonoscopy','Multiple sedation risk factors','Anticoagulation therapy']}),
    age_restrictions: JSON.stringify({minAge: 45}), gender_restrictions: null,
    frequency_limits: JSON.stringify({screeningEveryYears: 10, highRiskEveryYears: 5}),
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=210.3',
    last_reviewed: '2025-02-28'
  },
  {
    policy_id: 'LCD-056', policy_type: 'LCD', title: 'Lumbar Spinal Fusion Surgery',
    procedure_codes: ['22612','22614','22630','22633'], diagnosis_codes: ['M43.16','M51.16','M48.06','M47.816','M53.2X6'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Documented spinal instability or spondylolisthesis on imaging','Failure of conservative treatment for minimum 6 months','Correlation between imaging findings and clinical symptoms','Documented progressive neurological deficit','Psychological clearance for surgical candidacy']),
    required_documentation: JSON.stringify(['MRI or CT of lumbar spine within 6 months','Conservative treatment records (PT, injections, medication)','Neurosurgery or orthopedic spine consultation','Psychological evaluation for chronic pain patients','Functional capacity evaluation']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['Progressive neurological deficit with imaging correlation']}),
    denial_conditions: JSON.stringify({conditions: ['Less than 6 months conservative treatment','No imaging correlation with symptoms','Active smoking without cessation program','Untreated psychiatric comorbidity']}),
    review_triggers: JSON.stringify({conditions: ['Multi-level fusion request (>2 levels)','Prior lumbar surgery','Age over 75','BMI over 35','Workers compensation case']}),
    age_restrictions: JSON.stringify({maxAge: 85}), gender_restrictions: null,
    frequency_limits: null,
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: '6 months', treatments: ['Physical therapy','Epidural steroid injections','NSAIDs and muscle relaxants','Activity modification','Chiropractic care']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=56',
    last_reviewed: '2025-07-12'
  },
  {
    policy_id: 'LCD-089', policy_type: 'LCD', title: 'CT Abdomen and Pelvis with Contrast',
    procedure_codes: ['74178','74177','74176'], diagnosis_codes: ['R10.9','K80.20','C18.9','R19.00','K56.60'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Acute abdominal pain with clinical suspicion of surgical pathology','Evaluation of known malignancy (staging or surveillance)','Unexplained weight loss with suspected intra-abdominal process','Post-operative complication evaluation','Abnormal lab values suggesting intra-abdominal pathology']),
    required_documentation: JSON.stringify(['Clinical history and physical examination','Prior imaging results if applicable','Relevant laboratory values','Oncology staging requirements if cancer-related']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['Acute abdomen presentation','Known malignancy surveillance per NCCN guidelines','ER presentation with surgical consult']}),
    denial_conditions: JSON.stringify({conditions: ['Routine screening without symptoms','Repeat CT within 30 days without clinical change','Non-specific abdominal discomfort without workup']}),
    review_triggers: JSON.stringify({conditions: ['Contrast allergy history','Renal insufficiency (eGFR < 30)','Pregnancy','Pediatric patient']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerYear: 4, minDaysBetween: 60}),
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=89',
    last_reviewed: '2025-04-05'
  },
  {
    policy_id: 'LCD-034', policy_type: 'LCD', title: 'Shoulder Arthroscopy - Rotator Cuff Repair',
    procedure_codes: ['29827','29826','29824','29823'], diagnosis_codes: ['M75.120','M75.100','S43.401A','M75.110','M19.011'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['MRI-confirmed rotator cuff tear (partial or complete)','Failure of conservative treatment for minimum 6 weeks','Documented functional impairment affecting daily activities','Positive clinical examination findings (Neer, Hawkins, empty can test)']),
    required_documentation: JSON.stringify(['Shoulder MRI report','Physical therapy records (minimum 6 weeks)','Orthopedic consultation with exam findings','Functional limitation documentation','Prior injection records if applicable']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['Full-thickness rotator cuff tear with documented conservative treatment failure']}),
    denial_conditions: JSON.stringify({conditions: ['No MRI confirmation of pathology','Less than 6 weeks conservative treatment','Partial tear without functional impairment']}),
    review_triggers: JSON.stringify({conditions: ['Age over 70','Massive rotator cuff tear','Prior shoulder surgery','Workers compensation','Bilateral request']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerLifetime: 2, perShoulder: 1}),
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: '6 weeks', treatments: ['Physical therapy','Subacromial corticosteroid injection','NSAIDs','Activity modification']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=34',
    last_reviewed: '2025-05-20'
  },
  {
    policy_id: 'NCD-110.18', policy_type: 'NCD', title: 'Chemotherapy Administration - Oncology',
    procedure_codes: ['96413','96415','96417','96375'], diagnosis_codes: ['C50.911','C34.90','C18.9','C61','C56.9'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Pathology-confirmed malignancy','NCCN guideline-concordant treatment regimen','Adequate performance status (ECOG 0-2)','Baseline laboratory values within acceptable range','Oncology board review or tumor board recommendation']),
    required_documentation: JSON.stringify(['Pathology report confirming malignancy','Staging workup results','NCCN guideline reference for proposed regimen','Baseline labs (CBC, CMP, tumor markers)','Oncology treatment plan','Informed consent documentation']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['NCCN-concordant first-line therapy for confirmed malignancy']}),
    denial_conditions: JSON.stringify({conditions: ['No pathology confirmation','Non-NCCN-concordant regimen without clinical trial enrollment','ECOG performance status >3','Inadequate organ function for proposed regimen']}),
    review_triggers: JSON.stringify({conditions: ['Off-label drug use','Third-line or later therapy','Clinical trial enrollment','Concurrent radiation therapy','Age over 80']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: null,
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=110.18',
    last_reviewed: '2025-08-01'
  },
  {
    policy_id: 'LCD-067', policy_type: 'LCD', title: 'Polysomnography - Sleep Study',
    procedure_codes: ['95811','95810'], diagnosis_codes: ['G47.33','G47.30','R06.83','E66.01'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Clinical symptoms of sleep-disordered breathing (snoring, witnessed apneas, excessive daytime sleepiness)','Epworth Sleepiness Scale score >= 10','BMI >= 30 with sleep-related symptoms','Failed home sleep test requiring in-lab confirmation']),
    required_documentation: JSON.stringify(['Sleep medicine consultation','Epworth Sleepiness Scale score','Clinical symptom documentation','BMI and neck circumference','Home sleep test results if prior attempt']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['Epworth >= 10 with documented symptoms','Failed or inconclusive home sleep test']}),
    denial_conditions: JSON.stringify({conditions: ['No sleep study consultation on file','Repeat study within 12 months without clinical change','No documented sleep-related symptoms']}),
    review_triggers: JSON.stringify({conditions: ['Pediatric patient','Split-night study request','Prior normal sleep study within 2 years','Central sleep apnea suspicion']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerYear: 1, minMonthsBetween: 12}),
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=67',
    last_reviewed: '2025-03-15'
  },
  {
    policy_id: 'LCD-023', policy_type: 'LCD', title: 'Stereotactic Breast Biopsy',
    procedure_codes: ['19083','19081','19082'], diagnosis_codes: ['N63.0','D05.10','R92.1','R92.0','N63.10'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['BI-RADS 4 or 5 mammographic finding','Suspicious calcifications or mass on imaging','New finding not present on prior imaging','Palpable mass with imaging correlation']),
    required_documentation: JSON.stringify(['Mammography or breast ultrasound report with BI-RADS classification','Radiology recommendation for biopsy','Prior breast imaging for comparison','Clinical breast examination findings']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['BI-RADS 4 or 5 classification','Radiologist recommendation for biopsy']}),
    denial_conditions: JSON.stringify({conditions: ['BI-RADS 1 or 2 (benign finding)','No imaging support for biopsy','Repeat biopsy of previously biopsied benign lesion without interval change']}),
    review_triggers: JSON.stringify({conditions: ['Multiple biopsy sites in single session','Prior breast cancer history','Age under 30','Pregnancy or lactation']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: null,
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=23',
    last_reviewed: '2025-06-10'
  },
  {
    policy_id: 'LCD-090', policy_type: 'LCD', title: 'CPAP/BiPAP Device - Positive Airway Pressure',
    procedure_codes: ['E0601','E0470','E0471'], diagnosis_codes: ['G47.33','G47.30'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Polysomnography-confirmed obstructive sleep apnea (AHI >= 15, or AHI 5-14 with symptoms)','Face-to-face clinical evaluation by treating physician','Documentation of sleep apnea symptoms','Patient education on CPAP use and compliance expectations']),
    required_documentation: JSON.stringify(['Sleep study report with AHI score','Face-to-face clinical evaluation note','Prescription for CPAP with pressure settings','Patient compliance agreement','DME supplier documentation']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['AHI >= 15 on diagnostic sleep study','AHI 5-14 with documented symptoms and face-to-face visit']}),
    denial_conditions: JSON.stringify({conditions: ['No sleep study on file','AHI < 5','No face-to-face evaluation documented','Prior CPAP non-compliance without remediation plan']}),
    review_triggers: JSON.stringify({conditions: ['BiPAP request (requires additional justification)','Auto-titrating device request','Replacement device within 5 years','Travel CPAP request']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({replacementEveryYears: 5}),
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: 'Sleep study required first', treatments: ['Diagnostic polysomnography','Sleep medicine consultation']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=90',
    last_reviewed: '2025-02-20'
  },
  {
    policy_id: 'NCD-020.7', policy_type: 'NCD', title: 'Percutaneous Coronary Intervention - Stent Placement',
    procedure_codes: ['92928','92920','92924','92943'], diagnosis_codes: ['I25.10','I21.09','I25.110','I25.810','I20.0'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Angiographically documented significant coronary stenosis (>=70% or >=50% left main)','Symptomatic coronary artery disease despite optimal medical therapy','Acute coronary syndrome with indication for intervention','Positive functional testing demonstrating ischemia in target vessel territory']),
    required_documentation: JSON.stringify(['Cardiac catheterization report with lesion quantification','Prior non-invasive test results','Cardiology consultation with intervention recommendation','Current medication list showing optimal medical therapy','Informed consent for PCI']),
    approval_conditions: JSON.stringify({autoApprove: false, conditions: ['STEMI or NSTEMI with culprit lesion','Left main stenosis >=50%']}),
    denial_conditions: JSON.stringify({conditions: ['Stenosis <50% without functional significance','No prior stress testing or functional evaluation','Chronic total occlusion without viable myocardium documentation']}),
    review_triggers: JSON.stringify({conditions: ['Multi-vessel intervention','Prior CABG','Drug-eluting vs bare-metal stent decision','Bifurcation lesion','Left main PCI']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxPerYear: 3}),
    conservative_treatment_required: true,
    conservative_treatment_details: JSON.stringify({minDuration: 'Optimal medical therapy attempted', treatments: ['Antianginal medications','Statin therapy','Antiplatelet therapy','Lifestyle modifications']}),
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/ncd.aspx?NCDId=20.7',
    last_reviewed: '2025-04-28'
  },
  {
    policy_id: 'LCD-041', policy_type: 'LCD', title: 'Physical Rehabilitation - Therapeutic Activities',
    procedure_codes: ['97530','97533','97535','97542'], diagnosis_codes: ['I63.9','S06.0X0A','G81.90','I69.351','G80.9'],
    effective_date: '2024-01-01', termination_date: null,
    medical_necessity_criteria: JSON.stringify(['Documented functional deficit requiring skilled rehabilitation','Recent neurological event (stroke, TBI) within 6 months','Measurable rehabilitation goals with expected functional improvement','Physician order for rehabilitation services']),
    required_documentation: JSON.stringify(['Physician referral with rehabilitation prescription','Functional assessment (FIM score or equivalent)','Rehabilitation treatment plan with goals','Progress notes documenting functional gains','Discharge planning documentation']),
    approval_conditions: JSON.stringify({autoApprove: true, conditions: ['Post-stroke rehabilitation within 90 days of event','Post-TBI rehabilitation with documented deficits']}),
    denial_conditions: JSON.stringify({conditions: ['No measurable functional improvement over 30 days','Maintenance therapy without skilled need','No physician order','Event occurred more than 12 months ago without ongoing deficits']}),
    review_triggers: JSON.stringify({conditions: ['Request exceeds 60 sessions','Treatment beyond 6 months post-event','Multiple concurrent rehabilitation disciplines','Readmission for same condition']}),
    age_restrictions: null, gender_restrictions: null,
    frequency_limits: JSON.stringify({maxSessionsPerYear: 60, requiresReEvalEvery: 10}),
    conservative_treatment_required: false, conservative_treatment_details: null,
    source_url: 'https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=41',
    last_reviewed: '2025-05-30'
  },
];

// ============================================================================
// CLAIMS (~5 per member = 75 total)
// ============================================================================
// [member_id, claim_id, service_date, provider, npi, facility, cpt, cpt_desc, icd10s, billed, allowed, paid, patient_resp, status, denial_reason, service_type, place, auth_num]
function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function generateClaims() {
  const c = [];
  let claimNum = 1;
  const cid = () => `CLM-2025-${String(claimNum++).padStart(5,'0')}`;

  // MEM-100001 (John Doe - cardiac history for ECG)
  c.push(['MEM-100001',cid(),daysAgo(180),'Dr. Robert Chen','1234567001','Hartford Cardiology Associates','99213','Office visit - established patient',['I50.9','E11.9'],185,165,132,33,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100001',cid(),daysAgo(150),'Dr. Robert Chen','1234567001','Hartford Cardiology Associates','93306','Echocardiogram complete',['I50.9'],850,780,624,156,'paid',null,'outpatient','Office','AUTH-001']);
  c.push(['MEM-100001',cid(),daysAgo(120),'Hartford Hospital Lab','1234567101','Hartford Hospital','80053','Comprehensive metabolic panel',['E11.9'],245,220,176,44,'paid',null,'outpatient','Lab',null]);
  c.push(['MEM-100001',cid(),daysAgo(90),'Dr. Robert Chen','1234567001','Hartford Cardiology Associates','93000','Electrocardiogram routine',['I50.9','I10'],125,110,88,22,'paid',null,'outpatient','Office','AUTH-002']);
  c.push(['MEM-100001',cid(),daysAgo(45),'Dr. Robert Chen','1234567001','Hartford Cardiology Associates','99214','Office visit - detailed',['I50.9','E11.9'],250,225,180,45,'paid',null,'outpatient','Office',null]);

  // MEM-100002 (Jane Smith - neurology for MRI Brain)
  c.push(['MEM-100002',cid(),daysAgo(200),'Dr. Linda Park','1234567002','Boston Neurology Center','99213','Office visit - established',['G43.909'],185,155,108.50,46.50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100002',cid(),daysAgo(160),'Boston Medical ER','1234567102','Boston Medical Center','99283','ER visit - moderate',['G43.909','R51.9'],650,580,406,174,'paid',null,'outpatient','ER',null]);
  c.push(['MEM-100002',cid(),daysAgo(120),'Dr. Linda Park','1234567002','Boston Neurology Center','70450','CT Head without contrast',['R51.9'],520,480,336,144,'paid',null,'outpatient','Office','AUTH-003']);
  c.push(['MEM-100002',cid(),daysAgo(60),'Dr. Linda Park','1234567002','Boston Neurology Center','99214','Office visit - detailed',['G43.909'],250,210,147,63,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100002',cid(),daysAgo(30),'Walgreens Pharmacy','1234567202','N/A','99070','Sumatriptan prescription',['G43.909'],85,85,59.50,25.50,'paid',null,'professional','Pharmacy',null]);

  // MEM-100003 (Robert Johnson - PT for back pain)
  c.push(['MEM-100003',cid(),daysAgo(240),'Dr. James Wright','1234567003','New Haven Primary Care','99213','Office visit',['M54.5'],185,145,116,29,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100003',cid(),daysAgo(210),'CT Imaging Center','1234567103','CT Imaging Center','72100','Lumbar spine X-ray 2 views',['M54.5'],340,300,240,60,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100003',cid(),daysAgo(180),'Dr. James Wright','1234567003','New Haven Primary Care','99214','Office visit - pain management',['M54.5','M79.3'],250,200,160,40,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100003',cid(),daysAgo(120),'New Haven Chiro','1234567303','New Haven Chiropractic','98940','Chiropractic manipulation',['M54.5'],85,70,56,14,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100003',cid(),daysAgo(90),'New Haven Chiro','1234567303','New Haven Chiropractic','98940','Chiropractic manipulation',['M54.5'],85,70,56,14,'paid',null,'outpatient','Office',null]);

  // MEM-100004 (Maria Garcia - TKA for knee OA)
  c.push(['MEM-100004',cid(),daysAgo(365),'Dr. Anita Patel','1234567004','Springfield Medical Group','99213','Office visit',['M17.11'],185,165,132,33,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100004',cid(),daysAgo(300),'Springfield Ortho','1234567104','Springfield Orthopedic Center','73565','Knee X-ray weight bearing',['M17.11'],280,250,200,50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100004',cid(),daysAgo(240),'Springfield PT','1234567204','Springfield Physical Therapy','97110','PT therapeutic exercise',['M17.11'],175,155,124,31,'paid',null,'outpatient','Office','AUTH-004']);
  c.push(['MEM-100004',cid(),daysAgo(180),'Springfield Ortho','1234567104','Springfield Orthopedic Center','20610','Knee injection corticosteroid',['M17.11'],320,290,232,58,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100004',cid(),daysAgo(120),'Springfield Ortho','1234567104','Springfield Orthopedic Center','99214','Orthopedic follow-up',['M17.11','M17.12'],250,225,180,45,'paid',null,'outpatient','Office',null]);

  // MEM-100005 (James Wilson - cardiac cath)
  c.push(['MEM-100005',cid(),daysAgo(300),'Dr. Michael Torres','1234567005','Providence Heart Center','99214','Office visit - cardiology',['I25.10'],250,240,204,36,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100005',cid(),daysAgo(240),'Providence Heart Center','1234567105','Providence Heart Center','93015','Treadmill stress test',['I25.10','R07.9'],450,430,365.50,64.50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100005',cid(),daysAgo(180),'Providence Heart Center','1234567105','Providence Heart Center','78452','Nuclear cardiac imaging',['I25.10'],1200,1150,977.50,172.50,'paid',null,'outpatient','Office','AUTH-005']);
  c.push(['MEM-100005',cid(),daysAgo(120),'Dr. Michael Torres','1234567005','Providence Heart Center','93000','ECG routine',['I25.10','I10'],125,120,102,18,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100005',cid(),daysAgo(60),'Dr. Michael Torres','1234567005','Providence Heart Center','99215','Office visit - comprehensive',['I25.10','I20.0'],375,360,306,54,'paid',null,'outpatient','Office',null]);

  // MEM-100006 (Sarah Davis - colonoscopy)
  c.push(['MEM-100006',cid(),daysAgo(180),'Dr. Karen Liu','1234567006','Stamford GI Associates','99213','Office visit',['K63.5'],185,165,132,33,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100006',cid(),daysAgo(150),'Stamford Lab','1234567106','Stamford Hospital Lab','82270','Fecal occult blood test',['Z12.11'],35,30,24,6,'paid',null,'outpatient','Lab',null]);
  c.push(['MEM-100006',cid(),daysAgo(120),'Dr. Karen Liu','1234567006','Stamford GI Associates','99214','GI consultation',['K63.5','Z12.11'],250,225,180,45,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100006',cid(),daysAgo(90),'Stamford Hospital','1234567106','Stamford Hospital','80053','Pre-procedure labs',['K63.5'],245,220,176,44,'paid',null,'outpatient','Lab',null]);
  c.push(['MEM-100006',cid(),daysAgo(60),'Dr. Karen Liu','1234567006','Stamford GI Associates','99213','Follow-up visit',['K63.5'],185,165,132,33,'paid',null,'outpatient','Office',null]);

  // MEM-100007 (Michael Brown - lumbar fusion - will be denied)
  c.push(['MEM-100007',cid(),daysAgo(360),'Dr. Steven Grant','1234567007','Worcester Spine Center','99214','Office visit - spine',['M43.16','M54.5'],250,210,147,63,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100007',cid(),daysAgo(300),'Worcester Imaging','1234567107','Worcester MRI Center','72148','MRI lumbar spine',['M43.16'],1400,1200,840,360,'paid',null,'outpatient','Office','AUTH-006']);
  c.push(['MEM-100007',cid(),daysAgo(240),'Worcester Spine Center','1234567007','Worcester Spine Center','62322','Epidural injection lumbar',['M43.16','M54.5'],890,780,546,234,'paid',null,'outpatient','ASC',null]);
  c.push(['MEM-100007',cid(),daysAgo(180),'Worcester PT','1234567207','Worcester Physical Therapy','97110','PT therapeutic exercise',['M54.5'],175,150,105,45,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100007',cid(),daysAgo(90),'Worcester Spine Center','1234567007','Worcester Spine Center','62322','Epidural injection repeat',['M43.16'],890,780,546,234,'denied','Less than 6 months conservative treatment documented','outpatient','ASC',null]);

  // MEM-100008 (Emily Taylor - CT Abdomen)
  c.push(['MEM-100008',cid(),daysAgo(150),'Dr. Nancy Kim','1234567008','Bridgeport Medical Associates','99213','Office visit',['R10.9'],185,145,116,29,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100008',cid(),daysAgo(120),'Bridgeport Hospital Lab','1234567108','Bridgeport Hospital','80053','Comprehensive metabolic panel',['R10.9'],245,220,176,44,'paid',null,'outpatient','Lab',null]);
  c.push(['MEM-100008',cid(),daysAgo(90),'Bridgeport Hospital Lab','1234567108','Bridgeport Hospital','85025','CBC with differential',['R10.9'],65,55,44,11,'paid',null,'outpatient','Lab',null]);
  c.push(['MEM-100008',cid(),daysAgo(60),'Bridgeport ER','1234567108','Bridgeport Hospital ER','99283','ER visit - moderate',['R10.9','K80.20'],650,575,460,115,'paid',null,'outpatient','ER',null]);
  c.push(['MEM-100008',cid(),daysAgo(30),'Bridgeport Hospital','1234567108','Bridgeport Hospital','76700','Abdominal ultrasound',['K80.20'],420,380,304,76,'paid',null,'outpatient','Office',null]);

  // MEM-100009 (David Anderson - shoulder arthroscopy)
  c.push(['MEM-100009',cid(),daysAgo(240),'Dr. Paul Reeves','1234567009','Waterbury Ortho Center','99213','Office visit',['M75.120'],185,165,132,33,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100009',cid(),daysAgo(200),'Waterbury Imaging','1234567109','Waterbury MRI Center','73221','MRI shoulder without contrast',['M75.120'],950,870,696,174,'paid',null,'outpatient','Office','AUTH-007']);
  c.push(['MEM-100009',cid(),daysAgo(150),'Waterbury PT','1234567209','Waterbury Physical Therapy','97110','PT therapeutic exercise',['M75.120'],175,155,124,31,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100009',cid(),daysAgo(120),'Waterbury Ortho Center','1234567009','Waterbury Ortho Center','20610','Shoulder injection corticosteroid',['M75.120'],320,290,232,58,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100009',cid(),daysAgo(60),'Dr. Paul Reeves','1234567009','Waterbury Ortho Center','99214','Orthopedic follow-up',['M75.120','M75.100'],250,225,180,45,'paid',null,'outpatient','Office',null]);

  // MEM-100010 (Lisa Martinez - chemo)
  c.push(['MEM-100010',cid(),daysAgo(300),'Dr. Grace Huang','1234567010','CT Oncology Center','99205','New patient comprehensive',['C50.911'],450,430,365.50,64.50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100010',cid(),daysAgo(270),'CT Oncology Center','1234567110','CT Oncology Center','88305','Pathology surgical biopsy',['C50.911'],380,360,306,54,'paid',null,'outpatient','Lab',null]);
  c.push(['MEM-100010',cid(),daysAgo(240),'CT Oncology Center','1234567110','CT Oncology Center','77063','Breast MRI screening',['C50.911'],850,810,688.50,121.50,'paid',null,'outpatient','Office','AUTH-008']);
  c.push(['MEM-100010',cid(),daysAgo(180),'CT Oncology Center','1234567110','CT Oncology Center','96413','Chemo admin IV first hour',['C50.911'],2400,2300,1955,345,'paid',null,'outpatient','Infusion Center','AUTH-009']);
  c.push(['MEM-100010',cid(),daysAgo(150),'CT Oncology Center','1234567110','CT Oncology Center','96413','Chemo admin cycle 2',['C50.911'],2400,2300,1955,345,'paid',null,'outpatient','Infusion Center','AUTH-009']);

  // MEM-100011 (Thomas White - sleep study - will be denied)
  c.push(['MEM-100011',cid(),daysAgo(180),'Dr. Mark Evans','1234567011','Danbury Sleep Center','99213','Office visit',['G47.33'],185,155,108.50,46.50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100011',cid(),daysAgo(150),'Danbury Sleep Center','1234567111','Danbury Sleep Center','99214','Sleep medicine consult',['G47.33','R06.83'],250,210,147,63,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100011',cid(),daysAgo(120),'Danbury Sleep Center','1234567111','Danbury Sleep Center','95800','Home sleep test',['G47.33'],480,420,294,126,'denied','Incomplete study - insufficient data','outpatient','Home',null]);
  c.push(['MEM-100011',cid(),daysAgo(90),'Dr. Mark Evans','1234567011','Danbury Sleep Center','99213','Follow-up office visit',['G47.33'],185,155,108.50,46.50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100011',cid(),daysAgo(45),'Danbury Pharmacy','1234567211','N/A','99070','Modafinil prescription',['G47.33'],120,120,84,36,'paid',null,'professional','Pharmacy',null]);

  // MEM-100012 (Jennifer Lee - breast biopsy)
  c.push(['MEM-100012',cid(),daysAgo(180),'Dr. Susan Cho','1234567012','Norwalk Breast Center','77067','Screening mammogram bilateral',['Z12.31'],320,290,232,58,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100012',cid(),daysAgo(150),'Norwalk Breast Center','1234567112','Norwalk Breast Center','77066','Diagnostic mammogram bilateral',['R92.1','N63.0'],420,380,304,76,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100012',cid(),daysAgo(120),'Norwalk Breast Center','1234567112','Norwalk Breast Center','76642','Breast ultrasound',['N63.0'],350,310,248,62,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100012',cid(),daysAgo(90),'Dr. Susan Cho','1234567012','Norwalk Breast Center','99214','Clinical breast exam follow-up',['N63.0','R92.1'],250,225,180,45,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100012',cid(),daysAgo(60),'Norwalk Breast Center','1234567112','Norwalk Breast Center','99213','Pre-biopsy consultation',['N63.0'],185,165,132,33,'paid',null,'outpatient','Office',null]);

  // MEM-100013 (Christopher Clark - CPAP)
  c.push(['MEM-100013',cid(),daysAgo(240),'Dr. Richard Gomez','1234567013','Meriden Medical Associates','99213','Office visit',['G47.33','E66.01'],185,145,116,29,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100013',cid(),daysAgo(200),'Meriden Sleep Lab','1234567113','Meriden Sleep Lab','95810','Polysomnography diagnostic',['G47.33'],1800,1600,1280,320,'paid',null,'outpatient','Sleep Lab','AUTH-010']);
  c.push(['MEM-100013',cid(),daysAgo(150),'Dr. Richard Gomez','1234567013','Meriden Medical Associates','99214','Sleep study results review',['G47.33'],250,200,160,40,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100013',cid(),daysAgo(120),'Meriden DME','1234567213','Meriden DME Supply','E0601','CPAP device trial',['G47.33'],450,400,320,80,'denied','Prior auth required for DME equipment','professional','DME',null]);
  c.push(['MEM-100013',cid(),daysAgo(60),'Dr. Richard Gomez','1234567013','Meriden Medical Associates','99213','CPAP follow-up visit',['G47.33'],185,145,116,29,'paid',null,'outpatient','Office',null]);

  // MEM-100014 (Amanda Harris - coronary stent)
  c.push(['MEM-100014',cid(),daysAgo(365),'Dr. Helen Wu','1234567014','Milford Cardiology','99214','Cardiology consultation',['I25.10','I10'],250,240,204,36,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100014',cid(),daysAgo(300),'Milford Cardiology','1234567114','Milford Cardiology Center','93015','Treadmill stress test',['I25.10'],450,430,365.50,64.50,'paid',null,'outpatient','Office',null]);
  c.push(['MEM-100014',cid(),daysAgo(240),'Milford Cardiology','1234567114','Milford Cardiology Center','78452','Myocardial perfusion imaging',['I25.10'],1200,1150,977.50,172.50,'paid',null,'outpatient','Office','AUTH-011']);
  c.push(['MEM-100014',cid(),daysAgo(180),'Milford Hospital','1234567114','Milford Hospital','93458','Cardiac catheterization',['I25.10','I25.110'],3800,3600,3060,540,'paid',null,'inpatient','Hospital','AUTH-012']);
  c.push(['MEM-100014',cid(),daysAgo(90),'Dr. Helen Wu','1234567014','Milford Cardiology','99215','Comprehensive follow-up',['I25.10','I25.110'],375,360,306,54,'paid',null,'outpatient','Office',null]);

  // MEM-100015 (Daniel Moore - physical rehab)
  c.push(['MEM-100015',cid(),daysAgo(120),'Shelton Hospital ER','1234567115','Shelton Hospital','99285','ER visit - critical',['I63.9'],1200,1050,735,315,'paid',null,'inpatient','ER',null]);
  c.push(['MEM-100015',cid(),daysAgo(110),'Shelton Hospital','1234567115','Shelton Hospital','99223','Hospital admission',['I63.9','G81.90'],580,510,357,153,'paid',null,'inpatient','Hospital',null]);
  c.push(['MEM-100015',cid(),daysAgo(100),'Shelton Hospital','1234567115','Shelton Hospital','70553','MRI Brain with contrast',['I63.9'],1800,1600,1120,480,'paid',null,'inpatient','Hospital','AUTH-013']);
  c.push(['MEM-100015',cid(),daysAgo(90),'Shelton Rehab','1234567215','Shelton Rehabilitation Center','97530','Therapeutic activities',['I63.9','G81.90'],200,175,122.50,52.50,'paid',null,'outpatient','Rehab','AUTH-014']);
  c.push(['MEM-100015',cid(),daysAgo(60),'Dr. Brian Foster','1234567015','Shelton Neurology','99214','Neurology follow-up',['I63.9'],250,210,147,63,'paid',null,'outpatient','Office',null]);

  return c;
}

// ============================================================================
// PRIOR AUTH REQUESTS (15 records)
// ============================================================================
const requests = [
  ['PA-2026-0412','John Doe','1975-03-15','MEM-100001','St. Mary\'s Hospital','1234567001','Electrocardiogram - 12 Lead','93000',['I50.9','E11.9'],'2026-02-04 10:23:00','processing','high','Dr. Sarah Johnson','/documents/PA-2026-0412.pdf',null,null],
  ['PA-2026-0411','Jane Smith','1982-07-22','MEM-100002','City Medical Center','0987654321','MRI Brain without and with Contrast','70553',['G43.909','R51.9'],'2026-02-04 09:15:00','pending','high',null,'/documents/PA-2026-0411.pdf',null,null],
  ['PA-2026-0410','Robert Johnson','1990-11-05','MEM-100003','Valley Healthcare','5678901234','Physical Therapy - Therapeutic Exercise','97110',['M54.5','M79.3'],'2026-02-03 14:30:00','approved','medium',null,'/documents/PA-2026-0410.pdf','Approved: All medical necessity criteria met. Conservative treatment documented. PT referral with measurable goals established.','2026-02-03 14:45:00'],
  ['PA-2026-0409','Maria Garcia','1968-04-10','MEM-100004','Springfield Orthopedic Center','1234567104','Total Knee Arthroplasty - Right','27447',['M17.11'],'2026-02-03 11:00:00','approved','high',null,'/documents/PA-2026-0409.pdf','Approved: Radiographic evidence of Grade 4 OA confirmed. Conservative treatment documented over 8 months including PT, injections, and NSAIDs. All criteria met per NCD-150.4.','2026-02-03 11:20:00'],
  ['PA-2026-0408','James Wilson','1955-09-28','MEM-100005','Providence Heart Center','1234567105','Cardiac Catheterization - Left Heart','93458',['I25.10','I20.0','R07.9'],'2026-02-02 16:45:00','review','high','Dr. Sarah Johnson','/documents/PA-2026-0408.pdf','Review required: Patient age >80. Prior nuclear imaging shows ischemia but multi-vessel disease suspected. Peer-to-peer review recommended.','2026-02-02 17:10:00'],
  ['PA-2026-0407','Sarah Davis','1978-12-03','MEM-100006','Stamford GI Associates','1234567006','Screening Colonoscopy with Polypectomy','45380',['K63.5','Z12.11'],'2026-02-02 13:20:00','approved','medium',null,'/documents/PA-2026-0407.pdf','Approved: Age 47, positive FOBT result documented. Screening interval met (no prior colonoscopy). All criteria per NCD-210.3 satisfied.','2026-02-02 13:40:00'],
  ['PA-2026-0406','Michael Brown','1965-06-17','MEM-100007','Worcester Spine Center','1234567007','Lumbar Spinal Fusion L4-L5','22612',['M43.16','M51.16'],'2026-02-02 09:00:00','denied','high',null,'/documents/PA-2026-0406.pdf','Denied: Conservative treatment documentation insufficient. Only 4 months PT documented (6 months required per LCD-056). No psychological evaluation on file. Recommend completing conservative treatment program.','2026-02-02 09:25:00'],
  ['PA-2026-0405','Emily Taylor','1988-01-25','MEM-100008','Bridgeport Hospital','1234567108','CT Abdomen and Pelvis with Contrast','74178',['R10.9','K80.20'],'2026-02-01 15:30:00','approved','medium',null,'/documents/PA-2026-0405.pdf','Approved: Acute presentation with ER visit documented. Ultrasound shows gallstones with symptoms. CT indicated for surgical planning per LCD-089.','2026-02-01 15:50:00'],
  ['PA-2026-0404','David Anderson','1972-08-14','MEM-100009','Waterbury Orthopedic Center','1234567009','Shoulder Arthroscopy - Rotator Cuff Repair','29827',['M75.120','M75.100'],'2026-02-01 11:15:00','processing','medium','Nurse Emily Chen','/documents/PA-2026-0404.pdf',null,null],
  ['PA-2026-0403','Lisa Martinez','1960-05-20','MEM-100010','CT Oncology Center','1234567110','Chemotherapy Administration - IV Infusion','96413',['C50.911'],'2026-01-31 10:00:00','approved','high',null,'/documents/PA-2026-0403.pdf','Approved: Pathology-confirmed invasive ductal carcinoma. NCCN-concordant AC-T regimen. ECOG 1. All baseline labs within acceptable range. Tumor board recommendation documented.','2026-01-31 10:30:00'],
  ['PA-2026-0402','Thomas White','1985-10-09','MEM-100011','Danbury Sleep Center','1234567111','Polysomnography - In-Lab Sleep Study','95811',['G47.33','R06.83'],'2026-01-31 08:30:00','denied','medium',null,'/documents/PA-2026-0402.pdf','Denied: No sleep study consultation documented per LCD-067 requirements. Home sleep test was incomplete. Epworth Sleepiness Scale not documented. Recommend sleep medicine consultation and ESS assessment.','2026-01-31 08:55:00'],
  ['PA-2026-0401','Jennifer Lee','1976-02-28','MEM-100012','Norwalk Breast Center','1234567112','Stereotactic Breast Biopsy','19083',['N63.0','R92.1'],'2026-01-30 14:00:00','approved','high',null,'/documents/PA-2026-0401.pdf','Approved: BI-RADS 4C classification on diagnostic mammogram. Ultrasound confirms suspicious 1.2cm mass. Radiologist recommendation for biopsy. All criteria per LCD-023 met.','2026-01-30 14:20:00'],
  ['PA-2026-0400','Christopher Clark','1958-11-12','MEM-100013','Meriden DME Supply','1234567213','CPAP Device - Continuous Positive Airway Pressure','E0601',['G47.33'],'2026-01-30 10:45:00','pending','medium',null,'/documents/PA-2026-0400.pdf',null,null],
  ['PA-2026-0399','Amanda Harris','1970-07-04','MEM-100014','Milford Cardiology Center','1234567114','Percutaneous Coronary Intervention with Stent','92928',['I25.10','I25.110'],'2026-01-29 16:00:00','review','high','Dr. Sarah Johnson','/documents/PA-2026-0399.pdf','Review required: Multi-vessel disease documented on catheterization. PCI vs CABG decision requires heart team review. Prior stress test positive. Peer review recommended.','2026-01-29 16:30:00'],
  ['PA-2026-0398','Daniel Moore','1992-03-30','MEM-100015','Shelton Rehabilitation Center','1234567215','Physical Rehabilitation - Therapeutic Activities','97530',['I63.9','G81.90'],'2026-01-29 09:30:00','pending','high',null,'/documents/PA-2026-0398.pdf',null,null],
];

// ============================================================================
// WORKFLOW STEP GENERATOR
// ============================================================================
const WORKFLOW_TEMPLATE = [
  { name: 'Prior Auth Sensing Agent', desc: 'Sensing agent detects and classifies incoming request', tool: null },
  { name: 'Planning Agent', desc: 'Planning agent analyzes request complexity and creates execution plan', tool: null },
  { name: 'Orchestrator Activation', desc: 'Orchestrator agent sequences tool execution', tool: null },
  { name: 'Intelligent Document Processing', desc: 'IDP tool extracts text, entities, and form fields from clinical PDF', tool: 'intelligent-document-processing' },
  { name: 'Clinical Data Extraction', desc: 'NLP extraction of patient demographics, procedure/diagnosis codes, and clinical findings', tool: 'clinical-data-extraction' },
  { name: 'Member Eligibility Verification', desc: 'Verify member eligibility, coverage status, and benefits from Member 360', tool: 'member-eligibility-lookup' },
  { name: 'Claims History Analysis', desc: 'Retrieve and analyze member claims history and utilization patterns', tool: 'claims-history-retrieval' },
  { name: 'NCD/LCD Guidelines Search', desc: 'Search coverage policies matching procedure and diagnosis codes', tool: 'ncd-guidelines-search' },
  { name: 'Policy Criteria Matching', desc: 'Evaluate clinical evidence against policy criteria for decision recommendation', tool: 'policy-criteria-matching' },
];

function generateWorkflowSteps(requestId, status) {
  const steps = [];
  const baseTime = new Date('2026-02-04T10:23:14');

  for (let i = 0; i < WORKFLOW_TEMPLATE.length; i++) {
    const t = WORKFLOW_TEMPLATE[i];
    const stepTime = new Date(baseTime.getTime() + i * 4000);
    const ts = stepTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    let stepStatus;
    if (status === 'pending') continue; // no steps for pending
    if (status === 'processing') {
      if (i <= 5) stepStatus = 'completed';
      else if (i === 6) stepStatus = 'in-progress';
      else stepStatus = 'pending';
    } else {
      stepStatus = 'completed';
    }

    const details = generateStepDetails(t.name, stepStatus, status);
    steps.push([requestId, i + 1, t.name, t.desc, stepStatus, stepStatus !== 'pending' ? ts : null, JSON.stringify(details), t.tool, 800 + Math.floor(Math.random() * 600)]);
  }
  return steps;
}

function generateStepDetails(stepName, stepStatus, requestStatus) {
  if (stepStatus === 'pending') return [];
  const detailsMap = {
    'Prior Auth Sensing Agent': ['New request detected and classified','Document metadata extracted','Request priority assessed','Planning agent invoked'],
    'Planning Agent': ['Request complexity analyzed','Workflow plan created','Required tools identified: IDP, Member360, Claims, NCD Search, Policy Match','Orchestrator invoked with execution plan'],
    'Orchestrator Activation': ['Tool chain initialized','IDP tool triggered first','Parallel data queries queued','Execution sequence: IDP → Extraction → Eligibility + Claims → Search → Match'],
    'Intelligent Document Processing': ['PDF parsed successfully (3 pages)','Text extraction completed with 94% confidence','47 entities recognized','Form fields identified and structured'],
    'Clinical Data Extraction': ['Patient demographics extracted','Procedure codes identified and validated','Diagnosis codes parsed and confirmed','Clinical findings structured from SOAP notes'],
    'Member Eligibility Verification': ['Member ID verified in Member 360','Coverage status: Active','Benefits confirmed - pre-auth required','No eligibility issues detected'],
    'Claims History Analysis': ['Claims data retrieved for past 12 months','Related procedures identified','Utilization patterns analyzed','Historical approval rate computed'],
    'NCD/LCD Guidelines Search': ['Coverage policies searched by procedure code','Matching policy found with relevance score','Medical necessity criteria retrieved','Required documentation checklist loaded'],
    'Policy Criteria Matching': requestStatus === 'denied'
      ? ['Clinical evidence evaluated against policy criteria','Critical criteria unmet identified','Denial conditions triggered','Decision: DENY with rationale documented']
      : requestStatus === 'review'
      ? ['Clinical evidence evaluated against policy criteria','Review triggers detected','Additional documentation may be needed','Decision: REVIEW recommended for peer evaluation']
      : ['Clinical evidence evaluated against policy criteria','All medical necessity criteria verified','Required documentation confirmed complete','Decision: APPROVE with confidence 0.95'],
  };
  const d = detailsMap[stepName] || [];
  return stepStatus === 'in-progress' ? d.slice(0, 2) : d;
}

// ============================================================================
// TRACE LOG GENERATOR
// ============================================================================
function generateTraceLogs(requestId, status) {
  if (status === 'pending') return [];
  const logs = [];
  const baseTime = new Date('2026-02-04T10:23:13.987');
  let logIdx = 0;
  const ts = (offsetMs) => {
    const t = new Date(baseTime.getTime() + offsetMs);
    return `${t.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit',hour12:false})}:${String(t.getSeconds()).padStart(2,'0')}.${String(t.getMilliseconds()).padStart(3,'0')}`;
  };

  const push = (offset, level, category, message, details) => {
    logs.push([requestId, ts(offset), level, category, message, JSON.stringify(details)]);
  };

  push(0,'info','Sensing Agent','Prior Auth Sensing Agent activated',{agent:'PriorAuthSensingAgent-v2',trigger:'Document upload event'});
  push(250,'success','Sensing Agent',`New prior authorization request detected`,{requestId,priority:'assessed',nextStep:'Invoke Planning Agent'});
  push(580,'info','Planning Agent','Planning Agent invoked by Sensing Agent',{agent:'WorkflowPlanningAgent-v3',mode:'intelligent-planning'});
  push(900,'success','Planning Agent','Execution plan created successfully',{workflowSteps:9,toolsRequired:['IDP','ClinicalExtraction','Member360','Claims','NCDSearch','PolicyMatch'],estimatedDuration:'45 seconds'});
  push(1140,'info','Orchestrator','Orchestrator activated by Planning Agent',{orchestrator:'ToolOrchestrator-v2',executionPlan:'sequential-with-parallel'});

  if (status === 'processing' || status === 'approved' || status === 'denied' || status === 'review') {
    push(2140,'info','IDP Service',`Intelligent Document Processing tool invoked`,{tool:'IDP-v3.2',documentId:`${requestId}.pdf`,processingMode:'structured-extraction'});
    push(3470,'success','IDP Service','Document analysis completed successfully',{pagesProcessed:3,entitiesExtracted:47,confidence:0.94,processingTime:'1.3s'});
    push(4800,'info','Data Extraction','Clinical data extraction tool invoked',{tool:'ClinicalNER-v4.1',extractionType:'all'});
    push(6130,'success','Data Extraction','Clinical entities extracted and validated',{procedureCodes:1,diagnosisCodes:2,patientFields:7});
    push(8460,'info','Member 360','Member eligibility lookup tool invoked',{memberId:requestId.replace('PA-2026-','MEM-100'),dataProduct:'Member360-API-v2'});
    push(9790,'success','Member 360','Member eligibility verified',{status:'Active',planType:'HMO/PPO',coverageLevel:'Active'});
  }

  if (status === 'approved' || status === 'denied' || status === 'review') {
    push(12120,'info','Claims API','Claims history retrieval tool invoked',{tool:'ClaimsHistory-API-v3',lookbackPeriod:'12 months'});
    push(13450,'success','Claims API','Claims history retrieved successfully',{totalClaims:5,relatedProcedures:2});
    push(16780,'info','NCD Search','NCD/LCD guidelines search tool invoked',{tool:'PolicySearch-v2.1'});
    push(18110,'success','NCD Search','Coverage policy matched',{matchedPolicies:1,topRelevanceScore:90});
    push(20440,'info','Policy Match','Policy criteria matching tool invoked',{tool:'PolicyMatcher-v3.0'});

    if (status === 'approved') {
      push(22770,'success','Policy Match',`Decision: APPROVED - All criteria met`,{decision:'approve',confidence:0.95});
    } else if (status === 'denied') {
      push(22770,'warning','Policy Match',`Decision: DENIED - Criteria not met`,{decision:'deny',confidence:0.82});
    } else {
      push(22770,'warning','Policy Match',`Decision: REVIEW - Additional evaluation needed`,{decision:'review',confidence:0.65});
    }
  }

  return logs;
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function insertRow(table, cols, values) {
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  await query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, values);
}

export async function seed() {
  console.log('Seeding database...\n');

  // 1. Members
  console.log('  Inserting 15 members...');
  const mCols = memberCols;
  for (const m of members) {
    await insertRow('members', mCols, m);
  }

  // 2. Coverage Policies
  console.log('  Inserting 15 coverage policies...');
  for (const p of policies) {
    const cols = Object.keys(p).join(', ');
    const vals = Object.values(p);
    const placeholders = vals.map((_, i) => {
      const key = Object.keys(p)[i];
      if (key === 'procedure_codes' || key === 'diagnosis_codes') return `$${i + 1}::text[]`;
      return `$${i + 1}`;
    }).join(', ');
    await query(`INSERT INTO coverage_policies (${cols}) VALUES (${placeholders})`, vals);
  }

  // 3. Claims
  console.log('  Inserting claims...');
  const claims = generateClaims();
  const claimCols = 'member_id,claim_id,service_date,provider_name,provider_npi,facility_name,cpt_code,cpt_description,icd10_codes,billed_amount,allowed_amount,paid_amount,patient_responsibility,claim_status,denial_reason,service_type,place_of_service,auth_number';
  for (const c of claims) {
    await insertRow('claims', claimCols, c);
  }
  console.log(`  ${claims.length} claims inserted.`);

  // 4. Prior Auth Requests
  console.log('  Inserting 15 prior auth requests...');
  const rCols = 'request_id,patient_name,patient_dob,member_id,provider,provider_npi,procedure_name,procedure_code,diagnosis_codes,submitted_date,status,priority,assigned_to,document_url,decision_rationale,decision_date';
  for (const r of requests) {
    await insertRow('prior_auth_requests', rCols, r);
  }

  // 5. Workflow Steps (for non-pending requests)
  console.log('  Generating workflow steps...');
  let stepCount = 0;
  const wCols = 'request_id,step_number,name,description,status,timestamp,details,tool_name,duration_ms';
  for (const r of requests) {
    const [requestId, , , , , , , , , , status] = r;
    const steps = generateWorkflowSteps(requestId, status);
    for (const s of steps) {
      await insertRow('workflow_steps', wCols, s);
      stepCount++;
    }
  }
  console.log(`  ${stepCount} workflow steps inserted.`);

  // 6. Trace Logs (for non-pending requests)
  console.log('  Generating trace logs...');
  let traceCount = 0;
  const tCols = 'request_id,timestamp,level,category,message,details';
  for (const r of requests) {
    const [requestId, , , , , , , , , , status] = r;
    const logs = generateTraceLogs(requestId, status);
    for (const l of logs) {
      await insertRow('trace_logs', tCols, l);
      traceCount++;
    }
  }
  console.log(`  ${traceCount} trace logs inserted.`);

  console.log('\nSeeding complete!');
}
