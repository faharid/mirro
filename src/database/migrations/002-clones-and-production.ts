export const migration002 = `
CREATE TABLE IF NOT EXISTS user_summaries (
  user_id VARCHAR(255) PRIMARY KEY,
  summary TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persona_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  questionnaire JSONB DEFAULT '{}',
  mirror_card JSONB,
  document_insights JSONB DEFAULT '[]',
  interview_complete BOOLEAN NOT NULL DEFAULT false,
  agent_config_id UUID REFERENCES agent_configs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persona_clones_user ON persona_clones(user_id);

CREATE TABLE IF NOT EXISTS clone_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id UUID NOT NULL REFERENCES persona_clones(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  insights JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clone_interview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clone_id UUID NOT NULL REFERENCES persona_clones(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clone_interview_clone ON clone_interview_messages(clone_id);

CREATE TABLE IF NOT EXISTS llm_response_cache (
  prompt_hash VARCHAR(64) PRIMARY KEY,
  response TEXT NOT NULL,
  provider VARCHAR(50),
  model VARCHAR(100),
  usage JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_token_usage (
  user_id VARCHAR(255) PRIMARY KEY,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE agent_configs ADD COLUMN IF NOT EXISTS clone_id UUID REFERENCES persona_clones(id) ON DELETE SET NULL;
`;
