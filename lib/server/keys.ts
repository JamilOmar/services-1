import {BindingKey} from '@loopback/context';
import {LabShareServerConfig} from './types';
// nanmespace for binding configurations
export namespace LabShareBindings {
  export const APP_CONFIG = BindingKey.create<LabShareServerConfig>(
    'labshare.server.config',
  );
}
/**
 * The key used to store log-related via @loopback/metadata and reflection.
 */
export const LABSHARE_METADATA_KEY = 'labshare.server.metadata';