
-- VyapaarMitra Database Schema

-- Users table (already exists, but including for completeness)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) DEFAULT 'msme' CHECK (role IN ('msme', 'agent', 'supplier', 'admin')),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MSME Profiles
CREATE TABLE IF NOT EXISTS msme_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_type VARCHAR(100),
    gst_number VARCHAR(15),
    udyam_number VARCHAR(19),
    industry_sector VARCHAR(100),
    business_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    annual_turnover DECIMAL(15,2),
    employee_count INTEGER,
    onboarding_status VARCHAR(50) DEFAULT 'pending' 
        CHECK (onboarding_status IN ('pending', 'profile_created', 'documents_uploaded', 'payment_completed', 'onboarded')),
    payment_status VARCHAR(50) DEFAULT 'pending',
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent Profiles
CREATE TABLE IF NOT EXISTS agent_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    agent_type VARCHAR(50) NOT NULL 
        CHECK (agent_type IN ('loan_broker', 'procurement_agent', 'compliance_consultant', 'business_advisor')),
    specialization TEXT,
    experience_years INTEGER,
    commission_rate DECIMAL(5,2),
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_deals INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verification_documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Profiles
CREATE TABLE IF NOT EXISTS supplier_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    business_type VARCHAR(100),
    gst_number VARCHAR(15),
    specialization TEXT[],
    service_areas TEXT[],
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_orders INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Tracking
CREATE TABLE IF NOT EXISTS compliance_tracking (
    id SERIAL PRIMARY KEY,
    msme_id INTEGER REFERENCES msme_profiles(id) ON DELETE CASCADE,
    compliance_type VARCHAR(50) NOT NULL 
        CHECK (compliance_type IN ('gst', 'udyam', 'environmental', 'labor', 'fire_safety', 'pollution_control')),
    priority VARCHAR(20) DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    due_date DATE,
    completion_date DATE,
    notes TEXT,
    documents JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan Applications
CREATE TABLE IF NOT EXISTS loan_applications (
    id SERIAL PRIMARY KEY,
    msme_id INTEGER REFERENCES msme_profiles(id) ON DELETE CASCADE,
    loan_amount DECIMAL(15,2) NOT NULL,
    loan_purpose VARCHAR(200),
    loan_type VARCHAR(50),
    tenure_months INTEGER,
    lender_preference VARCHAR(100),
    business_plan TEXT,
    financial_documents JSONB,
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed')),
    agent_id INTEGER REFERENCES agent_profiles(id),
    lender_response JSONB,
    interest_rate DECIMAL(5,2),
    processing_fee DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procurement Requests
CREATE TABLE IF NOT EXISTS procurement_requests (
    id SERIAL PRIMARY KEY,
    msme_id INTEGER REFERENCES msme_profiles(id) ON DELETE CASCADE,
    material_type VARCHAR(100) NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    max_budget DECIMAL(15,2) NOT NULL,
    delivery_location TEXT NOT NULL,
    required_by DATE NOT NULL,
    specifications TEXT,
    quality_requirements TEXT,
    status VARCHAR(20) DEFAULT 'open' 
        CHECK (status IN ('open', 'awarded', 'completed', 'cancelled')),
    agent_id INTEGER REFERENCES agent_profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Procurement Quotes
CREATE TABLE IF NOT EXISTS procurement_quotes (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES procurement_requests(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES supplier_profiles(id) ON DELETE CASCADE,
    price_per_unit DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    delivery_days INTEGER NOT NULL,
    payment_terms VARCHAR(200),
    warranty VARCHAR(200),
    additional_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Negotiations
CREATE TABLE IF NOT EXISTS negotiations (
    id SERIAL PRIMARY KEY,
    msme_id INTEGER REFERENCES msme_profiles(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES agent_profiles(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL 
        CHECK (service_type IN ('loan', 'procurement', 'compliance', 'business_advisory')),
    description TEXT,
    proposed_terms JSONB,
    counter_terms JSONB,
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'negotiating', 'accepted', 'rejected', 'completed')),
    commission_amount DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_type VARCHAR(50) NOT NULL 
        CHECK (payment_type IN ('onboarding', 'commission', 'procurement', 'subscription')),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_msme_profiles_user_id ON msme_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_profiles_user_id ON supplier_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_msme_id ON compliance_tracking(msme_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tracking_due_date ON compliance_tracking(due_date);
CREATE INDEX IF NOT EXISTS idx_loan_applications_msme_id ON loan_applications(msme_id);
CREATE INDEX IF NOT EXISTS idx_procurement_requests_msme_id ON procurement_requests(msme_id);
CREATE INDEX IF NOT EXISTS idx_procurement_quotes_request_id ON procurement_quotes(request_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_msme_id ON negotiations(msme_id);
CREATE INDEX IF NOT EXISTS idx_negotiations_agent_id ON negotiations(agent_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Insert sample data for testing
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@vyapaarmitra.in', '$2a$10$example', 'Admin', 'User', 'admin'),
('test@msme.com', '$2a$10$example', 'Test', 'MSME', 'msme'),
('agent@test.com', '$2a$10$example', 'Test', 'Agent', 'agent'),
('supplier@test.com', '$2a$10$example', 'Test', 'Supplier', 'supplier')
ON CONFLICT (email) DO NOTHING;
