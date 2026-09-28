// app.json holds the configuration; this file only adds a check before a build uses it.
import { assertProductionEnv } from './config/assertProductionEnv';

export default ({ config }) => {
  assertProductionEnv(process.env);
  return config;
};
