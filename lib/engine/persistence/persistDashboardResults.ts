/**
 * Thin wrapper over writeRunResults that maps engine result types
 * to the persistence contract.
 */

import type { PersistInput, DerivedSignalResult, KeyAreaResult, BodySystemResult, HeroResult } from '../types';
import { writeRunResults } from '../../repositories/writeRunResults';

export async function persistDashboardResults(params: {
  userId: string;
  runId: string;
  engineVersion: string;
  signals: DerivedSignalResult[];
  keyAreas: KeyAreaResult[];
  bodySystems: BodySystemResult[];
  hero: HeroResult;
}): Promise<void> {
  const input: PersistInput = {
    userId: params.userId,
    runId: params.runId,
    engineVersion: params.engineVersion,
    signals: params.signals,
    keyAreas: params.keyAreas,
    bodySystems: params.bodySystems,
    hero: params.hero,
  };
  await writeRunResults(input);
}
