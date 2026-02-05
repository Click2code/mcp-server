/**
 * Clinical PDF Document Generator
 *
 * Generates realistic clinical PDF documents for each prior auth request
 * using PDFKit. Each document contains provider info, patient demographics,
 * clinical notes, and supporting evidence.
 */

import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DOCUMENTS = [
  {
    requestId: 'PA-2026-0412', patient: 'John Doe', dob: '03/15/1975', memberId: 'MEM-100001',
    provider: 'St. Mary\'s Hospital', providerNpi: '1234567001',
    procedure: 'Electrocardiogram - 12 Lead (CPT 93000)',
    diagnoses: ['I50.9 - Heart failure, unspecified', 'E11.9 - Type 2 diabetes mellitus'],
    clinicalNotes: `CHIEF COMPLAINT: Chest discomfort and palpitations x 2 weeks.

HISTORY OF PRESENT ILLNESS: Mr. Doe is a 50-year-old male with a history of CHF (EF 40%) and type 2 diabetes presenting with intermittent chest discomfort and palpitations. Patient reports episodes of heart racing lasting 5-10 minutes occurring 2-3 times daily. Denies syncope. Reports increased shortness of breath with exertion (2-flight stairs). Current medications include lisinopril 20mg, metformin 1000mg BID, and carvedilol 12.5mg BID.

PHYSICAL EXAMINATION:
- Vitals: BP 138/82, HR 88 irregular, RR 18, SpO2 96% on RA
- Cardiovascular: Irregular rhythm, S3 gallop noted, no murmurs
- Lungs: Bibasilar crackles, no wheezing
- Extremities: 1+ bilateral lower extremity edema

ASSESSMENT: Suspected new-onset atrial fibrillation in the setting of known CHF. ECG indicated to evaluate rhythm, interval changes, and ischemic changes.

PLAN: Order 12-lead ECG. If AF confirmed, consider anticoagulation. Cardiology follow-up in 1 week.`,
    labResults: 'BNP: 580 pg/mL (elevated)\nTroponin I: <0.04 ng/mL (normal)\nHbA1c: 7.8%\nBMP: Na 138, K 4.2, Cr 1.1, Glucose 165',
  },
  {
    requestId: 'PA-2026-0411', patient: 'Jane Smith', dob: '07/22/1982', memberId: 'MEM-100002',
    provider: 'City Medical Center', providerNpi: '0987654321',
    procedure: 'MRI Brain w/wo Contrast (CPT 70553)',
    diagnoses: ['G43.909 - Migraine, unspecified', 'R51.9 - Headache, unspecified'],
    clinicalNotes: `CHIEF COMPLAINT: Severe headaches with new neurological symptoms x 8 weeks.

HPI: Ms. Smith is a 43-year-old female with a long history of migraines presenting with worsening headaches over the past 8 weeks. The character of headaches has changed - previously unilateral throbbing, now bilateral with constant pressure component. New associated symptoms include intermittent visual disturbances (scotomas), left-hand paresthesias, and word-finding difficulty. Failed trials of sumatriptan, topiramate, and amitriptyline. Prior CT head (2 months ago) was unremarkable.

NEUROLOGICAL EXAM:
- Cranial nerves: II-XII intact; visual fields full to confrontation
- Motor: 5/5 all extremities
- Sensory: Diminished light touch left hand (subjective)
- Reflexes: 2+ symmetric
- Gait: Normal tandem gait

ASSESSMENT: Atypical migraine with new focal neurological symptoms (paresthesias, word-finding difficulty). Red flags warrant brain MRI to rule out intracranial pathology. Prior CT head was negative but insufficient for posterior fossa and white matter evaluation.

PLAN: MRI Brain with and without contrast. Neurology follow-up for results.`,
    labResults: 'ESR: 22 mm/hr\nCRP: 0.8 mg/dL (normal)\nCBC: WBC 7.2, Hgb 13.1, Plt 245\nTSH: 2.1 mIU/L (normal)',
  },
  {
    requestId: 'PA-2026-0410', patient: 'Robert Johnson', dob: '11/05/1990', memberId: 'MEM-100003',
    provider: 'Valley Healthcare', providerNpi: '5678901234',
    procedure: 'Physical Therapy - Therapeutic Exercise (CPT 97110)',
    diagnoses: ['M54.5 - Low back pain', 'M79.3 - Panniculitis, unspecified'],
    clinicalNotes: `CHIEF COMPLAINT: Chronic low back pain limiting work and daily activities x 6 months.

HPI: Mr. Johnson is a 35-year-old male construction worker with chronic low back pain. Pain radiates to the right buttock, rated 7/10. Aggravated by prolonged standing, lifting, and bending. Has tried OTC NSAIDs and ice/heat with minimal relief. Lumbar X-ray shows mild degenerative changes at L4-L5. No prior physical therapy.

FUNCTIONAL LIMITATIONS:
- Unable to lift >20 lbs (job requires 50+ lbs)
- Cannot sit >30 minutes without repositioning
- Sleep disrupted 3-4 nights/week
- Modified duty at work for 3 months

OBJECTIVE:
- Lumbar ROM: Flexion 40° (normal 60°), Extension 10° (normal 25°)
- SLR: Positive right at 50°
- Core strength: 3/5 bilateral
- Oswestry Disability Index: 52% (severe disability)

ASSESSMENT: Chronic mechanical low back pain with functional limitation. Candidate for PT program targeting core stabilization, flexibility, and functional restoration.

PLAN: Refer PT 2-3x/week for 6 weeks. Goals: reduce pain to 3/10, improve lifting capacity to 50 lbs, return to full duty.`,
    labResults: null,
  },
  {
    requestId: 'PA-2026-0409', patient: 'Maria Garcia', dob: '04/10/1968', memberId: 'MEM-100004',
    provider: 'Springfield Orthopedic Center', providerNpi: '1234567104',
    procedure: 'Total Knee Arthroplasty - Right (CPT 27447)',
    diagnoses: ['M17.11 - Primary OA, right knee'],
    clinicalNotes: `CHIEF COMPLAINT: Right knee pain and stiffness, progressive over 3 years.

HPI: Mrs. Garcia is a 57-year-old female with progressive right knee osteoarthritis. Weight-bearing knee X-rays show Kellgren-Lawrence Grade 4 with complete medial joint space loss, osteophyte formation, and subchondral sclerosis. Patient has completed 8 months of conservative treatment: PT (24 sessions), 2 corticosteroid injections, viscosupplementation series, daily NSAIDs, activity modification, and 15-pound weight loss.

CONSERVATIVE TREATMENT HISTORY:
- Physical therapy: 24 sessions (Jan-Aug 2025) - modest improvement then plateau
- Corticosteroid injections: 2 (March, July 2025) - 4-6 weeks relief each
- Viscosupplementation: 3-injection series (Sept 2025) - minimal benefit
- NSAIDs: Meloxicam 15mg daily x 8 months
- BMI: 31.2 (down from 33.8)

FUNCTIONAL ASSESSMENT:
- KOOS Score: 38/100 (severe impairment)
- WOMAC Pain: 16/20, Stiffness: 7/8, Function: 52/68
- Walking distance limited to 1 block
- Requires handrail for stairs
- Night pain disrupting sleep 5-7 nights/week

ASSESSMENT: End-stage right knee OA, failed comprehensive conservative management. Surgical candidate for TKA. Pre-operative clearance obtained. Psychological screening completed - no contraindications.`,
    labResults: 'Pre-op labs:\nCBC: WBC 6.8, Hgb 12.9, Plt 280\nBMP: All within normal limits\nPT/INR: 11.2/1.0\nUrinalysis: Negative\nHbA1c: 6.1%\nBMI: 31.2',
  },
  {
    requestId: 'PA-2026-0408', patient: 'James Wilson', dob: '09/28/1955', memberId: 'MEM-100005',
    provider: 'Providence Heart Center', providerNpi: '1234567105',
    procedure: 'Cardiac Catheterization - Left Heart (CPT 93458)',
    diagnoses: ['I25.10 - Atherosclerotic heart disease', 'I20.0 - Unstable angina', 'R07.9 - Chest pain'],
    clinicalNotes: `CHIEF COMPLAINT: Worsening exertional chest pain and dyspnea x 3 weeks.

HPI: Mr. Wilson is a 70-year-old male with known CAD, HTN, and hyperlipidemia presenting with progressive exertional angina. Previously stable on medical therapy. Now experiencing chest pressure with 1 block of walking (previously 4-5 blocks). Recent nuclear stress test (2 weeks ago) shows moderate reversible perfusion defect in LAD territory with EF 45% (prior 55%).

CARDIAC RISK FACTORS: HTN, HLD, former smoker (quit 10 years ago), family history (father MI at 58).

MEDICATIONS: Aspirin 81mg, atorvastatin 80mg, metoprolol 50mg BID, lisinopril 20mg, nitroglycerin PRN.

STRESS TEST RESULTS (Nuclear Myocardial Perfusion):
- Reversible defect in anterior wall and apex (LAD territory)
- LVEF 45% (reduced from 55% one year ago)
- Exercise duration: 4 minutes (limited by chest pain)
- ST depression 2mm in V3-V5

ASSESSMENT: Unstable angina with positive functional testing demonstrating worsening ischemia. Cardiac catheterization indicated for definitive evaluation and potential intervention.`,
    labResults: 'Troponin I: <0.04 (serial negative x3)\nBNP: 320 pg/mL\nTotal Cholesterol: 168, LDL: 62, HDL: 38\nCreatinine: 1.3, eGFR: 58\nHgb: 13.2\nPlatelet: 198',
  },
  {
    requestId: 'PA-2026-0407', patient: 'Sarah Davis', dob: '12/03/1978', memberId: 'MEM-100006',
    provider: 'Stamford GI Associates', providerNpi: '1234567006',
    procedure: 'Screening Colonoscopy with Polypectomy (CPT 45380)',
    diagnoses: ['K63.5 - Polyp of colon', 'Z12.11 - Encounter for screening for malignant neoplasm of colon'],
    clinicalNotes: `CHIEF COMPLAINT: Positive fecal occult blood test on routine screening.

HPI: Ms. Davis is a 47-year-old female referred for colonoscopy after positive FIT test on routine screening. No prior colonoscopy. Family history significant for father diagnosed with colon cancer at age 62. Patient reports occasional left-sided abdominal discomfort and change in bowel habits over past 3 months (more frequent stools). No rectal bleeding, weight loss, or anorexia.

STOOL TEST RESULTS: FIT positive (Hgb 120 ng/mL, threshold >20 ng/mL)

RISK ASSESSMENT:
- Age 47 (meets ACS screening criteria ≥45)
- Positive FIT test
- First-degree relative with CRC (father, age 62)
- Symptomatic (change in bowel habits)

PHYSICAL EXAM:
- Abdomen: Soft, mild LLQ tenderness, no masses, no hepatomegaly
- Rectal: No masses, heme-negative on exam

ASSESSMENT: Positive FIT with family history of CRC and GI symptoms. Screening/diagnostic colonoscopy indicated per USPSTF and ACS guidelines. Meets criteria for NCD-210.3.`,
    labResults: 'FIT: Positive (Hgb 120 ng/mL)\nCBC: Hgb 11.8 (mildly low), MCV 76 (low)\nFerritin: 18 ng/mL (low)\nCEA: 2.1 ng/mL (normal)',
  },
  {
    requestId: 'PA-2026-0406', patient: 'Michael Brown', dob: '06/17/1965', memberId: 'MEM-100007',
    provider: 'Worcester Spine Center', providerNpi: '1234567007',
    procedure: 'Lumbar Spinal Fusion L4-L5 (CPT 22612)',
    diagnoses: ['M43.16 - Spondylolisthesis, lumbar region', 'M51.16 - IVD disorders with radiculopathy, lumbar'],
    clinicalNotes: `CHIEF COMPLAINT: Chronic low back pain with bilateral leg symptoms x 2 years.

HPI: Mr. Brown is a 60-year-old male with Grade 1 spondylolisthesis at L4-L5 with bilateral radiculopathy. MRI shows moderate foraminal stenosis and disc degeneration.

CONSERVATIVE TREATMENT (4 months documented):
- Physical therapy: 16 sessions over 4 months
- Epidural steroid injections: 2 (one denied by insurance)
- Medications: gabapentin 300mg TID, cyclobenzaprine 10mg, ibuprofen 600mg TID
- No chiropractic care attempted
- No psychological evaluation performed

MRI FINDINGS (4 months ago):
- Grade 1 anterolisthesis L4 on L5 (6mm slip)
- Moderate bilateral foraminal stenosis L4-L5
- Disc desiccation and height loss L4-L5

FUNCTIONAL STATUS: ODI 44% (moderate disability). Able to walk 3 blocks. Working modified desk duty.

ASSESSMENT: Lumbar spondylolisthesis with radiculopathy. Only 4 months conservative treatment documented (policy requires minimum 6 months). No psychological evaluation completed. Recommend additional conservative treatment before surgical consideration.`,
    labResults: 'Pre-surgical labs not yet obtained\nBMI: 33.5\nHbA1c: 5.9%',
  },
  {
    requestId: 'PA-2026-0405', patient: 'Emily Taylor', dob: '01/25/1988', memberId: 'MEM-100008',
    provider: 'Bridgeport Hospital', providerNpi: '1234567108',
    procedure: 'CT Abdomen and Pelvis with Contrast (CPT 74178)',
    diagnoses: ['R10.9 - Unspecified abdominal pain', 'K80.20 - Calculus of gallbladder w/o obstruction'],
    clinicalNotes: `CHIEF COMPLAINT: Recurrent right upper quadrant abdominal pain x 6 weeks.

HPI: Ms. Taylor is a 37-year-old female presenting with recurrent episodes of severe RUQ pain, radiating to right shoulder, worse after fatty meals. ER visit 4 weeks ago with ultrasound showing multiple gallstones (largest 1.8cm) without bile duct dilation. Labs at that time showed mildly elevated alkaline phosphatase. Symptoms have progressed with more frequent attacks (now 2-3 per week) and new onset low-grade fevers.

ER VISIT FINDINGS (4 weeks ago):
- RUQ ultrasound: Multiple gallstones, GB wall 4mm, no pericholecystic fluid
- Labs: ALP 142 (H), AST 48 (mildly H), ALT 52 (mildly H), WBC 9.8, lipase normal

CURRENT PRESENTATION:
- Vitals: T 100.4°F, BP 128/78, HR 92
- Abdomen: Positive Murphy's sign, RUQ tenderness
- Labs: WBC 12.1 (elevated), ALP 168, AST 62, ALT 71

ASSESSMENT: Symptomatic cholelithiasis with concern for acute cholecystitis given fever and leukocytosis. CT abdomen/pelvis indicated for surgical planning and to rule out complications (perforation, abscess, bile duct stones).`,
    labResults: 'WBC: 12.1 K/uL (H)\nALP: 168 U/L (H)\nAST: 62 U/L (H)\nALT: 71 U/L (H)\nTotal Bilirubin: 1.4 mg/dL\nLipase: 42 U/L (normal)\nUrinalysis: Negative',
  },
  {
    requestId: 'PA-2026-0404', patient: 'David Anderson', dob: '08/14/1972', memberId: 'MEM-100009',
    provider: 'Waterbury Orthopedic Center', providerNpi: '1234567009',
    procedure: 'Shoulder Arthroscopy - Rotator Cuff Repair (CPT 29827)',
    diagnoses: ['M75.120 - Complete rotator cuff tear, left shoulder', 'M75.100 - Rotator cuff syndrome, unspecified shoulder'],
    clinicalNotes: `CHIEF COMPLAINT: Left shoulder pain and weakness x 4 months.

HPI: Mr. Anderson is a 53-year-old male with left shoulder pain following a fall 4 months ago. MRI confirms full-thickness supraspinatus tear (2.5cm). Has completed 8 weeks of PT (16 sessions), one subacromial corticosteroid injection, and 6 weeks of NSAIDs with incomplete relief. Persistent weakness with overhead activities and night pain disrupting sleep.

MRI FINDINGS (3 months ago):
- Full-thickness supraspinatus tear, 2.5cm retraction
- Mild infraspinatus tendinopathy
- Moderate subacromial/subdeltoid bursitis
- Glenohumeral joint: Normal articular surfaces

CONSERVATIVE TREATMENT:
- PT: 16 sessions over 8 weeks - improved ROM but persistent weakness
- Corticosteroid injection: 1 subacromial (6 weeks ago) - 2 weeks temporary relief
- NSAIDs: Naproxen 500mg BID x 6 weeks

PHYSICAL EXAM:
- Active ROM: Forward flexion 120° (normal 180°), abduction 100°
- Strength: Supraspinatus 3/5, infraspinatus 4/5
- Special tests: Positive Neer, positive Hawkins, positive empty can
- No instability

ASSESSMENT: Full-thickness rotator cuff tear with failed conservative management. Arthroscopic repair indicated.`,
    labResults: null,
  },
  {
    requestId: 'PA-2026-0403', patient: 'Lisa Martinez', dob: '05/20/1960', memberId: 'MEM-100010',
    provider: 'CT Oncology Center', providerNpi: '1234567110',
    procedure: 'Chemotherapy Administration - IV Infusion (CPT 96413)',
    diagnoses: ['C50.911 - Malignant neoplasm of unspecified site of right female breast'],
    clinicalNotes: `CHIEF COMPLAINT: Newly diagnosed right breast cancer, presenting for chemotherapy authorization.

HPI: Ms. Martinez is a 65-year-old female diagnosed with Stage IIA (T2N0M0) right breast invasive ductal carcinoma. Pathology from core needle biopsy: ER+/PR+/HER2-negative, Ki-67 35%. Oncotype DX recurrence score: 28 (intermediate-high). Tumor board consensus: neoadjuvant chemotherapy followed by surgery.

PATHOLOGY: Right breast core biopsy (1 month ago)
- Invasive ductal carcinoma, Grade 2
- ER: Positive (95%), PR: Positive (60%), HER2: Negative (IHC 1+)
- Ki-67: 35%

STAGING WORKUP:
- Mammogram/US: 3.2cm mass right breast upper outer quadrant
- CT chest/abdomen/pelvis: No distant metastases
- Bone scan: Negative

PROPOSED REGIMEN: Dose-dense AC-T (NCCN Category 1 recommendation)
- Doxorubicin 60mg/m² + Cyclophosphamide 600mg/m² q2 weeks x 4 cycles
- Followed by Paclitaxel 175mg/m² q2 weeks x 4 cycles

PERFORMANCE STATUS: ECOG 1 (restricted in strenuous activity but ambulatory)

BASELINE LABS: CBC normal, CMP normal, LVEF 62% on echocardiogram.`,
    labResults: 'WBC: 7.8, Hgb: 13.4, Plt: 310\nANC: 5.2 (adequate)\nCr: 0.8, BUN: 14\nAST: 22, ALT: 18, ALP: 78, Bili: 0.6\nLVEF: 62% (echocardiogram)\nCA 15-3: 18 U/mL (normal)\nCEA: 1.8 ng/mL (normal)',
  },
  {
    requestId: 'PA-2026-0402', patient: 'Thomas White', dob: '10/09/1985', memberId: 'MEM-100011',
    provider: 'Danbury Sleep Center', providerNpi: '1234567111',
    procedure: 'Polysomnography - In-Lab Sleep Study (CPT 95811)',
    diagnoses: ['G47.33 - Obstructive sleep apnea', 'R06.83 - Snoring'],
    clinicalNotes: `CHIEF COMPLAINT: Excessive daytime sleepiness and loud snoring.

HPI: Mr. White is a 40-year-old male referred by PCP for suspected sleep apnea. Reports loud snoring (per bed partner), witnessed apneas, and excessive daytime sleepiness affecting work performance. Home sleep test attempted but was technically inadequate (insufficient recording time). No formal sleep medicine consultation has been performed.

SYMPTOMS:
- Loud snoring nightly
- Witnessed apneas (per partner)
- Excessive daytime sleepiness
- Morning headaches 3-4x/week
- Epworth Sleepiness Scale: Not formally administered

HOME SLEEP TEST (3 months ago): Technically inadequate
- Total recording time: 2.5 hours (minimum 4 hours required)
- AHI could not be reliably calculated
- Study deemed non-diagnostic

PHYSICAL EXAM:
- BMI: 34.2
- Neck circumference: 18 inches
- Mallampati Class III
- No significant craniofacial abnormalities

ASSESSMENT: Suspected OSA based on symptoms and risk factors. Home sleep test was non-diagnostic. In-lab polysomnography requested. NOTE: Patient has not had formal sleep medicine consultation - PCP referral only.`,
    labResults: 'TSH: 3.2 mIU/L (normal)\nCBC: Normal\nBMI: 34.2\nNeck circumference: 18 inches\nESS: Not administered',
  },
  {
    requestId: 'PA-2026-0401', patient: 'Jennifer Lee', dob: '02/28/1976', memberId: 'MEM-100012',
    provider: 'Norwalk Breast Center', providerNpi: '1234567112',
    procedure: 'Stereotactic Breast Biopsy (CPT 19083)',
    diagnoses: ['N63.0 - Unspecified lump in unspecified breast', 'R92.1 - Mammographic calcification found on diagnostic imaging'],
    clinicalNotes: `CHIEF COMPLAINT: Suspicious mammographic findings requiring tissue diagnosis.

HPI: Ms. Lee is a 49-year-old female with suspicious findings on screening mammogram requiring stereotactic biopsy. No palpable mass. No personal history of breast cancer. Family history: maternal aunt with breast cancer at age 58.

IMAGING FINDINGS:
- Screening mammogram: New cluster of pleomorphic calcifications right breast, upper outer quadrant
- Diagnostic mammogram with magnification: Confirmed suspicious calcifications, BI-RADS 4C
- Breast ultrasound: No correlating mass identified; calcifications not visualized on US

BIRADS CLASSIFICATION: 4C (high suspicion for malignancy, >50% but <95% likelihood)

RECOMMENDATION: Stereotactic-guided breast biopsy for tissue diagnosis of calcifications. Ultrasound-guided biopsy not feasible (calcifications not visible on US).

ASSESSMENT: BI-RADS 4C calcifications requiring tissue diagnosis. Stereotactic biopsy is the appropriate approach given calcification-only finding without US correlate.`,
    labResults: 'PT/INR: 11.0/1.0 (normal)\nPlatelet: 265 K/uL\nNo anticoagulation therapy',
  },
  {
    requestId: 'PA-2026-0400', patient: 'Christopher Clark', dob: '11/12/1958', memberId: 'MEM-100013',
    provider: 'Meriden DME Supply', providerNpi: '1234567213',
    procedure: 'CPAP Device - Continuous Positive Airway Pressure (HCPCS E0601)',
    diagnoses: ['G47.33 - Obstructive sleep apnea'],
    clinicalNotes: `CHIEF COMPLAINT: CPAP device request for diagnosed obstructive sleep apnea.

HPI: Mr. Clark is a 67-year-old male with polysomnography-confirmed severe obstructive sleep apnea. Diagnostic sleep study performed 5 months ago at Meriden Sleep Lab showed AHI of 42 events/hour (severe). Face-to-face evaluation completed with sleep medicine physician. Patient education on CPAP use completed.

SLEEP STUDY RESULTS (5 months ago):
- Total sleep time: 6.2 hours
- AHI: 42 events/hour (severe, threshold ≥30)
- Oxygen nadir: 78%
- Time SpO2 <90%: 22 minutes
- Arousal index: 38/hour

FACE-TO-FACE EVALUATION: Completed with Dr. Gomez (2 months ago)
- Confirmed diagnosis of severe OSA
- Discussed treatment options
- Patient elected CPAP therapy
- Compliance expectations reviewed

PRESCRIBED SETTINGS: CPAP 12 cmH2O (based on titration study)

ASSESSMENT: Severe OSA (AHI 42) confirmed by in-lab polysomnography. Meets all CMS criteria for CPAP coverage per LCD-090. Face-to-face evaluation documented. Patient educated on compliance requirements.`,
    labResults: 'AHI: 42 events/hr (severe)\nO2 Nadir: 78%\nEpworth Sleepiness Scale: 16/24\nBMI: 36.8',
  },
  {
    requestId: 'PA-2026-0399', patient: 'Amanda Harris', dob: '07/04/1970', memberId: 'MEM-100014',
    provider: 'Milford Cardiology Center', providerNpi: '1234567114',
    procedure: 'Percutaneous Coronary Intervention with Stent (CPT 92928)',
    diagnoses: ['I25.10 - Atherosclerotic heart disease of native coronary artery', 'I25.110 - Atherosclerotic heart disease with unstable angina'],
    clinicalNotes: `CHIEF COMPLAINT: Multi-vessel coronary artery disease requiring intervention.

HPI: Mrs. Harris is a 55-year-old female with progressive angina. Cardiac catheterization performed last month revealed: 80% stenosis of mid-LAD, 70% stenosis of proximal circumflex, 60% RCA stenosis. Positive stress test with anterior and lateral wall ischemia. Currently on optimal medical therapy (aspirin, clopidogrel, atorvastatin 80mg, metoprolol 100mg, amlodipine 10mg).

CATHETERIZATION FINDINGS (1 month ago):
- LAD: 80% mid-vessel stenosis (FFR 0.72)
- LCx: 70% proximal stenosis (FFR 0.78)
- RCA: 60% mid-vessel stenosis (FFR 0.85)
- LVEF: 50%
- SYNTAX Score: 22 (intermediate)

HEART TEAM DISCUSSION PENDING: Given multi-vessel disease with intermediate SYNTAX score, PCI vs CABG requires heart team review. Patient preference is for PCI if technically feasible.

CURRENT MEDICATIONS: ASA 81mg, atorvastatin 80mg, metoprolol 100mg BID, amlodipine 10mg, lisinopril 20mg, isosorbide mononitrate 60mg.

ASSESSMENT: Multivessel CAD with significant LAD and LCx disease. PCI proposed for LAD and LCx lesions. Heart team review recommended given SYNTAX score and multi-vessel involvement.`,
    labResults: 'Troponin I: <0.04 (negative)\nBNP: 180 pg/mL\nCreatinine: 0.9, eGFR: 72\nLDL: 58 (at goal)\nHbA1c: 5.6%\nPlatelet: 220\nHgb: 12.8',
  },
  {
    requestId: 'PA-2026-0398', patient: 'Daniel Moore', dob: '03/30/1992', memberId: 'MEM-100015',
    provider: 'Shelton Rehabilitation Center', providerNpi: '1234567215',
    procedure: 'Physical Rehabilitation - Therapeutic Activities (CPT 97530)',
    diagnoses: ['I63.9 - Cerebral infarction, unspecified', 'G81.90 - Hemiplegia, unspecified'],
    clinicalNotes: `CHIEF COMPLAINT: Post-stroke rehabilitation for right-sided hemiparesis.

HPI: Mr. Moore is a 33-year-old male, 4 months post left MCA ischemic stroke. Presenting with right-sided hemiparesis, mild expressive aphasia, and impaired balance. Completed acute inpatient rehabilitation (3 weeks). Now requires continued outpatient rehabilitation to maximize functional recovery.

STROKE DETAILS:
- Left MCA territory ischemic stroke (4 months ago)
- MRI: Left frontal and parietal infarct
- Etiology: PFO with paradoxical embolism (PFO closure completed)
- NIH Stroke Scale at admission: 12, current: 4

CURRENT FUNCTIONAL STATUS:
- FIM Score: 95/126 (moderate assistance needed)
- Right upper extremity: 3+/5 strength, limited fine motor
- Right lower extremity: 4/5 strength, foot drop present
- Gait: Ambulatory with AFO and single-point cane
- Speech: Mild word-finding difficulty, functional communication

REHABILITATION GOALS:
1. Improve RUE strength to 4+/5 for functional tasks
2. Independent ambulation without assistive device
3. Return to modified work within 3 months
4. Improve FIM to 115/126

PLAN: Outpatient PT/OT 3x/week for therapeutic activities, gait training, and fine motor retraining. Speech therapy 2x/week for aphasia.`,
    labResults: 'MRI Brain: Left MCA territory infarct (chronic changes)\nCarotid Doppler: No significant stenosis\nEchocardiogram: PFO closure device in place, LVEF 60%\nINR: 2.3 (on warfarin)\nHgb: 14.2',
  },
];

