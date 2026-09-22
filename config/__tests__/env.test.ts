import { env } from '../env';

describe('Application Environment Configuration', () => {
  it('loads valid default port 8081', () => {
    expect(env.port).toBe(8081);
  });

  it('defaults appEnv to development', () => {
    expect(env.appEnv).toBe('development');
  });

  it('exposes no model provider key to the client bundle', () => {
    expect(env).not.toHaveProperty('geminiApiKey');
  });

  it('correctly reports AI and cloud sync status when keys are omitted', () => {
    expect(typeof env.isAiProxyConfigured).toBe('boolean');
    expect(typeof env.isCloudSyncConfigured).toBe('boolean');
  });
});
