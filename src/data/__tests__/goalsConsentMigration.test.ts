import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HEALTH_GOALS_CATALOG, isHealthGoal } from '../healthTags';

/**
 * Migration 0012 decides server-side which tags are health goals, with an explicit list. It
 * must say what isHealthGoal says here, or a goal added in one place would slip past the
 * other.
 */
function sqlHealthGoals(): string[] {
  const sql = readFileSync(
    join(__dirname, '../../../supabase/migrations/0012_goals_need_consent.sql'),
    'utf8'
  );
  const match = /v_health_goals constant text\[\] := array\[([^\]]+)\]/.exec(sql);
  if (!match) throw new Error('The health goals list was not found in migration 0012');
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('migration 0012 health goal list', () => {
  test('equals every catalog goal that isHealthGoal accepts', () => {
    const fromCatalog = HEALTH_GOALS_CATALOG.map((goal) => goal.id).filter(isHealthGoal);

    expect([...sqlHealthGoals()].sort()).toEqual([...fromCatalog].sort());
  });

  test('does not list pork-free', () => {
    expect(sqlHealthGoals()).not.toContain('pork_free');
  });
});