export async function generateAllPdfs() {
  const outputDir = __dirname;
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const doc of DOCUMENTS) {
    await generatePdf(doc, outputDir);
  }
  console.log(`  Generated ${DOCUMENTS.length} clinical PDF documents.`);
}

function generatePdf(docData, outputDir) {
  return new Promise((resolve, reject) => {
    const filePath = join(outputDir, `${docData.requestId}.pdf`);
    const pdf = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = createWriteStream(filePath);

    pdf.pipe(stream);

    // Header
    pdf.fontSize(10).fillColor('#666')
      .text('PRIOR AUTHORIZATION REQUEST - CLINICAL DOCUMENTATION', { align: 'center' });
    pdf.moveDown(0.3);
    pdf.fontSize(8).text(`Request ID: ${docData.requestId} | Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    pdf.moveDown(0.5);
    pdf.moveTo(50, pdf.y).lineTo(562, pdf.y).stroke('#ccc');
    pdf.moveDown(0.5);

    // Provider & Patient Info
    pdf.fontSize(11).fillColor('#000').font('Helvetica-Bold').text('PROVIDER INFORMATION');
    pdf.fontSize(9).font('Helvetica')
      .text(`Provider: ${docData.provider}`)
      .text(`NPI: ${docData.providerNpi}`);
    pdf.moveDown(0.5);

    pdf.fontSize(11).font('Helvetica-Bold').text('PATIENT INFORMATION');
    pdf.fontSize(9).font('Helvetica')
      .text(`Patient Name: ${docData.patient}`)
      .text(`Date of Birth: ${docData.dob}`)
      .text(`Member ID: ${docData.memberId}`);
    pdf.moveDown(0.5);

    // Procedure & Diagnosis
    pdf.fontSize(11).font('Helvetica-Bold').text('REQUESTED PROCEDURE');
    pdf.fontSize(9).font('Helvetica').text(docData.procedure);
    pdf.moveDown(0.3);

    pdf.fontSize(11).font('Helvetica-Bold').text('DIAGNOSIS CODES');
    for (const dx of docData.diagnoses) {
      pdf.fontSize(9).font('Helvetica').text(`  • ${dx}`);
    }
    pdf.moveDown(0.5);

    pdf.moveTo(50, pdf.y).lineTo(562, pdf.y).stroke('#ccc');
    pdf.moveDown(0.5);

    // Clinical Notes
    pdf.fontSize(11).font('Helvetica-Bold').text('CLINICAL NOTES');
    pdf.moveDown(0.3);
    pdf.fontSize(9).font('Helvetica').text(docData.clinicalNotes, { lineGap: 2 });
    pdf.moveDown(0.5);

    // Lab Results
    if (docData.labResults) {
      pdf.moveTo(50, pdf.y).lineTo(562, pdf.y).stroke('#ccc');
      pdf.moveDown(0.5);
      pdf.fontSize(11).font('Helvetica-Bold').text('LABORATORY / DIAGNOSTIC RESULTS');
      pdf.moveDown(0.3);
      pdf.fontSize(9).font('Helvetica').text(docData.labResults, { lineGap: 2 });
    }

    // Footer
    pdf.moveDown(1);
    pdf.moveTo(50, pdf.y).lineTo(562, pdf.y).stroke('#ccc');
    pdf.moveDown(0.3);
    pdf.fontSize(7).fillColor('#999')
      .text('This document is generated for demonstration purposes. All patient data is fictitious.', { align: 'center' });

    pdf.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

// Allow direct execution
if (process.argv[1]?.endsWith('generate-pdfs.js')) {
  generateAllPdfs().then(() => {
    console.log('Done.');
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
