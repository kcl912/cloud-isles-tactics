-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Cards table: 卡牌數據
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  type VARCHAR(20) NOT NULL CHECK (type IN ('attack', 'defense', 'utility', 'spell')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  effects JSONB NOT NULL DEFAULT '[]',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Characters table: 角色數據
CREATE TABLE IF NOT EXISTS characters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  class VARCHAR(20) NOT NULL CHECK (class IN ('warrior', 'mage', 'rogue', 'priest', 'ranger')),
  base_health INTEGER NOT NULL CHECK (base_health > 0),
  base_energy INTEGER NOT NULL CHECK (base_energy > 0),
  starting_deck JSONB NOT NULL DEFAULT '[]',
  special_ability JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Encounters table: 遭遇戰數據
CREATE TABLE IF NOT EXISTS encounters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  enemy_health INTEGER NOT NULL CHECK (enemy_health > 0),
  enemy_deck JSONB NOT NULL DEFAULT '[]',
  ai_personality VARCHAR(20) NOT NULL CHECK (ai_personality IN ('aggressive', 'defensive', 'balanced', 'chaotic')),
  rewards JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Runs table: 遊戲記錄
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id INTEGER REFERENCES characters(id),
  encounter_id INTEGER REFERENCES encounters(id),
  score INTEGER NOT NULL CHECK (score >= 0),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  result VARCHAR(10) NOT NULL CHECK (result IN ('victory', 'defeat')),
  final_health INTEGER NOT NULL CHECK (final_health >= 0),
  cards_played INTEGER NOT NULL CHECK (cards_played >= 0),
  damage_dealt INTEGER NOT NULL CHECK (damage_dealt >= 0),
  damage_taken INTEGER NOT NULL CHECK (damage_taken >= 0),
  device_id VARCHAR(255),
  signature TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Daily leaderboard table: 每日排行榜
CREATE TABLE IF NOT EXISTS leaderboard_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES runs(id) ON DELETE CASCADE,
  character_id INTEGER REFERENCES characters(id),
  score INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  result VARCHAR(10) NOT NULL,
  leaderboard_date DATE NOT NULL DEFAULT CURRENT_DATE,
  rank_position INTEGER,
  device_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(run_id, leaderboard_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_characters_class ON characters(class);
CREATE INDEX IF NOT EXISTS idx_encounters_difficulty ON encounters(difficulty);
CREATE INDEX IF NOT EXISTS idx_runs_score ON runs(score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_character_id ON runs(character_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily_date_score ON leaderboard_daily(leaderboard_date, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily_rank ON leaderboard_daily(leaderboard_date, rank_position);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cards, characters, encounters (read-only for all users)
CREATE POLICY "Cards are viewable by everyone" ON cards FOR SELECT USING (true);
CREATE POLICY "Characters are viewable by everyone" ON characters FOR SELECT USING (true);
CREATE POLICY "Encounters are viewable by everyone" ON encounters FOR SELECT USING (true);

-- RLS Policies for runs (anonymous users can insert, all can read)
CREATE POLICY "Runs are viewable by everyone" ON runs FOR SELECT USING (true);
CREATE POLICY "Anonymous users can insert runs" ON runs FOR INSERT WITH CHECK (auth.role() = 'anon' OR auth.role() = 'authenticated');
CREATE POLICY "Service role can do anything on runs" ON runs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for leaderboard_daily
CREATE POLICY "Leaderboard is viewable by everyone" ON leaderboard_daily FOR SELECT USING (true);
CREATE POLICY "Service role can do anything on leaderboard" ON leaderboard_daily FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Leaderboard view for easy querying
CREATE OR REPLACE VIEW leaderboard_view AS
SELECT 
  ld.*,
  c.name as character_name,
  c.class as character_class
FROM leaderboard_daily ld
LEFT JOIN characters c ON ld.character_id = c.id
WHERE ld.leaderboard_date = CURRENT_DATE
ORDER BY ld.rank_position ASC;

-- Function to automatically update leaderboard rankings
CREATE OR REPLACE FUNCTION update_daily_rankings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update rankings for the affected date
  WITH ranked_scores AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC, duration_seconds ASC, created_at ASC) as new_rank
    FROM leaderboard_daily 
    WHERE leaderboard_date = COALESCE(NEW.leaderboard_date, OLD.leaderboard_date)
  )
  UPDATE leaderboard_daily 
  SET rank_position = ranked_scores.new_rank
  FROM ranked_scores
  WHERE leaderboard_daily.id = ranked_scores.id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rankings when leaderboard entries change
CREATE OR REPLACE TRIGGER trigger_update_daily_rankings
  AFTER INSERT OR UPDATE OR DELETE ON leaderboard_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_rankings();

-- Insert seed data for cards
INSERT INTO cards (name, description, cost, type, rarity, effects) VALUES
('疾風斬', '對敵人造成 8 點傷害', 2, 'attack', 'common', '[{"type": "damage", "amount": 8}]'),
('烈焰球', '對敵人造成 12 點傷害', 3, 'attack', 'common', '[{"type": "damage", "amount": 12}]'),
('治療術', '恢復 10 點生命值', 2, 'utility', 'common', '[{"type": "heal", "amount": 10}]'),
('鐵壁防禦', '獲得 8 點護甲', 2, 'defense', 'common', '[{"type": "armor", "amount": 8}]'),
('閃電箭', '對敵人造成 6 點傷害，有 30% 機率造成 2 回合暈眩', 2, 'attack', 'uncommon', '[{"type": "damage", "amount": 6}, {"type": "stun", "duration": 2, "chance": 0.3}]'),
('冰霜護盾', '獲得 5 點護甲，有 50% 機率使敵人減速 1 回合', 2, 'defense', 'uncommon', '[{"type": "armor", "amount": 5}, {"type": "slow", "duration": 1, "chance": 0.5}]'),
('劇毒匕首', '對敵人造成 4 點傷害並施加 3 回合中毒', 2, 'attack', 'uncommon', '[{"type": "damage", "amount": 4}, {"type": "poison", "amount": 3, "duration": 3}]'),
('神聖光輝', '恢復 15 點生命值並移除所有負面狀態', 3, 'utility', 'rare', '[{"type": "heal", "amount": 15}, {"type": "cleanse"}]'),
('龍息', '對敵人造成 18 點傷害，有 20% 機率造成燃燒效果', 4, 'attack', 'rare', '[{"type": "damage", "amount": 18}, {"type": "burn", "amount": 4, "duration": 3, "chance": 0.2}]'),
('時空扭曲', '額外獲得 2 點能量並抽 1 張牌', 3, 'utility', 'epic', '[{"type": "energy", "amount": 2}, {"type": "draw", "amount": 1}]'),
('末日審判', '對敵人造成等同於其失去生命值的傷害', 5, 'spell', 'legendary', '[{"type": "damage_percent", "percent": "missing_health"}]')
ON CONFLICT DO NOTHING;

-- Insert seed data for characters
INSERT INTO characters (name, description, class, base_health, base_energy, starting_deck, special_ability) VALUES
('劍聖艾倫', '擅長近戰攻擊的戰士，能夠快速結束戰鬥', 'warrior', 100, 3, '[1, 1, 2, 4, 4, 5, 8]', '{"type": "passive", "name": "戰鬥狂熱", "description": "每次攻擊後獲得 1 點能量", "effects": [{"trigger": "on_attack", "type": "energy", "amount": 1}]}'),
('冰霜法師莉亞', '精通元素魔法的法師，擅長控制戰場', 'mage', 80, 4, '[2, 3, 5, 6, 8, 9, 10]', '{"type": "active", "name": "元素爆發", "description": "消耗所有剩餘能量，每點能量造成 3 點傷害", "cost": 0, "effects": [{"type": "damage_per_energy", "multiplier": 3}]}'),
('暗影刺客卡爾', '潛行於暗影中的刺客，擅長快速致命打擊', 'rogue', 75, 3, '[1, 5, 7, 7, 7, 9, 11]', '{"type": "passive", "name": "致命一擊", "description": "攻擊有 25% 機率造成雙倍傷害", "effects": [{"trigger": "on_attack", "type": "critical", "chance": 0.25, "multiplier": 2}]}'),
('聖光牧師瑪麗', '治療與支援專家，能夠持續作戰', 'priest', 90, 3, '[3, 3, 4, 6, 8, 8, 8]', '{"type": "passive", "name": "聖光庇護", "description": "每回合開始時恢復 3 點生命值", "effects": [{"trigger": "turn_start", "type": "heal", "amount": 3}]}'),
('森林遊俠托爾', '與自然共生的遊俠，擅長遠程攻擊', 'ranger', 85, 3, '[1, 2, 5, 5, 6, 9, 9]', '{"type": "active", "name": "自然之力", "description": "抽 2 張牌並獲得 1 點能量", "cost": 2, "effects": [{"type": "draw", "amount": 2}, {"type": "energy", "amount": 1}]}')
ON CONFLICT DO NOTHING;

-- Insert seed data for encounters
INSERT INTO encounters (name, description, difficulty, enemy_health, enemy_deck, ai_personality, rewards) VALUES
('森林狼王', '徘徊在森林深處的巨狼，攻擊迅猛但防禦較弱', 3, 60, '[1, 1, 1, 5, 5, 7]', 'aggressive', '{"score_base": 100, "score_multiplier": 1.2}'),
('石像守衛', '古老遺跡的守護者，防禦堅固但行動緩慢', 4, 80, '[4, 4, 4, 6, 6, 8]', 'defensive', '{"score_base": 150, "score_multiplier": 1.3}'),
('風暴元素', '不穩定的魔法生物，攻擊模式難以預測', 5, 70, '[2, 5, 6, 9, 9, 10]', 'chaotic', '{"score_base": 200, "score_multiplier": 1.5}'),
('暗影刺客', '神秘的刺客，擅長快速連擊和控制', 6, 65, '[1, 5, 7, 7, 7, 11]', 'balanced', '{"score_base": 250, "score_multiplier": 1.6}'),
('龍族王子', '強大的龍族戰士，各方面能力都很均衡', 8, 120, '[2, 4, 6, 8, 9, 11]', 'balanced', '{"score_base": 400, "score_multiplier": 2.0}'),
('深淵魔王', '來自深淵的恐怖存在，是最終的挑戰', 10, 150, '[9, 9, 10, 11, 11, 11]', 'aggressive', '{"score_base": 600, "score_multiplier": 3.0}')
ON CONFLICT DO NOTHING;

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE OR REPLACE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();