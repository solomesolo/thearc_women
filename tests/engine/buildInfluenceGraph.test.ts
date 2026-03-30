/**
 * Unit tests for Layer 3 — influence graph construction.
 * Verifies that active signals correctly propagate through mapping tables.
 */

import { buildInfluenceGraph } from '../../lib/engine/influence/buildInfluenceGraph';
import type {
  DerivedSignalResult,
  SignalToKeyAreaMapping,
  SignalToBodySystemMapping,
  SignalToHeroMapping,
} from '../../lib/engine/types';

function activeSignal(code: string, strength: 'mild' | 'moderate' | 'strong', conf: 'low' | 'medium' | 'high'): DerivedSignalResult {
  return {
    signalCode: code,
    isActive: true,
    signalStrength: strength,
    confidence: conf,
    lifeStageModifierApplied: null,
    supportingAnswers: [],
    exclusionsTriggered: [],
    triggerScore: 30,
    debugTrace: { evaluatedRule: {}, matchedConditions: [], unmatchedConditions: [], confidenceReason: [], rawTriggerScore: 30, strengthDetermination: 'mild' },
  };
}

function inactiveSignal(code: string): DerivedSignalResult {
  return {
    signalCode: code,
    isActive: false,
    signalStrength: null,
    confidence: 'low',
    lifeStageModifierApplied: null,
    supportingAnswers: [],
    exclusionsTriggered: [],
    triggerScore: 0,
    debugTrace: { evaluatedRule: {}, matchedConditions: [], unmatchedConditions: [], confidenceReason: [], rawTriggerScore: 0, strengthDetermination: 'inactive' },
  };
}

const KA_MAPPINGS: SignalToKeyAreaMapping[] = [
  { id: '1', signalCode: 'SIG_BLOOD_SUGAR_INSTABILITY', keyAreaCode: 'energy', influenceType: 'primary', weight: 2.0, confidenceEffect: 0, lifeStageScope: 'all', conditionsJson: null, approved: true, version: 1 },
  { id: '2', signalCode: 'SIG_BLOOD_SUGAR_INSTABILITY', keyAreaCode: 'metabolism', influenceType: 'primary', weight: 1.5, confidenceEffect: 0, lifeStageScope: 'all', conditionsJson: null, approved: true, version: 1 },
  { id: '3', signalCode: 'SIG_STRESS_LOAD', keyAreaCode: 'stress', influenceType: 'primary', weight: 2.5, confidenceEffect: 0, lifeStageScope: 'all', conditionsJson: null, approved: true, version: 1 },
];

const BS_MAPPINGS: SignalToBodySystemMapping[] = [
  { id: '1', signalCode: 'SIG_BLOOD_SUGAR_INSTABILITY', bodySystemCode: 'SYS_METABOLIC', influenceType: 'primary', weight: 2.0, confidenceEffect: 0, lifeStageScope: 'all', conditionsJson: null, approved: true, version: 1 },
];

const HERO_MAPPINGS: SignalToHeroMapping[] = [
  { id: '1', signalCode: 'SIG_BLOOD_SUGAR_INSTABILITY', heroCode: 'HERO_BLOOD_SUGAR_INSTAB', weight: 2.0, specificityScore: 0.9, priorityScore: 0.8, lifeStageScope: 'all', conditionsJson: null, approved: true, version: 1 },
];

test('active signal contributes to key area score', () => {
  const signals = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'moderate', 'medium')];
  const graph = buildInfluenceGraph(signals, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  expect(graph.keyAreas['energy']).toBeDefined();
  expect(graph.keyAreas['energy']!.confidenceAdjustedScore).toBeGreaterThan(0);
});

test('inactive signal does not contribute to key area', () => {
  const signals = [inactiveSignal('SIG_BLOOD_SUGAR_INSTABILITY')];
  const graph = buildInfluenceGraph(signals, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  expect(graph.keyAreas['energy']).toBeUndefined();
});

test('stronger signal produces higher score than mild', () => {
  const mild = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'mild', 'medium')];
  const strong = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'strong', 'medium')];
  const gMild = buildInfluenceGraph(mild, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  const gStrong = buildInfluenceGraph(strong, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  expect(gStrong.keyAreas['energy']!.confidenceAdjustedScore)
    .toBeGreaterThan(gMild.keyAreas['energy']!.confidenceAdjustedScore);
});

test('higher confidence produces higher confidence-adjusted score', () => {
  const low = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'mild', 'low')];
  const high = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'mild', 'high')];
  const gLow = buildInfluenceGraph(low, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  const gHigh = buildInfluenceGraph(high, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  expect(gHigh.keyAreas['energy']!.confidenceAdjustedScore)
    .toBeGreaterThan(gLow.keyAreas['energy']!.confidenceAdjustedScore);
});

test('signal maps to multiple key areas', () => {
  const signals = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'moderate', 'medium')];
  const graph = buildInfluenceGraph(signals, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  expect(graph.keyAreas['energy']).toBeDefined();
  expect(graph.keyAreas['metabolism']).toBeDefined();
});

test('signal maps to body system', () => {
  const signals = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'moderate', 'medium')];
  const graph = buildInfluenceGraph(signals, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  expect(graph.bodySystems['SYS_METABOLIC']).toBeDefined();
  expect(graph.bodySystems['SYS_METABOLIC']!.confidenceAdjustedScore).toBeGreaterThan(0);
});

test('signal maps to hero with specificity multiplier', () => {
  const signals = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'moderate', 'medium')];
  const graph = buildInfluenceGraph(signals, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  const hero = graph.heroes['HERO_BLOOD_SUGAR_INSTAB'];
  expect(hero).toBeDefined();
  expect(hero!.confidenceAdjustedScore).toBeGreaterThan(0);
});

test('life stage scope filter excludes out-of-scope mappings', () => {
  const periMapping: SignalToKeyAreaMapping[] = [
    { id: '99', signalCode: 'SIG_BLOOD_SUGAR_INSTABILITY', keyAreaCode: 'energy', influenceType: 'primary', weight: 2.0, confidenceEffect: 0, lifeStageScope: 'perimenopause', conditionsJson: null, approved: true, version: 1 },
  ];
  const signals = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'moderate', 'medium')];
  const graph = buildInfluenceGraph(signals, 'reproductive', periMapping, [], []);
  expect(graph.keyAreas['energy']).toBeUndefined();
});

test('contributions array records signal breakdown', () => {
  const signals = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', 'moderate', 'medium')];
  const graph = buildInfluenceGraph(signals, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, HERO_MAPPINGS);
  const contrib = graph.keyAreas['energy']?.contributions[0];
  expect(contrib?.signalCode).toBe('SIG_BLOOD_SUGAR_INSTABILITY');
  expect(contrib?.strengthMultiplier).toBe(1.5); // moderate
  expect(contrib?.confidenceMultiplier).toBe(1.0); // medium
});

test('multiplier values are exact: mild=1.0, moderate=1.5, strong=2.0', () => {
  function scoreFor(strength: 'mild' | 'moderate' | 'strong') {
    const s = [activeSignal('SIG_BLOOD_SUGAR_INSTABILITY', strength, 'medium')];
    const g = buildInfluenceGraph(s, 'reproductive', KA_MAPPINGS, BS_MAPPINGS, []);
    return g.keyAreas['energy']?.contributions[0]?.strengthMultiplier ?? 0;
  }
  expect(scoreFor('mild')).toBe(1.0);
  expect(scoreFor('moderate')).toBe(1.5);
  expect(scoreFor('strong')).toBe(2.0);
});
