# Prior Authorization System — Research Documentation

## Table of Contents
1. [Supporting Documents for Prior Authorization](#1-supporting-documents-for-prior-authorization)
2. [Agent vs MCP Tool Architecture](#2-agent-vs-mcp-tool-architecture)
3. [Healthcare AI Prior Authorization Architecture](#3-healthcare-ai-prior-authorization-architecture)
4. [Clinical Documentation by Procedure (15 Cases)](#4-clinical-documentation-by-procedure)
5. [Sources & References](#5-sources--references)

---

## 1. Supporting Documents for Prior Authorization

Based on research from CMS, AMA, and payer guidelines, these are the documents typically submitted with a prior authorization request:

### Core Required Documents

1. **Patient Demographics & Insurance Verification**
   - Full name, date of birth, member ID
   - Active coverage confirmation, plan eligibility
   - Attending physician NPI and specialty

2. **Clinical Coding**
   - Primary and secondary ICD-10 diagnosis codes
   - CPT/HCPCS procedure codes with modifiers

3. **Clinical Notes (Progress Notes / Office Visit Notes)**
   - History of Present Illness (HPI)
   - Review of Systems (ROS)
   - Physical examination findings
   - Medical decision-making rationale
   - Assessment and Plan

4. **Laboratory Results**
   - Blood work (CBC, CMP, specific markers)
   - Pathology reports
   - Interpretive statements explaining results and clinical relevance

5. **Imaging/Diagnostic Reports**
   - X-rays, CT scans, MRI reports
   - Echocardiograms, stress test results
   - Ultrasound reports

6. **Treatment History / Conservative Management Documentation**
   - Prior treatments attempted and their outcomes
   - Medication history (what was tried, duration, why it failed)
   - Physical therapy records if applicable
   - Documentation of failure of conservative management

7. **Physician Orders**
   - Specific order for the requested service
   - Clinical justification / letter of medical necessity

8. **Consultation Reports**
   - Specialist consultation notes
   - Second opinions if applicable

9. **Surgical/Procedural Notes** (if applicable)
   - Operative reports from prior related procedures
   - Anesthesia records

10. **Insurance-Specific Authorization Forms**
    - Payer-required PA forms with service dates, urgency level, quantity/duration

### 2026 Regulatory Changes (CMS)

Starting January 1, 2026, CMS mandates electronic prior authorization using FHIR APIs:
- Standard requests must be completed within **7 calendar days**
- Expedited/urgent requests within **72 hours**
- Payers must provide detailed clinical rationale for denials
- Electronic PA via FHIR R4 APIs is now required

---

## 2. Agent vs MCP Tool Architecture

### What is MCP (Model Context Protocol)?

MCP is a **standardized integration layer** for AI agents to access external tools and data sources. It follows a **client-server architecture** with three participants:

1. **MCP Host**: The AI application (e.g., Claude Desktop, VS Code) that coordinates MCP clients
2. **MCP Client**: A component within the host that maintains a connection to a single MCP server
3. **MCP Server**: A program that provides context (tools, resources, prompts) to MCP clients

### Two Protocol Layers

1. **Data Layer**: JSON-RPC 2.0-based protocol defining lifecycle management, core primitives, and notifications
2. **Transport Layer**: STDIO for local servers, Streamable HTTP for remote servers, with OAuth support

### Three Core Server Primitives

| Primitive | What It Is | How It Works | Example |
|-----------|-----------|-------------|---------|
| **Tools** | Executable functions the AI can invoke | Agent calls `tools/call` with arguments; gets structured results | File operations, API calls, database queries |
| **Resources** | Read-only data sources for context | Agent calls `resources/read` to fetch data | File contents, database schemas, API responses |
| **Prompts** | Reusable interaction templates | Agent calls `prompts/get` with variables | System prompts, few-shot examples |

### Client Primitives (Server-to-Client)

- **Sampling**: Servers request LLM completions from the host (model-agnostic)
- **Elicitation**: Servers request user input/confirmation
- **Logging**: Servers send log messages to clients

### Critical Distinction: Agents vs MCP Tools

MCP is **not** an agent framework. It is a **standardized integration layer** for agents to access tools.

```
Agent Framework (LangGraph, CrewAI, Strands)
    |
    v
AI Application (Host) -- creates --> MCP Client 1 --> MCP Server A (Database Tools)
                      -- creates --> MCP Client 2 --> MCP Server B (File System Tools)
                      -- creates --> MCP Client 3 --> MCP Server C (API Tools)
```

- **Agents** = The AI reasoning layer that decides what to do, plans multi-step actions, and orchestrates tool use
- **MCP Servers/Tools** = Provide standardized tool access. They expose capabilities but do not reason or plan. They are tools, not agents

### MCP Lifecycle Flow

1. **Initialize**: Client sends `initialize` request with capabilities; server responds with its capabilities
2. **Discover**: Client calls `tools/list`, `resources/list`, `prompts/list` to discover server offerings
3. **Execute**: Client calls `tools/call` with name and arguments; server returns results
4. **Notify**: Server sends `notifications/tools/list_changed` when available tools change

### Governance

In December 2025, Anthropic donated MCP to the **Agentic AI Foundation (AAIF)** under the Linux Foundation, co-founded by Anthropic, Block, and OpenAI.

---

## 3. Healthcare AI Prior Authorization Architecture

### Typical Multi-Agent Architecture

Healthcare PA systems use a **Planner-Executor-Verifier (PEV)** pattern or **Orchestrator pattern**:

```
                    +----------------------------+
                    |    ORCHESTRATOR AGENT       |
                    | (Routes, coordinates flow)  |
                    +----------------------------+
                          |            |          |
               +----------+    +------+------+   +----------+
               |               |              |              |
    +----------v---+  +--------v-----+  +-----v--------+  +-v-----------+
    | INTAKE AGENT |  | CLINICAL     |  | CRITERIA     |  | DECISION    |
    | (Data gather)|  | REVIEW AGENT |  | MATCHING     |  | AGENT       |
    |              |  | (Analyze     |  | AGENT        |  | (Approve/   |
    |              |  |  records)    |  | (Apply payer |  |  Deny/Pend) |
    +--------------+  +--------------+  |  rules)      |  +-------------+
                                        +--------------+
```

### Agent Roles in Healthcare PA

| Agent | Role | Tools It Uses |
|-------|------|---------------|
| **Orchestrator Agent** | Coordinates the overall workflow, routes requests to specialized agents | Workflow engine, event bus, state management |
| **Intake Agent** | Gathers and validates patient data, extracts clinical info from documents | EHR/FHIR API, OCR/document parser, NLP entity extraction, insurance verification API |
| **Clinical Review Agent** | Analyzes clinical notes, lab results, imaging for medical necessity | NLP/clinical NER, medical terminology mapping, clinical evidence database, lab value analyzer |
| **Criteria Matching Agent** | Matches clinical evidence against payer-specific coverage criteria | Payer policy database, CPT/ICD-10 code lookup, medical guidelines retrieval, coverage rules engine |
| **Decision Agent** | Generates approval/denial/pend recommendation with rationale | Decision rules engine, letter generator, appeal pathway recommender |

### Tools vs Agents in Healthcare PA

**Tools** (passive, invoked on demand):
- FHIR API connector (reads patient data from EHR)
- CPT/ICD-10 code lookup
- Payer policy database query
- Document OCR and extraction
- Lab value normalization
- Clinical guideline retrieval
- Fee schedule calculator
- Letter/form generator

**Agents** (active, reasoning, decision-making):
- Interpret free-text clinical notes and determine medical necessity
- Apply payer-specific criteria with clinical reasoning
- Generate approval/denial decisions with justification
- Handle exception cases requiring multi-step reasoning
- Identify missing documentation and request it

### Data Architecture (Dual-Layer)

1. **Structured Clinical Data**: FHIR-compliant storage for patient records, diagnoses, treatment histories
2. **Unstructured Medical Documentation**: Storage for clinical images, PDF reports, handwritten notes, scanned records

### Agentic Patterns Used in Healthcare PA

| Pattern | Description | Use in Prior Auth |
|---------|-------------|-------------------|
| **ReAct** | Interleaves reasoning with tool calls | Stepwise PA checks: read clinical note, reason about criteria, call policy database, reason about match |
| **Tree of Thoughts** | Explores multiple reasoning paths | Complex cases where multiple clinical pathways could justify or deny a request |
| **PEV (Planner-Executor-Verifier)** | Explicit separation with deterministic verification | Planner determines what data is needed; Executor gathers it; Verifier checks compliance rules deterministically |

### Industry Adoption (2025-2026)

- 52.5% of U.S. healthcare providers adopting composable IT architectures for electronic PA
- Prior authorization AI is a fast-growing category with **10x year-over-year growth**
- CMS 2026 mandates accelerating shift from manual PA to automated AI-driven systems
- Agentic AI represents next generation beyond traditional RPA/automation

### Key Integration Points

- **EHR Integration**: Via FHIR R4 APIs, HL7 messages, or direct database connections
- **Payer Systems**: X12 278 (PA request/response), FHIR-based PA APIs (CMS 2026 mandate)
- **Event-Driven**: Trigger on PA verification requests via event bus
- **Compliance**: HIPAA, SOC 2, encryption at rest and in transit, audit trails

---

## 4. Clinical Documentation by Procedure

Below are realistic clinical notes, lab values, and imaging findings for each of the 15 PA request scenarios. These serve as the content for the supporting PDF documents.

---

### Case 1: Electrocardiogram — Heart Failure (PA-2026-0401)

**Patient:** John Doe, 72M
**ICD-10:** I50.9 (Heart failure, unspecified), E11.9 (Type 2 DM)
**CPT:** 93000 (Electrocardiogram)

#### Clinical Note

```
SUBJECTIVE:
72-year-old male with HTN, DM2, prior MI (2019), presenting with 3-week history of
progressive dyspnea on exertion (now occurring with walking < 50 feet), orthopnea
(sleeps on 3 pillows), PND (waking 2-3x/night gasping for air), bilateral lower
extremity swelling, 8-lb weight gain over 2 weeks, and decreased exercise tolerance.
NYHA Functional Class III.

OBJECTIVE:
Vitals: BP 152/94, HR 98, RR 22, SpO2 93% on RA, Temp 98.2F, Wt 218 lbs (baseline 210 lbs)
General: Mild respiratory distress at rest
HEENT: JVP elevated to 12 cm H2O
Cardiac: Irregularly irregular rhythm, S3 gallop present, grade 2/6 holosystolic murmur
at apex (new), no rubs
Lungs: Bibasilar crackles extending to mid-lung fields bilaterally
Abdomen: Hepatomegaly (liver palpable 3 cm below costal margin), hepatojugular
reflux positive
Extremities: 3+ pitting edema bilateral lower extremities to mid-shin

12-LEAD ECG FINDINGS:
- Atrial fibrillation with rapid ventricular response, rate 98 bpm
- Left axis deviation
- Poor R-wave progression V1-V4 (consistent with prior anterior MI)
- ST depression 1mm in leads I, aVL, V5-V6
- LVH by voltage criteria (Sokolow-Lyon > 35mm)
- QTc: 460 ms
- No acute ST elevation

ASSESSMENT:
1. Acute on chronic systolic heart failure (HFrEF), NYHA Class III, with LVEF 35%,
   now decompensated.
2. New-onset atrial fibrillation with RVR contributing to decompensation.
3. Cardiorenal syndrome (acute kidney injury superimposed on CKD).
4. Congestive hepatopathy.
5. Ischemic cardiomyopathy, prior anterior MI.

PLAN:
1. Admit to telemetry for acute heart failure management.
2. IV furosemide 40mg BID, strict I&O, daily weights.
3. Rate control: Digoxin load for afib with RVR.
4. Repeat echocardiogram to assess current LVEF and valve function.
5. Cardiology consultation for medication optimization.
6. Serial ECGs to monitor rhythm and QTc.
7. Anticoagulation: Start apixaban 5mg BID for afib (CHA2DS2-VASc score 5).
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| BNP | 1,450 pg/mL | < 100 | Critical High |
| Troponin I | 0.08 ng/mL | < 0.04 | Mildly Elevated |
| WBC | 8.2 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 11.8 g/dL | 13.5-17.5 | Low |
| Platelets | 178 K/uL | 150-400 | Normal |
| Sodium | 132 mEq/L | 136-145 | Low (dilutional) |
| Potassium | 4.8 mEq/L | 3.5-5.0 | Normal |
| BUN | 38 mg/dL | 7-20 | High |
| Creatinine | 1.6 mg/dL | 0.7-1.3 | High (baseline 1.1) |
| Glucose | 168 mg/dL | 70-100 | High |
| AST | 52 U/L | 10-40 | High |
| ALT | 48 U/L | 7-56 | Normal |
| Alk Phos | 110 U/L | 44-147 | Normal |
| Total Bilirubin | 1.8 mg/dL | 0.1-1.2 | High |
| TSH | 2.4 mIU/L | 0.4-4.0 | Normal |
| HbA1c | 8.1% | < 5.7 | High |

#### Prior Echocardiogram (6 months ago)
- LVEF: 35% (reduced)
- Moderate LV dilation
- Akinesis of anterior wall and septum
- Moderate mitral regurgitation
- Moderate tricuspid regurgitation
- Estimated PASP: 48 mmHg (elevated)

---

### Case 2: MRI Brain with Contrast — Migraine (PA-2026-0402)

**Patient:** Jane Smith, 45F
**ICD-10:** G43.909 (Migraine, unspecified)
**CPT:** 70553 (MRI Brain w/ and w/o contrast)

#### Clinical Note

```
SUBJECTIVE:
45-year-old female presents with 8-month history of progressively worsening headaches.
Frequency has increased from 2x/month to 4-5x/week. Character: unilateral, pulsating,
primarily left temporal/frontal. Severity: 7-9/10. Duration: 6-24 hours. Associated
symptoms: photophobia, phonophobia, nausea with occasional emesis, visual aura
(scintillating scotoma lasting 15-20 min preceding headache). Red flags: NEW onset
visual aura, increasing frequency and severity, headaches now awakening patient from
sleep. Failed trials: sumatriptan 100mg (partial relief only), topiramate 100mg daily
x 3 months (inadequate control, weight loss side effect), propranolol 80mg daily x
2 months (hypotension, discontinued). OTC analgesics (ibuprofen, acetaminophen)
providing no relief. No history of head trauma.

OBJECTIVE:
Vitals: BP 128/82, HR 72, Temp 98.6F
Neuro Exam: CN II-XII intact. Visual fields full to confrontation. Fundoscopic exam:
no papilledema. Motor strength 5/5 all extremities. Sensory intact to light touch,
pinprick, vibration. DTRs 2+ symmetric. Coordination: finger-to-nose and heel-to-shin
normal. Romberg negative. Gait: normal tandem gait. However, notable tenderness to
palpation over left temporal region. Mild nuchal rigidity noted on examination.

ASSESSMENT:
1. Migraine with aura, intractable - worsening pattern with new concerning features
   including change in headache pattern, new-onset aura symptoms, nocturnal awakening,
   nuchal rigidity on exam, failure of multiple prophylactic medications.
2. Concern for secondary headache etiology requiring exclusion of structural pathology,
   vascular malformation, or mass lesion.

PLAN:
1. MRI Brain with and without gadolinium contrast to evaluate for structural abnormality,
   vascular malformation, demyelinating disease, or mass lesion given red flag symptoms.
2. Continue current migraine prophylaxis pending imaging results.
3. Prescribed rizatriptan 10mg MLT for acute episodes.
4. Follow-up in 2 weeks to review imaging results.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 7.2 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 13.8 g/dL | 12.0-16.0 | Normal |
| Platelets | 245 K/uL | 150-400 | Normal |
| ESR | 12 mm/hr | 0-20 | Normal |
| CRP | 0.4 mg/dL | < 1.0 | Normal |

---

### Case 3: Physical Therapy — Low Back Pain (PA-2026-0403)

**Patient:** Robert Johnson, 48M
**ICD-10:** M54.5 (Low back pain)
**CPT:** 97110 (Physical Therapy, therapeutic exercises)

#### Clinical Note

```
SUBJECTIVE:
48-year-old female office worker with 10-week history of low back pain following
lifting incident at home. Pain is 6/10 at rest, 8/10 with prolonged sitting (> 30 min)
and bending. Radiates to left buttock, no radiation below the knee. No bowel/bladder
dysfunction. No saddle anesthesia. Unable to perform housework, difficulty with prolonged
sitting at workstation. Missed 6 days of work in past month. Failed treatments:
Ibuprofen 800mg TID x 4 weeks (GI upset, minimal relief), cyclobenzaprine 10mg THS
x 2 weeks (excessive drowsiness), home exercise program (not consistently performed
due to pain).

OBJECTIVE:
Vitals: BP 130/78, HR 72, BMI 27.8
Lumbar Spine Exam:
- Inspection: Loss of normal lumbar lordosis, mild paraspinal muscle spasm bilateral
- Palpation: Tenderness over L4-L5 and L5-S1 spinous processes and bilateral
  paraspinal muscles
- ROM: Flexion 40% of normal (limited by pain), extension 50% of normal, lateral
  flexion 60% bilateral
- SLR: Negative bilaterally
- Motor: 5/5 bilateral lower extremities
- Sensory: Intact to light touch L1-S2 dermatomes bilaterally
- DTRs: 2+ patellar and Achilles bilaterally
- Special tests: FABER negative bilaterally, prone instability test positive

FUNCTIONAL ASSESSMENT:
- Oswestry Disability Index (ODI): 42% (severe disability)
- Unable to sit > 30 minutes
- Unable to lift > 10 lbs

IMAGING:
Lumbar spine X-ray: Mild degenerative disc disease L4-L5 and L5-S1 with disc space
narrowing. No fracture, spondylolisthesis, or significant scoliosis.

ASSESSMENT:
1. Acute on chronic mechanical low back pain with significant functional limitation.
2. Failed pharmacological management.
3. Objective findings support need for skilled physical therapy intervention.

PLAN:
1. Physical therapy: 2-3 sessions per week x 6 weeks (12-18 visits).
2. Goals: Pain reduction to 3/10, restore lumbar ROM to 80% of normal, ODI < 20%.
3. Treatment: Manual therapy, core stabilization, McKenzie exercises, ergonomic education.
4. Re-evaluate at 6 weeks.
```

---

### Case 4: Total Knee Replacement — Osteoarthritis (PA-2026-0404)

**Patient:** Maria Garcia, 68F
**ICD-10:** M17.11 (Primary osteoarthritis, right knee)
**CPT:** 27447 (Total knee arthroplasty)

#### Clinical Note

```
SUBJECTIVE:
68-year-old male with 4-year history of progressive right knee pain. Current pain:
8/10 with ambulation, 5/10 at rest. Walking tolerance reduced to < 1 block. Cannot
climb stairs without handrail support. Requires assistance with sock/shoe donning.
Night pain awakening patient 3-4x/week. Conservative measures attempted over 18+ months:
- Physical therapy: 2 courses (12 weeks each) - transient improvement only
- NSAIDs: naproxen 500mg BID x 6 months, meloxicam 15mg daily x 4 months - GI side
  effects, inadequate relief
- Intra-articular corticosteroid injections: 3 over 14 months - last < 2 weeks relief
- Hyaluronic acid injection (Synvisc-One): completed - no significant improvement
- Unloader brace: worn daily x 6 months - minimal benefit
- Activity modification, weight management (BMI reduced from 32 to 29)

OBJECTIVE:
Vitals: BP 138/84, HR 76, BMI 29.1
Right Knee Exam:
- Visible varus deformity (~8 degrees)
- Moderate effusion with ballottement positive
- ROM: 5-105 degrees (flexion contracture present)
- Crepitus palpable throughout ROM
- Tenderness along medial and lateral joint lines
- Ligaments: stable to varus/valgus stress, Lachman negative
- Neurovascular: DP/PT pulses 2+, sensation intact
Gait: Antalgic, favoring right lower extremity

IMAGING:
Right Knee X-ray (weight-bearing AP, lateral, sunrise views):
- Kellgren-Lawrence Grade IV osteoarthritis
- Complete loss of medial compartment joint space (bone-on-bone)
- Large marginal osteophytes medially and laterally
- Subchondral sclerosis and cyst formation
- 8-degree varus angulation on standing alignment views

ASSESSMENT:
1. Severe primary osteoarthritis right knee, KL Grade IV, bone-on-bone, failed
   exhaustive conservative management over 18+ months.
2. Significant functional impairment affecting ADLs, mobility, quality of life.

PLAN:
1. Right total knee arthroplasty recommended.
2. Pre-operative clearance: cardiology evaluation, EKG, CBC, BMP, PT/INR, Type & Screen.
3. Informed consent obtained. Target surgery within 4-6 weeks pending PA.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 6.8 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 14.2 g/dL | 13.5-17.5 | Normal |
| Platelets | 230 K/uL | 150-400 | Normal |
| Sodium | 140 mEq/L | 136-145 | Normal |
| Potassium | 4.2 mEq/L | 3.5-5.0 | Normal |
| Creatinine | 0.9 mg/dL | 0.7-1.3 | Normal |
| Glucose | 102 mg/dL | 70-100 | Borderline |
| ESR | 18 mm/hr | 0-20 | Normal |
| CRP | 0.8 mg/dL | < 1.0 | Normal |
| PT/INR | 12.1 / 1.0 | 11-13.5 / 0.8-1.1 | Normal |
| HbA1c | 5.8% | < 5.7 | Borderline |
| Vitamin D | 32 ng/mL | 30-100 | Normal |
| Urinalysis | Negative | - | Normal |

---

### Case 5: Cardiac Catheterization — Coronary Artery Disease (PA-2026-0405)

**Patient:** James Wilson, 62M
**ICD-10:** I25.10 (Atherosclerotic heart disease), R07.9 (Chest pain)
**CPT:** 93458 (Left heart catheterization with coronary angiography)

#### Clinical Note

```
SUBJECTIVE:
62-year-old male with HTN, hyperlipidemia, DM Type 2, and 30-pack-year smoking history
(quit 2 years ago), presenting with 6-week history of progressive exertional chest
pressure. Substernal pressure radiating to left arm, provoked by walking 2 blocks or
climbing 1 flight of stairs. Relieved by rest within 5-10 minutes. Associated with
dyspnea on exertion. CCS Angina Class III. Father had MI at age 55.

OBJECTIVE:
Vitals: BP 148/92, HR 78, RR 16, SpO2 97% on RA, BMI 31.4
Cardiac: Regular rate and rhythm, no murmurs, rubs, or gallops. No JVD. No edema.
Lungs: Clear bilaterally. Peripheral pulses: 2+ bilateral DP/PT.

PRIOR TESTING:
12-lead ECG: NSR, nonspecific ST-T wave changes V4-V6.

Echocardiogram (2 weeks prior):
- LVEF: 50% (low-normal)
- Mild concentric LVH
- Grade I diastolic dysfunction
- Regional wall motion abnormality: hypokinesis of inferolateral wall

Exercise Stress Test (Nuclear Myocardial Perfusion Imaging):
- Bruce protocol, achieved 6.2 METs (below predicted)
- Terminated at Stage 2 due to chest pain and 1.5mm horizontal ST depression V4-V6,
  II, III, aVF
- Nuclear imaging: Moderate-sized reversible perfusion defect in inferolateral wall
- POSITIVE for significant inducible myocardial ischemia

ASSESSMENT:
1. Progressive angina CCS Class III with positive stress test showing moderate reversible
   ischemia, concerning for significant obstructive CAD.
2. Multiple cardiovascular risk factors: HTN, HLD, DM2, former smoker, family history.
3. Regional wall motion abnormality correlating with area of ischemia.

PLAN:
1. Left heart catheterization with coronary angiography.
2. Continue aspirin 81mg, atorvastatin 80mg, metoprolol 50mg BID, lisinopril 20mg.
3. Informed consent obtained.
4. PCI with stenting ad hoc if anatomy amenable.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| Troponin I | < 0.01 ng/mL | < 0.04 | Normal |
| Troponin I (repeat) | < 0.01 ng/mL | < 0.04 | Normal |
| BNP | 185 pg/mL | < 100 | Mildly Elevated |
| Total Cholesterol | 248 mg/dL | < 200 | High |
| LDL | 168 mg/dL | < 100 | High |
| HDL | 38 mg/dL | > 40 | Low |
| Triglycerides | 210 mg/dL | < 150 | High |
| HbA1c | 7.8% | < 5.7 | High |
| Creatinine | 1.1 mg/dL | 0.7-1.3 | Normal |
| eGFR | 72 mL/min | > 60 | Normal |
| WBC | 7.1 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 13.4 g/dL | 13.5-17.5 | Borderline Low |
| Platelets | 198 K/uL | 150-400 | Normal |

---

### Case 6: Colonoscopy — Screening (PA-2026-0406)

**Patient:** Emily Chen, 50F
**ICD-10:** Z12.11 (Encounter for screening for malignant neoplasm of colon)
**CPT:** 45378 (Colonoscopy, diagnostic)

#### Clinical Note

```
SUBJECTIVE:
50-year-old male presenting for initial average-risk colorectal cancer screening per
USPSTF and ACS guidelines. No prior colonoscopy. No symptoms: no rectal bleeding,
change in bowel habits, unexplained weight loss, or abdominal pain. Family history:
Father diagnosed with colon polyps at age 62 (not cancer). No personal history of
IBD or prior polyps.

OBJECTIVE:
Vitals: BP 128/80, HR 70, BMI 26.5, Temp 98.4F
Abdomen: Soft, non-tender, non-distended, no masses, normal bowel sounds
Rectal exam: Normal tone, no masses, guaiac negative

ASSESSMENT:
1. Average-risk patient at recommended age (50) for initial colorectal cancer screening
   per USPSTF (Grade A recommendation ages 45-75).
2. No contraindications to procedure.
3. Family history of colonic polyps in first-degree relative increases vigilance.

PLAN:
1. Screening colonoscopy with polypectomy as indicated.
2. Prep: Split-dose PEG (GoLYTELY) bowel preparation.
3. Conscious sedation with midazolam/fentanyl.
4. Informed consent: Risks of bleeding, perforation (< 0.1%), discussed.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 6.5 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 14.8 g/dL | 12.0-16.0 | Normal |
| Platelets | 225 K/uL | 150-400 | Normal |
| PT/INR | 11.8 / 1.0 | 11-13.5 / 0.8-1.1 | Normal |
| BMP | Within normal limits | - | Normal |

---

### Case 7: Lumbar Spinal Fusion — Degenerative Disc Disease (PA-2026-0407)

**Patient:** Michael Brown, 54M
**ICD-10:** M51.16 (Intervertebral disc degeneration, lumbar), M47.816 (Spondylosis)
**CPT:** 22612 (Lumbar spinal fusion)
**Expected Outcome:** DENIED (insufficient conservative treatment documentation)

#### Clinical Note

```
SUBJECTIVE:
54-year-old male construction worker with 14-month history of debilitating low back pain
with left lower extremity radiculopathy (L5 distribution). Pain 8-9/10, constant, worse
with sitting, bending, lifting. Radiates to left lateral thigh, calf, dorsum of foot.
Numbness and tingling in left great toe. Unable to work for 6 months.

Conservative treatment history:
- Physical therapy: 3 courses (36 visits over 12 months) - minimal sustained improvement
- Medications: meloxicam, gabapentin 900mg TID, duloxetine 60mg, tramadol PRN
- Epidural steroid injections: 3 transforaminal L5-S1 - diminishing benefit
- Facet joint injections: 2 bilateral L4-5 medial branch blocks - negative
- Chiropractic: 12 visits - no improvement
- Weight loss: 15 lbs
- Smoking cessation: Quit 8 months ago

NOTE: Documentation of conservative treatment is incomplete. Physical therapy records
not included. No functional outcome measures documented from PT sessions.

OBJECTIVE:
Lumbar Spine Exam:
- Gait: Antalgic with left-sided limp, unable to heel walk on left
- ROM: Flexion severely limited (20 degrees), extension 10 degrees
- SLR: Positive on left at 35 degrees
- Motor: Left EHL 4-/5, left ankle dorsiflexion 4/5
- Sensory: Decreased L5 dermatome left
- DTRs: Achilles diminished on left (1+)

IMAGING:
MRI Lumbar Spine:
- L4-L5: Moderate disc degeneration (Pfirrmann Grade IV), 5mm disc protrusion with
  left foraminal extension, moderate L5 nerve root compression
- L5-S1: Severe disc degeneration (Pfirrmann Grade V), loss of disc height > 50%,
  4mm left paracentral disc protrusion, Grade I anterolisthesis (3mm)
- Modic Type I endplate changes at L5-S1

CT Lumbar Spine:
- Confirms Grade I spondylolisthesis L5-S1
- Facet arthropathy L5-S1 bilateral

Flexion-Extension X-rays:
- L5-S1: 4mm translation with dynamic instability

ASSESSMENT:
1. DDD L5-S1 (severe) and L4-L5 (moderate) with left L5 radiculopathy, dynamic
   instability, Grade I degenerative spondylolisthesis.
2. Failed conservative management over 14 months.
3. Progressive neurological deficit (L5 motor weakness).

PLAN:
1. L4-S1 posterolateral instrumented fusion with PLIF at L5-S1.
2. L5 decompressive laminectomy/foraminotomy.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 7.0 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 15.2 g/dL | 13.5-17.5 | Normal |
| Platelets | 218 K/uL | 150-400 | Normal |
| CRP | 1.2 mg/dL | < 1.0 | Mildly Elevated |
| ESR | 14 mm/hr | 0-20 | Normal |
| HbA1c | 5.4% | < 5.7 | Normal |
| Vitamin D | 28 ng/mL | 30-100 | Low |
| Nicotine/Cotinine | Negative | - | Confirmed non-smoker |
| BMI | 27.8 | 18.5-24.9 | Overweight |

---

### Case 8: CT Abdomen/Pelvis — Epigastric Pain (PA-2026-0408)

**Patient:** Sarah Davis, 55F
**ICD-10:** R10.13 (Epigastric pain), R10.9 (Unspecified abdominal pain)
**CPT:** 74178 (CT abdomen and pelvis with contrast)

#### Clinical Note

```
SUBJECTIVE:
55-year-old female with 2-week history of persistent epigastric and right upper quadrant
abdominal pain. Pain 6-7/10, constant with sharp exacerbations, worse after meals
(especially fatty foods), radiating to right scapular region. Associated nausea,
occasional emesis, early satiety, 10-lb unintentional weight loss over 6 weeks.
No jaundice noticed by patient. No fever/chills. No melena or hematochezia.

OBJECTIVE:
Vitals: BP 136/82, HR 82, Temp 99.1F, RR 16, SpO2 98% RA
Abdomen: Mild distension, positive Murphy's sign, tenderness in epigastrium and RUQ,
no rebound or guarding, no palpable masses, hypoactive bowel sounds
Skin: Mild scleral icterus noted

PRIOR IMAGING:
RUQ Ultrasound: Gallbladder wall thickening (5mm), cholelithiasis, dilated CBD (9mm).
Liver parenchyma heterogeneous with 2.3 cm hypoechoic lesion in right hepatic lobe -
incompletely characterized.

ASSESSMENT:
1. Obstructive jaundice with dilated CBD and cholelithiasis - concern for
   choledocholithiasis vs biliary obstruction.
2. Liver lesion incompletely characterized - requires further evaluation.
3. Unintentional weight loss and elevated CA 19-9 raise concern for malignancy.
4. Mild leukocytosis concerning for possible cholangitis.

PLAN:
1. CT Abdomen/Pelvis with IV contrast to characterize hepatic lesion, evaluate biliary
   obstruction etiology, assess pancreas, evaluate for lymphadenopathy.
2. GI/surgery consultation pending CT results.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 11.2 K/uL | 4.5-11.0 | Mildly Elevated |
| Hemoglobin | 11.8 g/dL | 12.0-16.0 | Mild Anemia |
| Platelets | 310 K/uL | 150-400 | Normal |
| AST | 68 U/L | 10-40 | Elevated |
| ALT | 82 U/L | 7-56 | Elevated |
| Alk Phos | 245 U/L | 44-147 | Elevated |
| Total Bilirubin | 2.8 mg/dL | 0.1-1.2 | Elevated |
| Direct Bilirubin | 2.1 mg/dL | 0-0.3 | Elevated |
| GGT | 180 U/L | 9-48 | Elevated |
| Lipase | 42 U/L | 0-160 | Normal |
| CA 19-9 | 52 U/mL | < 37 | Mildly Elevated |
| CEA | 3.2 ng/mL | < 5.0 | Normal |

---

### Case 9: Shoulder Arthroscopy — Rotator Cuff Tear (PA-2026-0409)

**Patient:** David Martinez, 56M
**ICD-10:** M75.111 (Complete rotator cuff tear, right shoulder)
**CPT:** 29827 (Arthroscopic rotator cuff repair)

#### Clinical Note

```
SUBJECTIVE:
56-year-old right-hand-dominant male carpenter with 6-month history of progressive right
shoulder pain following overhead lifting injury at work. Pain 7/10, worst with overhead
activities, reaching behind back, and at night. Unable to perform work duties.
Conservative treatment:
- Physical therapy: 12 sessions over 8 weeks - plateau, now worsening
- NSAIDs: Naproxen 500mg BID x 3 months - partial relief, GI upset
- Subacromial corticosteroid injection x 2: First = 6 weeks relief, second = 2 weeks
- Activity modification: Restricted from work 4 weeks
- Home exercise program with theraband: no improvement

OBJECTIVE:
Right Shoulder:
- Mild atrophy of supraspinatus and infraspinatus
- Active ROM: Forward flexion 110°, abduction 100°, external rotation 30°
- Passive ROM: Flexion 160°, abduction 150° (greater passive than active = cuff tear)
- Strength: Supraspinatus 3/5, infraspinatus 3+/5, subscapularis 4/5
- Neer impingement: Positive. Hawkins-Kennedy: Positive. Empty can: Positive.
- Drop arm test: Positive. External rotation lag sign: Positive.

MRI RIGHT SHOULDER:
- Full-thickness supraspinatus tendon tear 2.2 cm x 1.5 cm with 1.5 cm retraction
- Partial-thickness infraspinatus tear (50% articular surface)
- Moderate supraspinatus and mild infraspinatus muscle atrophy
- Goutallier Grade 2 supraspinatus, Grade 1 infraspinatus
- Type II acromion (hooked)

ASSESSMENT:
1. Full-thickness rotator cuff tear with partial infraspinatus tear, failed 6 months
   conservative management.
2. Moderate muscle atrophy suggests chronic component - delay may compromise repair.
3. Functional impairment preventing return to work.

PLAN:
1. Right shoulder arthroscopic rotator cuff repair with subacromial decompression.
2. Post-op: Sling x 6 weeks, passive ROM at 2 weeks, strengthening at 12 weeks.
```

---

### Case 10: Chemotherapy Administration — Breast Cancer (PA-2026-0410)

**Patient:** Lisa Anderson, 52F
**ICD-10:** C50.911 (Malignant neoplasm, right breast)
**CPT:** 96413 (Chemotherapy administration, IV infusion)

#### Clinical Note

```
SUBJECTIVE:
52-year-old premenopausal female diagnosed with right breast invasive ductal carcinoma
following screening mammography (BI-RADS 5). Underwent right modified radical mastectomy
with sentinel lymph node biopsy 2 weeks ago. ECOG Performance Status: 0 (fully active).

OBJECTIVE:
Vitals: BP 122/76, HR 68, Wt 154 lbs, Ht 5'5", BSA 1.72 m2
Surgical site well-healed. No lymphedema. Heart RRR, lungs CTA.

PATHOLOGY (Final Surgical):
- Invasive ductal carcinoma, right breast
- Tumor size: 2.8 cm (T2)
- Grade: 3 (poorly differentiated), Nottingham score 8/9
- Margins: Negative (closest 5mm)
- Lymphovascular invasion: Present
- Sentinel lymph nodes: 2 of 12 positive (N1a)
- AJCC Stage: IIB (T2 N1a M0)
- ER: Positive (95%, Allred 8/8)
- PR: Positive (70%, Allred 7/8)
- HER2: Negative (IHC 1+)
- Ki-67: 35% (high)

Oncotype DX Recurrence Score: 32 (High risk)

STAGING WORKUP:
- CT Chest/Abdomen/Pelvis: No distant metastatic disease
- Bone scan: Negative

ASSESSMENT:
1. Right breast IDC, Stage IIB (pT2 N1a M0), ER+/PR+/HER2-, high-grade, high Ki-67,
   high Oncotype DX score (32).
2. Adjuvant chemotherapy indicated per NCCN guidelines given node-positive disease,
   high-grade histology, LVI, and high Oncotype DX score.

PLAN:
1. Adjuvant chemo: TC (Docetaxel 75 mg/m2 + Cyclophosphamide 600 mg/m2) q21 days x 4.
2. Calculated doses: Docetaxel 129 mg, Cyclophosphamide 1032 mg.
3. Pre-medications: Dexamethasone, ondansetron, peg-filgrastim.
4. After chemo: Tamoxifen 20mg daily x 5 years.
5. Treatment intent: Adjuvant with curative intent.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 6.8 K/uL | 4.5-11.0 | Normal |
| ANC | 4,200 /uL | > 1,500 | Normal |
| Hemoglobin | 12.8 g/dL | 12.0-16.0 | Normal |
| Platelets | 245 K/uL | 150-400 | Normal |
| Sodium | 141 mEq/L | 136-145 | Normal |
| Potassium | 4.0 mEq/L | 3.5-5.0 | Normal |
| Creatinine | 0.8 mg/dL | 0.7-1.3 | Normal |
| AST | 22 U/L | 10-40 | Normal |
| ALT | 18 U/L | 7-56 | Normal |
| Alk Phos | 65 U/L | 44-147 | Normal |
| Total Bilirubin | 0.6 mg/dL | 0.1-1.2 | Normal |
| Albumin | 4.2 g/dL | 3.5-5.5 | Normal |
| CEA | 1.8 ng/mL | < 5.0 | Normal |
| CA 27-29 | 24 U/mL | < 38 | Normal |
| LVEF (Echo) | 62% | > 55% | Normal |
| Hep B Surface Ag | Negative | - | Normal |

---

### Case 11: Sleep Study / Polysomnography (PA-2026-0411)

**Patient:** William Taylor, 58M
**ICD-10:** G47.30 (Sleep apnea, unspecified), R06.83 (Snoring)
**CPT:** 95810 (Polysomnography)
**Expected Outcome:** REVIEW (need additional documentation)

#### Clinical Note

```
SUBJECTIVE:
58-year-old male with 2-year history of excessive daytime sleepiness, loud snoring
(reported by spouse), witnessed apneic episodes. Falls asleep in meetings. Near-miss
MVA due to drowsiness 3 months ago. Morning headaches 4-5x/week. Nocturia 2-3x/night.
PMH: HTN (resistant on 3 meds), DM2, obesity.

OBJECTIVE:
Vitals: BP 158/96, HR 78, BMI 38.2, Neck circumference: 18.5 inches
General: Obese male, Mallampati Class IV
HEENT: Crowded oropharynx, enlarged tonsils (3+), elongated soft palate, retrognathia

SCREENING TOOLS:
- Epworth Sleepiness Scale: 16/24 (abnormal; > 10 = excessive daytime sleepiness)
- STOP-BANG Score: 7/8 (High risk for OSA)

NOTE: In-person evaluation completed but sleep diary not provided. No documentation
of whether home sleep test was considered or contraindicated.

ASSESSMENT:
1. High clinical suspicion for moderate-to-severe OSA based on classic symptom triad,
   high-risk screening, physical findings, and comorbidities.
2. Near-miss MVA (safety concern).
3. Resistant hypertension likely exacerbated by untreated OSA.

PLAN:
1. In-laboratory attended polysomnography with split-night protocol.
2. Sleep hygiene counseling.
3. Follow-up within 2 weeks of study.
```

#### Lab Values
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| WBC | 7.4 K/uL | 4.5-11.0 | Normal |
| Hemoglobin | 16.8 g/dL | 13.5-17.5 | Mildly Elevated |
| Hematocrit | 50.2% | 38.3-48.6 | Elevated |
| Platelets | 215 K/uL | 150-400 | Normal |
| Sodium | 140 mEq/L | 136-145 | Normal |
| Potassium | 4.5 mEq/L | 3.5-5.0 | Normal |
| CO2 | 30 mEq/L | 23-29 | Mildly Elevated |
| Creatinine | 1.0 mg/dL | 0.7-1.3 | Normal |
| Glucose | 145 mg/dL | 70-100 | High |
| TSH | 3.2 mIU/L | 0.4-4.0 | Normal |
| HbA1c | 7.4% | < 5.7 | High |

---

### Case 12: Breast Biopsy — Suspicious Mass (PA-2026-0412)

**Patient:** Jennifer Thomas, 47F
**ICD-10:** N63.10 (Unspecified lump, right breast), R92.1 (Mammographic calcification)
**CPT:** 19083 (Breast biopsy with imaging guidance)

#### Clinical Note

```
SUBJECTIVE:
47-year-old female presents after abnormal screening mammogram identified suspicious mass
in right breast. Patient noticed palpable lump in right upper outer quadrant 3 weeks ago.
No nipple discharge, skin changes, or pain. No prior biopsies. Family history: Mother
with breast cancer at 54, maternal aunt at 49. Not on HRT.

OBJECTIVE:
Right Breast: 2.0 cm firm, irregular, fixed mass at 10 o'clock, 5 cm from nipple.
No skin dimpling, peau d'orange, or nipple retraction. No axillary lymphadenopathy.

IMAGING:
Screening Mammogram:
- Right breast: 2.2 cm irregular, spiculated mass at 10 o'clock with pleomorphic
  microcalcifications
- BI-RADS 5 (>= 95% probability malignancy)

Diagnostic Breast Ultrasound:
- 2.1 x 1.8 x 1.5 cm solid, hypoechoic, irregular mass with angular margins,
  taller-than-wide, posterior acoustic shadowing, increased vascularity on Doppler
- Right axilla: Two borderline lymph nodes (cortical thickening to 4mm)
- BI-RADS 5

ASSESSMENT:
1. Right breast mass, BI-RADS 5, highly suspicious for malignancy.
2. Significant family history.
3. Tissue diagnosis mandatory.

PLAN:
1. US-guided core needle biopsy of right breast mass with clip placement.
2. Minimum 4 cores with 14-gauge needle.
3. Pathology: H&E, ER/PR, HER2, Ki-67.
4. If malignant: Breast MRI, surgical and medical oncology consultation.
5. Genetic counseling referral.
```

---

### Case 13: CPAP Device — Obstructive Sleep Apnea (PA-2026-0413)

**Patient:** Christopher Lee, 58M
**ICD-10:** G47.33 (Obstructive sleep apnea)
**CPT/HCPCS:** E0601 (CPAP device)
**Expected Outcome:** DENIED (no qualifying sleep study on file)

#### Clinical Note

```
SUBJECTIVE:
58-year-old male requesting CPAP device for suspected obstructive sleep apnea. Reports
excessive daytime sleepiness, snoring, morning headaches. Spouse reports witnessed apneas.
BMI 36.4. Has NOT undergone sleep study (polysomnography or home sleep test).

NOTE: Patient reports being diagnosed with sleep apnea by primary care physician based
on clinical assessment and STOP-BANG score only. No formal sleep study has been performed
or documented.

OBJECTIVE:
Vitals: BP 152/92, HR 80, BMI 36.4, Neck circumference: 17.5 inches
STOP-BANG Score: 6/8 (High risk)
Epworth Sleepiness Scale: 14/24

ASSESSMENT:
1. Clinical suspicion for OSA based on symptoms and risk factors.
2. HOWEVER: No qualifying polysomnography or home sleep test has been performed.
3. CMS requires documented AHI >= 15 from a qualifying sleep study for CPAP coverage.

PLAN:
1. CPAP requested but sleep study documentation NOT available.
2. Recommend polysomnography first to establish diagnosis and determine appropriate
   CPAP pressure settings.
3. Referral to sleep medicine placed.
```

#### Reason for Expected Denial
CMS National Coverage Determination requires:
- AHI >= 15 events/hour documented by qualifying sleep study (PSG or HST)
- In-person clinical evaluation
- CPAP device cannot be approved without documented sleep study results

---

### Case 14: Coronary Stent Placement (PA-2026-0414)

**Patient:** Amanda White, 62F
**ICD-10:** I25.110 (Atherosclerotic heart disease with unstable angina)
**CPT:** 92928 (PCI with stent placement)

#### Clinical Note

```
SUBJECTIVE:
62-year-old female, post-cardiac catheterization with findings requiring PCI and stenting.

CARDIAC CATHETERIZATION FINDINGS:
Left Heart Catheterization:
- LVEDP: 18 mmHg (mildly elevated)

Coronary Angiography:
- LEFT MAIN: No significant stenosis
- LAD: 40% stenosis in proximal segment (non-obstructive)
- LCx: 85% stenosis in mid-segment (culprit lesion) - correlates with inferolateral
  ischemia on stress test
- RCA: 50% stenosis mid-segment (moderate, non-flow-limiting)
- SYNTAX Score: 12 (low - favors PCI over CABG)

Left Ventriculography:
- LVEF: 48%
- Inferolateral hypokinesis

PROCEDURE PLAN:
PCI with Drug-Eluting Stent (DES) to Mid-LCx:
- 3.0 x 22mm Xience Sierra drug-eluting stent
- Pre-dilation: 2.5 x 15mm compliant balloon
- Post-dilation: 3.25 x 12mm NC balloon

ASSESSMENT:
1. Significant obstructive CAD with 85% mid-LCx stenosis requiring PCI with stenting.
2. Low SYNTAX score favors PCI approach.
3. LVEF 48% with inferolateral hypokinesis.

PLAN:
1. PCI with DES to mid-LCx.
2. DAPT: Aspirin 81mg daily + Clopidogrel 75mg daily x 12 months minimum.
3. Atorvastatin 80mg, Metoprolol 50mg, Lisinopril 20mg.
4. Cardiac rehabilitation referral (36 sessions).
```

#### Lab Values (Post-Catheterization)
| Test | Value | Reference | Status |
|------|-------|-----------|--------|
| Troponin I (pre) | 0.12 ng/mL | < 0.04 | Elevated |
| Troponin I (6hr post-PCI) | 0.42 ng/mL | < 0.04 | Expected rise |
| Creatinine (pre) | 1.1 mg/dL | 0.7-1.3 | Normal |
| Creatinine (post) | 1.2 mg/dL | 0.7-1.3 | Stable |
| Hemoglobin | 13.0 g/dL | 12.0-16.0 | Normal |
| Platelets | 195 K/uL | 150-400 | Normal |

---

### Case 15: Outpatient Physical Rehabilitation — Post-TKA (PA-2026-0415)

**Patient:** Daniel Harris, 68M
**ICD-10:** Z96.651 (Presence of right artificial knee joint), Z87.39 (History of musculoskeletal disorders)
**CPT:** 97140 (Manual therapy techniques)

#### Clinical Note

```
SUBJECTIVE:
68-year-old male, POD 14 following right total knee arthroplasty. Currently using
front-wheeled walker for all ambulation. Cannot drive. Unable to perform IADLs
independently. Lives alone in two-story home with bedroom upstairs.

OBJECTIVE:
Right Knee:
- Incision: Well-healed, staples removed
- ROM: 10-75 degrees (goal: 0-120 by 12 weeks)
- Strength: Quads 3/5, hamstrings 3+/5 (right); 5/5 left
- Gait: Antalgic with walker, step-to pattern
- Berg Balance Scale: 32/56 (moderate fall risk)
- Timed Up and Go (TUG): 28 seconds (> 14 sec = fall risk)
- LEFS: 22/80 (significant limitation)

FUNCTIONAL ASSESSMENT:
- Independent bed mobility
- Min assist seated ADLs
- Mod assist standing ADLs, transfers, gait
- Dependent with stairs, community ambulation

ASSESSMENT:
1. Post right TKA POD 14 with expected functional deficits requiring skilled PT.
2. Significant limitations: ROM 75° (vs 120° goal), strength, balance, gait.
3. High fall risk (TUG 28s, Berg 32).
4. Lives alone with environmental barriers.
5. Good rehabilitation potential.

PLAN:
1. Outpatient PT: 3x/week x 8 weeks (24 visits) then 2x/week x 4 weeks (8 visits).
   Total: 32 visits.
2. Goals (12 weeks): ROM 0-120°, quads 4+/5, independent gait without device,
   reciprocal stairs, TUG < 12s, Berg > 45, LEFS > 55.
3. Interventions: Progressive ROM, closed-chain strengthening, gait training, balance
   training, stair training, manual therapy, aquatic therapy.
```

---

## 5. Sources & References

### Prior Authorization Documentation
- Staffingly — Documents Needed for Prior Authorization: https://staffingly.com/what-documents-are-needed-for-a-smooth-prior-authorization-process/
- AMA — Fixing Prior Auth: https://www.ama-assn.org/practice-management/prior-authorization/fixing-prior-auth-clear-what-s-required-and-when
- CMS Interoperability and Prior Authorization Final Rule: https://www.cms.gov/cms-interoperability-and-prior-authorization-final-rule-cms-0057-f
- Noridian — Lab Documentation Requirements: https://med.noridianmedicare.com/web/jeb/topics/documentation-requirements/lab
- Cellarian — Prior Auth in 2026: https://www.cellarian.com/blog/prior-auth-in-2026-documentation-stops-being-clinical-and-starts-being-proof
- CMS PA Response Times 2026: https://www.wellcare.com/en/texas/providers/bulletins/medicare-prior-authorization-response-times

### Clinical Documentation by Procedure
- Johns Hopkins — Headache Imaging Criteria: https://www.hopkinsmedicine.org/imaging/provider-information/order-wisely/headache
- Kaiser Permanente — Brain MRI Clinical Review: https://wa-provider.kaiserpermanente.org/static/pdf/hosting/clinical/criteria/pdf/mri-brain.pdf
- Noridian — TKA Documentation: https://med.noridianmedicare.com/web/jea/topics/documentation-requirements/total-knee-arthroplasty
- JACC — Cardiac Catheterization Standards: https://www.jacc.org/doi/10.1016/j.jacc.2012.03.003
- CMS — Cardiac Catheterization LCD: https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?LCDId=33557
- SOAP Note AI — Oncology Documentation: https://www.soapnoteai.com/soap-note-guides-and-example/oncology/
- AHA — Heart Failure Management: https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063
- AAFP — Sleep Study Prior Auth: https://www.aafp.org/pubs/fpm/issues/2025/1100/sleep-study-prior-auth.html
- CMS — CPAP Coverage Decision: https://www.cms.gov/medicare-coverage-database/view/ncacal-decision-memo.aspx?proposed=N&NCAId=204
- ACR — BI-RADS: https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/BI-RADS
- CMS — Lumbar Spinal Fusion LCD: https://www.cms.gov/medicare-coverage-database/view/lcd.aspx?lcdid=33382&ver=24
- APTA — Physical Therapy Documentation: https://www.apta.org/your-practice/documentation
- Blue Cross NC — Sleep Apnea Guidelines: https://www.bluecrossnc.com/providers/policies-guidelines-codes/commercial/medical/updates/sleep-apnea-diagnosis-and-medical-management
- Aetna — Spinal Surgery Policy: https://www.aetna.com/cpb/medical/data/700_799/0743.html

### MCP Architecture
- MCP Official Architecture: https://modelcontextprotocol.io/docs/learn/architecture
- MCP Specification 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25
- Thoughtworks — MCP Impact: https://www.thoughtworks.com/en-us/insights/blog/generative-ai/model-context-protocol-mcp-impact-2025
- a16z — Deep Dive Into MCP: https://a16z.com/a-deep-dive-into-mcp-and-the-future-of-ai-tooling/
- Portkey — MCP Primitives: https://portkey.ai/blog/mcp-primitives-the-mental-model-behind-the-protocol/
- IBM — What Is MCP: https://www.ibm.com/think/topics/model-context-protocol
- Anthropic — Code Execution with MCP: https://www.anthropic.com/engineering/code-execution-with-mcp

### Healthcare AI Architecture
- AWS — Transform Healthcare PA with AI Agents: https://aws.amazon.com/blogs/industries/transform-healthcare-prior-authorization-with-ai-agents/
- AWS — PA Using Strands Agents: https://aws.amazon.com/blogs/industries/prior-authorization-for-medical-claims-using-strands-agents/
- AWS — Building Health Care Agents Using Bedrock AgentCore: https://aws.amazon.com/blogs/machine-learning/building-health-care-agents-using-amazon-bedrock-agentcore/
- IDC — Agentic AI for Prior Authorization: https://blogs.idc.com/2025/07/21/the-u-s-healthcare-prior-authorization-crisis-will-agentic-ai-come-to-the-rescue/
- TATEEDA — Healthcare Agentic AI Trends: https://tateeda.com/blog/agentic-ai-in-healthcare-trends-and-types
- Thoughtful AI — Prior Authorization: https://www.thoughtful.ai/prior-authorization
- Menlo Ventures — State of AI in Healthcare: https://menlovc.com/perspective/2025-the-state-of-ai-in-healthcare/
