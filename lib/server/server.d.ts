import { Context } from '@loopback/context';
import { Server, Application } from '@loopback/core';
import { LabShareServerConfig } from './types';
export declare class LabShareServer extends Context implements Server {
    app?: Application;
    private options?;
    logger: any;
    private serverApp;
    private servicesActive;
    private server;
    private apiLoader;
    private socketLoader;
    private initialized;
    private _listening;
    constructor(app?: Application, options?: LabShareServerConfig);
    get listening(): boolean;
    io(): any;
    start(): Promise<void>;
    stop(): Promise<void>;
    boot(): Promise<void>;
    private getConfiguration;
    /**
 * @description Allows additional modifications to be made to the Express instance and routes before the services are started up.
 * @param {Function} func - A configuration function that receives all the API routes and the express app as arguments
 * @api
 */
    config(func: any): void;
}
