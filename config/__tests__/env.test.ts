import { env } from '../env';

describe('Application Environment Configuration', () => {
  it('loads valid default port 8081', () => {
    expect(env.port).toBe(8081);
  });

  it('defaults appEnv to development', () => {
    expect(env.appEnv).toBe('development');
  });

  it('correctly reports AI and cloud sync status when keys are omitted', () => {
    expect(typeof env.isAiConfigured).toBe('boolean');
    expect(typeof env.isCloudSyncConfigured).toBe('boolean');
  });
});
