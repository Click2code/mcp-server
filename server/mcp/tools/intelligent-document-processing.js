/**
 * MCP Tool: Intelligent Document Processing (IDP)
 *
 * Extracts structured JSON data from unstructured documents such as
 * prior authorization requests, clinical notes, lab results, and imaging reports.
 * Simulates OCR, NLP entity extraction, and form field identification.
 *
 * This tool does NOT query the database — it works on document files only.
 */

import { readFileSync, existsSync } from 'fs';

const tool = {
  name: 'intelligent-document-processing',
  description:
    'Extracts structured JSON data from unstructured PDF documents including prior authorization requests, clinical notes, lab results, and imaging reports. Performs OCR text extraction, entity recognition, form field identification, and confidence scoring.',

  inputSchema: {
    type: 'object',
    properties: {
      documentPath: {
        type: 'string',
        description: 'File path to the PDF document to process',
      },
      documentType: {
        type: 'string',
        enum: ['prior-auth-request', 'clinical-notes', 'lab-results', 'imaging-report', 'mixed'],
        description: 'Type of document to guide extraction strategy',
      },
      extractionOptions: {
        type: 'object',
        properties: {
          extractEntities: { type: 'boolean', default: true },
          extractFormFields: { type: 'boolean', default: true },
          extractTables: { type: 'boolean', default: true },
          ocrMode: {
            type: 'string',
            enum: ['standard', 'high-accuracy', 'fast'],
            default: 'standard',
          },
        },
        description: 'Options to control extraction behavior',
      },
    },
    required: ['documentPath', 'documentType'],
  },

  outputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
      documentType: { type: 'string' },
      pageCount: { type: 'integer' },
      processingTime: { type: 'string' },
      overallConfidence: { type: 'number' },
      rawTextPreview: { type: 'string' },
      entities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            value: { type: 'string' },
            confidence: { type: 'number' },
            location: { type: 'string' },
          },
        },
      },
      formFields: { type: 'object' },
      tables: { type: 'array' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            pageNumber: { type: 'integer' },
          },
        },
      },
    },
  },

  execute: async (params) => {
    const { documentPath, documentType, extractionOptions = {} } = params;
    const startTime = Date.now();

    // Simulate OCR processing delay
    await delay(800 + Math.random() * 400);

    // Check if file exists and get size
    let fileSize = 0;
    let fileExists = false;
    try {
      if (existsSync(documentPath)) {
        const stats = readFileSync(documentPath);
        fileSize = stats.length;
        fileExists = true;
      }
    } catch {
      // File may not exist yet during processing
    }

    const pageCount = fileExists ? Math.max(2, Math.floor(fileSize / 15000)) : 3;
    const documentId = documentPath.split('/').pop()?.replace('.pdf', '') || 'unknown';

    // Extract entities based on document type
    const entities = extractEntitiesByType(documentType, documentId);
    const formFields = extractFormFields(documentType, documentId);
    const sections = extractSections(documentType);
    const tables = extractionOptions.extractTables !== false ? extractTables(documentType) : [];

    const processingTime = Date.now() - startTime;
    const overallConfidence = 0.89 + Math.random() * 0.09; // 0.89-0.98

    return {
      documentId,
      documentType,
      pageCount,
      processingTime: `${processingTime}ms`,
      overallConfidence: parseFloat(overallConfidence.toFixed(3)),
      ocrEngine: 'Textract-NLP-v3.2',
      rawTextPreview: generateRawTextPreview(documentType),
      entities,
      formFields,
      tables,
      sections,
      metadata: {
        fileExists,
        fileSizeBytes: fileSize,
        extractionMode: extractionOptions.ocrMode || 'standard',
        entitiesExtracted: entities.length,
        fieldsIdentified: Object.keys(formFields).length,
        tablesFound: tables.length,
        sectionsFound: sections.length,
      },
    };
  },
};

