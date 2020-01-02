import { BindingKey } from '@loopback/context';
import { LabShareServerConfig } from './types';
export declare namespace LabShareBindings {
    const APP_CONFIG: BindingKey<LabShareServerConfig>;
}
/**
 * The key used to store log-related via @loopback/metadata and reflection.
 */
export declare const LABSHARE_METADATA_KEY = "labshare.server.metadata";
