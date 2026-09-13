CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'technician',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT users_role_check
        CHECK (role IN ('technician', 'admin'))
);

CREATE TABLE IF NOT EXISTS equipment (
    equipment_id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    model VARCHAR(150) NOT NULL,
    description TEXT,
    technical_specs TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_cards (
    job_card_id SERIAL PRIMARY KEY,

    technician_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,

    maintenance_type VARCHAR(50) NOT NULL,

    fault_description TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    actions_taken TEXT,
    parts_used TEXT,

    result TEXT,
    photo_data TEXT,
    attachments_data TEXT,
    successful BOOLEAN NOT NULL DEFAULT FALSE,

    status VARCHAR(30) NOT NULL DEFAULT 'submitted',

    confirmed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_card_technician
        FOREIGN KEY (technician_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_job_card_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(equipment_id),

    CONSTRAINT job_card_maintenance_type_check
        CHECK (
            maintenance_type IN (
                'preventive',
                'corrective',
                'inspection',
                'installation',
                'calibration',
                'other'
            )
        ),

    CONSTRAINT job_card_status_check
        CHECK (
            status IN (
                'submitted',
                'under_review',
                'validated',
                'rejected'
            )
        )
);

CREATE TABLE IF NOT EXISTS spare_parts (
    spare_part_id SERIAL PRIMARY KEY,

    submitted_by INTEGER NOT NULL,
    equipment_id INTEGER,

    part_number VARCHAR(150),
    part_name VARCHAR(200) NOT NULL,

    manufacturer VARCHAR(150),
    description TEXT,
    specifications TEXT,
    compatibility TEXT,
    photo_data TEXT,
    attachments_data TEXT,

    availability_status VARCHAR(30) NOT NULL DEFAULT 'available',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_spare_part_submitter
        FOREIGN KEY (submitted_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_spare_part_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(equipment_id),

    CONSTRAINT spare_part_availability_check
        CHECK (
            availability_status IN (
                'available',
                'limited',
                'unavailable',
                'unknown'
            )
        )
);

CREATE TABLE IF NOT EXISTS spare_part_requests (
    request_id SERIAL PRIMARY KEY,

    spare_part_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,
    supplier_technician_id INTEGER NOT NULL,

    requester_contact VARCHAR(100),

    status VARCHAR(30) NOT NULL DEFAULT 'new',

    notes TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_request_spare_part
        FOREIGN KEY (spare_part_id)
        REFERENCES spare_parts(spare_part_id),

    CONSTRAINT fk_requester
        FOREIGN KEY (requester_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_supplier_technician
        FOREIGN KEY (supplier_technician_id)
        REFERENCES users(user_id),

    CONSTRAINT spare_part_request_status_check
        CHECK (
            status IN (
                'new',
                'contacted',
                'negotiating',
                'confirmed',
                'ordered',
                'delivered',
                'completed',
                'cancelled'
            )
        )
);

CREATE TABLE IF NOT EXISTS maintenance_knowledge (
    knowledge_id SERIAL PRIMARY KEY,

    source_job_card_id INTEGER NOT NULL,
    equipment_id INTEGER NOT NULL,

    problem_description TEXT NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    solution TEXT,
    parts_used TEXT,

    successful BOOLEAN NOT NULL DEFAULT TRUE,
    confidence DECIMAL(4,3) NOT NULL DEFAULT 1.000,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_knowledge_job_card
        FOREIGN KEY (source_job_card_id)
        REFERENCES job_cards(job_card_id),

    CONSTRAINT fk_knowledge_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(equipment_id),

    CONSTRAINT knowledge_confidence_check
        CHECK (confidence >= 0 AND confidence <= 1)
);


CREATE TABLE IF NOT EXISTS chat_sessions (
    session_id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_session_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);


CREATE TABLE IF NOT EXISTS chat_messages (
    message_id SERIAL PRIMARY KEY,

    session_id INTEGER NOT NULL,

    role VARCHAR(20) NOT NULL,

    content TEXT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_message_session
        FOREIGN KEY (session_id)
        REFERENCES chat_sessions(session_id),

    CONSTRAINT chat_message_role_check
        CHECK (
            role IN (
                'user',
                'assistant',
                'system'
            )
        )
);