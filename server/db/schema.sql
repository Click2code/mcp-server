-- Prior Authorization System - PostgreSQL Schema
-- Clean reset: drop tables in reverse dependency order

DROP TABLE IF EXISTS trace_logs CASCADE;
DROP TABLE IF EXISTS workflow_steps CASCADE;
DROP TABLE IF EXISTS prior_auth_requests CASCADE;
DROP TABLE IF EXISTS coverage_policies CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- =============================================================================
-- 1. members (Member 360 Data Product)
-- =============================================================================
CREATE TABLE members (
    id                  SERIAL PRIMARY KEY,
    member_id           VARCHAR(20) UNIQUE NOT NULL,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    date_of_birth       DATE,
    gender              VARCHAR(10),
    ssn_last4           VARCHAR(4),
    address_line1       VARCHAR(200),
    address_city        VARCHAR(100),
    address_state       VARCHAR(2),
    address_zip         VARCHAR(10),
    phone               VARCHAR(20),
    email               VARCHAR(200),
    plan_type           VARCHAR(50),
    plan_id             VARCHAR(20),
    group_number        VARCHAR(20),
    effective_date      DATE,
    termination_date    DATE,
    coverage_level      VARCHAR(20),        -- Individual / Family
    copay_primary       DECIMAL(10,2),
    copay_specialist    DECIMAL(10,2),
    deductible_annual   DECIMAL(10,2),
    deductible_met      DECIMAL(10,2),
    max_out_of_pocket   DECIMAL(10,2),
    oop_met             DECIMAL(10,2),
    is_active           BOOLEAN DEFAULT true,
    pre_auth_required   BOOLEAN DEFAULT true,
    pcp_name            VARCHAR(200),
    pcp_npi             VARCHAR(10),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 2. claims (Claims History Data Product)
-- =============================================================================
CREATE TABLE claims (
    id                      SERIAL PRIMARY KEY,
    claim_id                VARCHAR(20) UNIQUE NOT NULL,
    member_id               VARCHAR(20) REFERENCES members(member_id),
    service_date            DATE,
    provider_name           VARCHAR(200),
    provider_npi            VARCHAR(10),
    facility_name           VARCHAR(200),
    cpt_code                VARCHAR(10),
    cpt_description         VARCHAR(500),
    icd10_codes             TEXT[],
    billed_amount           DECIMAL(10,2),
    allowed_amount          DECIMAL(10,2),
    paid_amount             DECIMAL(10,2),
    patient_responsibility  DECIMAL(10,2),
    claim_status            VARCHAR(20),    -- paid / denied / pending
    denial_reason           VARCHAR(500),
    service_type            VARCHAR(50),
    place_of_service        VARCHAR(50),
    auth_number             VARCHAR(20),
    created_at              TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 3. coverage_policies (NCD / LCD Guidelines)
-- =============================================================================
CREATE TABLE coverage_policies (
    id                              SERIAL PRIMARY KEY,
    policy_id                       VARCHAR(20) UNIQUE NOT NULL,
    policy_type                     VARCHAR(10),        -- NCD / LCD / internal
    title                           VARCHAR(500),
    procedure_codes                 TEXT[],
    diagnosis_codes                 TEXT[],
    effective_date                  DATE,
    termination_date                DATE,
    medical_necessity_criteria      JSONB,
    required_documentation          JSONB,
    approval_conditions             JSONB,
    denial_conditions               JSONB,
    review_triggers                 JSONB,
    age_restrictions                JSONB,
    gender_restrictions             VARCHAR(10),
    frequency_limits                JSONB,
    conservative_treatment_required BOOLEAN,
    conservative_treatment_details  JSONB,
    source_url                      VARCHAR(500),
    last_reviewed                   DATE,
    created_at                      TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 4. prior_auth_requests
-- =============================================================================
CREATE TABLE prior_auth_requests (
    id                  SERIAL PRIMARY KEY,
    request_id          VARCHAR(20) UNIQUE NOT NULL,
    patient_name        VARCHAR(200),
    patient_dob         DATE,
    member_id           VARCHAR(20) REFERENCES members(member_id),
    provider            VARCHAR(200),
    provider_npi        VARCHAR(10),
    procedure_name      VARCHAR(500),
    procedure_code      VARCHAR(20),
    diagnosis_codes     TEXT[],
    submitted_date      TIMESTAMP,
    status              VARCHAR(20) DEFAULT 'pending',
    priority            VARCHAR(10) DEFAULT 'medium',
    assigned_to         VARCHAR(200),
    document_url        VARCHAR(500),
    decision_rationale  TEXT,
    decision_date       TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 5. workflow_steps
-- =============================================================================
CREATE TABLE workflow_steps (
    id              SERIAL PRIMARY KEY,
    request_id      VARCHAR(20) REFERENCES prior_auth_requests(request_id),
    step_number     INTEGER,
    name            VARCHAR(200),
    description     TEXT,
    status          VARCHAR(20) DEFAULT 'pending',
    timestamp       VARCHAR(20),
    details         JSONB,
    tool_name       VARCHAR(100),
    tool_input      JSONB,
    tool_output     JSONB,
    duration_ms     INTEGER,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 6. trace_logs
-- =============================================================================
CREATE TABLE trace_logs (
    id              SERIAL PRIMARY KEY,
    request_id      VARCHAR(20) REFERENCES prior_auth_requests(request_id),
    timestamp       VARCHAR(20),
    level           VARCHAR(10),
    category        VARCHAR(100),
    message         TEXT,
    details         JSONB,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- members
CREATE INDEX idx_members_member_id       ON members(member_id);
CREATE INDEX idx_members_last_name       ON members(last_name);
CREATE INDEX idx_members_plan_id         ON members(plan_id);
CREATE INDEX idx_members_group_number    ON members(group_number);
CREATE INDEX idx_members_is_active       ON members(is_active);

-- claims
CREATE INDEX idx_claims_member_id        ON claims(member_id);
CREATE INDEX idx_claims_service_date     ON claims(service_date);
CREATE INDEX idx_claims_cpt_code         ON claims(cpt_code);
CREATE INDEX idx_claims_claim_status     ON claims(claim_status);
CREATE INDEX idx_claims_provider_npi     ON claims(provider_npi);
CREATE INDEX idx_claims_auth_number      ON claims(auth_number);

-- coverage_policies
CREATE INDEX idx_coverage_policies_policy_type     ON coverage_policies(policy_type);
CREATE INDEX idx_coverage_policies_effective_date   ON coverage_policies(effective_date);
CREATE INDEX idx_coverage_policies_procedure_codes  ON coverage_policies USING GIN(procedure_codes);
CREATE INDEX idx_coverage_policies_diagnosis_codes  ON coverage_policies USING GIN(diagnosis_codes);

-- prior_auth_requests
CREATE INDEX idx_prior_auth_member_id    ON prior_auth_requests(member_id);
CREATE INDEX idx_prior_auth_status       ON prior_auth_requests(status);
CREATE INDEX idx_prior_auth_priority     ON prior_auth_requests(priority);
CREATE INDEX idx_prior_auth_provider_npi ON prior_auth_requests(provider_npi);
CREATE INDEX idx_prior_auth_procedure    ON prior_auth_requests(procedure_code);
CREATE INDEX idx_prior_auth_submitted    ON prior_auth_requests(submitted_date);

-- workflow_steps
CREATE INDEX idx_workflow_request_id     ON workflow_steps(request_id);
CREATE INDEX idx_workflow_step_number    ON workflow_steps(request_id, step_number);
CREATE INDEX idx_workflow_status         ON workflow_steps(status);

-- trace_logs
CREATE INDEX idx_trace_request_id        ON trace_logs(request_id);
CREATE INDEX idx_trace_level             ON trace_logs(level);
CREATE INDEX idx_trace_category          ON trace_logs(category);
