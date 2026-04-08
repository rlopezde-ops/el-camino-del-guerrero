import Dexie, { type EntityTable } from 'dexie';
import type { WarriorProfile, TechniqueProgress, SessionResult } from './types';

const db = new Dexie('SpanishKidsDojo') as Dexie & {
  profiles: EntityTable<WarriorProfile, 'id'>;
  techniqueProgress: EntityTable<TechniqueProgress, 'id'>;
  sessionResults: EntityTable<SessionResult, 'id'>;
};

db.version(1).stores({
  profiles: '++id, name',
  techniqueProgress: '++id, profileId, techniqueId, [profileId+techniqueId], nextReview',
  sessionResults: '++id, profileId, unitId, completedAt',
});

export { db };
