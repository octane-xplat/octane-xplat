CREATE TABLE feedback_observations (
	id TEXT PRIMARY KEY NOT NULL,
	created_at TEXT NOT NULL,
	goal TEXT NOT NULL,
	expected TEXT NOT NULL,
	expectation_basis TEXT NOT NULL,
	actual TEXT NOT NULL,
	target TEXT NOT NULL CHECK (target IN ('web', 'ios', 'android', 'macos', 'linux', 'windows', 'unknown')),
	impact TEXT NOT NULL CHECK (impact IN ('blocked', 'rework', 'investigation', 'surprise')),
	evidence TEXT,
	workaround TEXT
);

CREATE INDEX feedback_observations_created_at ON feedback_observations(created_at);
CREATE INDEX feedback_observations_target_impact ON feedback_observations(target, impact, created_at);