function extractEntitiesByType(documentType, documentId) {
  const baseEntities = [
    { type: 'PATIENT_NAME', value: '', confidence: 0.97, location: 'page1:header' },
    { type: 'DATE_OF_BIRTH', value: '', confidence: 0.96, location: 'page1:header' },
    { type: 'MEMBER_ID', value: '', confidence: 0.98, location: 'page1:header' },
    { type: 'PROVIDER_NAME', value: '', confidence: 0.95, location: 'page1:header' },
    { type: 'PROVIDER_NPI', value: '', confidence: 0.99, location: 'page1:header' },
    { type: 'DATE_OF_SERVICE', value: '', confidence: 0.94, location: 'page1:body' },
  ];

  const typeSpecificEntities = {
    'prior-auth-request': [
      { type: 'PROCEDURE_CODE', value: '', confidence: 0.97, location: 'page1:body' },
      { type: 'PROCEDURE_NAME', value: '', confidence: 0.94, location: 'page1:body' },
      { type: 'DIAGNOSIS_CODE_PRIMARY', value: '', confidence: 0.96, location: 'page1:body' },
      { type: 'DIAGNOSIS_CODE_SECONDARY', value: '', confidence: 0.93, location: 'page1:body' },
      { type: 'URGENCY_INDICATOR', value: '', confidence: 0.91, location: 'page1:body' },
      { type: 'AUTHORIZATION_TYPE', value: 'Prior Authorization', confidence: 0.99, location: 'page1:header' },
    ],
    'clinical-notes': [
      { type: 'CHIEF_COMPLAINT', value: '', confidence: 0.92, location: 'page1:subjective' },
      { type: 'VITAL_SIGNS', value: '', confidence: 0.95, location: 'page1:objective' },
      { type: 'ASSESSMENT', value: '', confidence: 0.90, location: 'page2:assessment' },
      { type: 'TREATMENT_PLAN', value: '', confidence: 0.91, location: 'page2:plan' },
      { type: 'MEDICATIONS', value: '', confidence: 0.93, location: 'page2:plan' },
      { type: 'FOLLOW_UP', value: '', confidence: 0.89, location: 'page2:plan' },
    ],
    'lab-results': [
      { type: 'LAB_TEST_NAME', value: '', confidence: 0.97, location: 'page1:results' },
      { type: 'LAB_VALUE', value: '', confidence: 0.96, location: 'page1:results' },
      { type: 'REFERENCE_RANGE', value: '', confidence: 0.98, location: 'page1:results' },
      { type: 'ABNORMAL_FLAG', value: '', confidence: 0.95, location: 'page1:results' },
      { type: 'ORDERING_PHYSICIAN', value: '', confidence: 0.94, location: 'page1:header' },
      { type: 'SPECIMEN_DATE', value: '', confidence: 0.97, location: 'page1:header' },
    ],
    'imaging-report': [
      { type: 'IMAGING_MODALITY', value: '', confidence: 0.98, location: 'page1:header' },
      { type: 'BODY_REGION', value: '', confidence: 0.96, location: 'page1:header' },
      { type: 'FINDINGS', value: '', confidence: 0.88, location: 'page1:body' },
      { type: 'IMPRESSION', value: '', confidence: 0.90, location: 'page1:impression' },
      { type: 'RADIOLOGIST', value: '', confidence: 0.95, location: 'page1:footer' },
      { type: 'COMPARISON_STUDY', value: '', confidence: 0.85, location: 'page1:body' },
    ],
    mixed: [
      { type: 'PROCEDURE_CODE', value: '', confidence: 0.95, location: 'page1:body' },
      { type: 'DIAGNOSIS_CODE_PRIMARY', value: '', confidence: 0.94, location: 'page1:body' },
      { type: 'CLINICAL_FINDINGS', value: '', confidence: 0.88, location: 'page2:body' },
      { type: 'LAB_RESULTS_SUMMARY', value: '', confidence: 0.90, location: 'page3:body' },
    ],
  };

  return [...baseEntities, ...(typeSpecificEntities[documentType] || typeSpecificEntities.mixed)];
}

function extractFormFields(documentType) {
  const baseFields = {
    patientName: { value: '', confidence: 0.97, fieldType: 'text' },
    dateOfBirth: { value: '', confidence: 0.96, fieldType: 'date' },
    memberId: { value: '', confidence: 0.98, fieldType: 'text' },
    providerName: { value: '', confidence: 0.95, fieldType: 'text' },
    providerNPI: { value: '', confidence: 0.99, fieldType: 'text' },
    facilityName: { value: '', confidence: 0.93, fieldType: 'text' },
    dateOfService: { value: '', confidence: 0.94, fieldType: 'date' },
  };

  if (documentType === 'prior-auth-request' || documentType === 'mixed') {
    return {
      ...baseFields,
      procedureCode: { value: '', confidence: 0.97, fieldType: 'code' },
      procedureName: { value: '', confidence: 0.94, fieldType: 'text' },
      primaryDiagnosis: { value: '', confidence: 0.96, fieldType: 'code' },
      secondaryDiagnosis: { value: '', confidence: 0.92, fieldType: 'code' },
      urgency: { value: '', confidence: 0.90, fieldType: 'select' },
      authorizationType: { value: 'Prior Authorization', confidence: 0.99, fieldType: 'text' },
      requestedServices: { value: '', confidence: 0.91, fieldType: 'text' },
      clinicalJustification: { value: '', confidence: 0.85, fieldType: 'freetext' },
    };
  }

  return baseFields;
}

function extractSections(documentType) {
  const sectionsByType = {
    'prior-auth-request': [
      { title: 'Patient Demographics', content: 'Patient identification and insurance information', pageNumber: 1 },
      { title: 'Requested Service', content: 'Procedure details and clinical codes', pageNumber: 1 },
      { title: 'Clinical Justification', content: 'Medical necessity narrative and supporting evidence', pageNumber: 2 },
      { title: 'Provider Attestation', content: 'Physician signature and certification', pageNumber: 3 },
    ],
    'clinical-notes': [
      { title: 'Subjective', content: 'Chief complaint, HPI, ROS, medications', pageNumber: 1 },
      { title: 'Objective', content: 'Vital signs, physical examination findings', pageNumber: 1 },
      { title: 'Assessment', content: 'Clinical diagnoses and impressions', pageNumber: 2 },
      { title: 'Plan', content: 'Treatment plan, orders, follow-up', pageNumber: 2 },
    ],
    'lab-results': [
      { title: 'Patient Information', content: 'Demographics and ordering info', pageNumber: 1 },
      { title: 'Test Results', content: 'Laboratory values with reference ranges', pageNumber: 1 },
      { title: 'Interpretation', content: 'Clinical interpretation and flags', pageNumber: 2 },
    ],
    'imaging-report': [
      { title: 'Examination Details', content: 'Modality, technique, contrast', pageNumber: 1 },
      { title: 'Findings', content: 'Detailed anatomical observations', pageNumber: 1 },
      { title: 'Impression', content: 'Summary diagnosis and recommendations', pageNumber: 1 },
    ],
    mixed: [
      { title: 'Request Form', content: 'Prior authorization request details', pageNumber: 1 },
      { title: 'Clinical Notes', content: 'Supporting clinical documentation', pageNumber: 2 },
      { title: 'Supporting Evidence', content: 'Lab results, imaging, treatment history', pageNumber: 3 },
    ],
  };

  return sectionsByType[documentType] || sectionsByType.mixed;
}

function extractTables(documentType) {
  if (documentType === 'lab-results' || documentType === 'mixed') {
    return [
      {
        title: 'Laboratory Results',
        headers: ['Test', 'Value', 'Reference Range', 'Flag'],
        rows: [
          ['WBC', '', '4.5-11.0 K/uL', ''],
          ['Hemoglobin', '', '12.0-17.5 g/dL', ''],
          ['Platelets', '', '150-400 K/uL', ''],
          ['Sodium', '', '136-145 mEq/L', ''],
          ['Potassium', '', '3.5-5.0 mEq/L', ''],
          ['Creatinine', '', '0.7-1.3 mg/dL', ''],
        ],
        confidence: 0.94,
      },
    ];
  }
  return [];
}

function generateRawTextPreview(documentType) {
  const previews = {
    'prior-auth-request':
      'PRIOR AUTHORIZATION REQUEST FORM\n\nPatient Information:\nName: [extracted]\nDOB: [extracted]\nMember ID: [extracted]\n\nRequested Service:\nProcedure: [extracted]\nCPT Code: [extracted]\nDiagnosis: [extracted]\n\nClinical Justification:\n[extracted narrative text]...',
    'clinical-notes':
      'CLINICAL PROGRESS NOTE\n\nSUBJECTIVE:\nPatient presents with [chief complaint]...\n\nOBJECTIVE:\nVitals: [extracted]\nExam: [extracted findings]...\n\nASSESSMENT:\n[diagnoses]...\n\nPLAN:\n[treatment plan]...',
    'lab-results':
      'LABORATORY REPORT\n\nOrdering Physician: [extracted]\nSpecimen Date: [extracted]\n\nRESULTS:\n[table of lab values with reference ranges]...',
    'imaging-report':
      'RADIOLOGY REPORT\n\nModality: [extracted]\nBody Region: [extracted]\n\nFINDINGS:\n[detailed findings]...\n\nIMPRESSION:\n[summary]...',
    mixed:
      'PRIOR AUTHORIZATION SUBMISSION\n\nPage 1: Request Form\nPage 2: Clinical Notes\nPage 3: Supporting Evidence\n\n[extracted content from multiple document types]...',
  };
  return previews[documentType] || previews.mixed;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default tool;
