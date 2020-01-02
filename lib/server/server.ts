import {
    inject,
    Context,
    MetadataInspector,
    BindingScope,
} from '@loopback/context';
import {
    Server,
    Application,
    CoreBindings,
    ControllerClass,
} from '@loopback/core';
import * as _ from 'lodash';
import { HttpServer } from '@loopback/http-server';
import { LabShareServerConfig } from './types';
import { LabShareBindings, LABSHARE_METADATA_KEY } from './keys';
const
    express = require('express'),
    crypto = require('crypto'),
    serverUtils = require('../server-utils'),
    { SocketIOLoader, Loader } = require('../api'),
    dotEnv = require('dotenv'),
    path = require('path'),
    status = require('../middleware/status'),
    memoryStore = require('memorystore');
export class LabShareServer extends Context implements Server {

    public logger:any;
    private serverApp = express();
    private servicesActive = false;
    private server: HttpServer;
    private apiLoader;
    private socketLoader;
    private initialized: boolean = false;
    // required property for the Server
    private _listening: boolean = false;
    constructor(
        @inject(CoreBindings.APPLICATION_INSTANCE) public app?: Application,
        @inject(LabShareBindings.APP_CONFIG) private options?: LabShareServerConfig
    ) {
        super(app);
        this.options = this.getConfiguration(options);
        this.server = serverUtils.createServer(this.serverApp, this.options.logger);
        this.apiLoader = new Loader(this.serverApp, this.options);
        this.socketLoader = new SocketIOLoader(this.server, this.options);
    }
    get listening() {
        return this._listening;
    }
    public io() {
        return this.socketLoader.getIO();
    }
    public async start() {
        this._listening = true;
        let mountPoint = this.options.restApiRoot;

        // Attach basic health check middleware
        this.serverApp.get(mountPoint, status())

        // Run all the package API 'config' functions
        this.apiLoader.setConfig({
            apiLoader: this.apiLoader,
            app: this.serverApp
        });

        serverUtils.startServer({
            server: this.server,
            logger: this.options.logger,
            port: this.options.listen.port
        });
        // add API routes and socket connections unless configured not to
        this.apiLoader.setAPIs(mountPoint);

        this.options.logger.info(`HTTP APIs enabled on mount path: "${mountPoint}"...`);

        this.socketLoader.connect();
        this.socketLoader.on('error', error => {
            this.options.logger.error(error);
        });
        this.socketLoader.on('status', message => {
            this.options.logger.info(message);
        });

        if (!_.get(global, 'LabShare.IO')) {
            _.set(global, 'LabShare.IO', this.io());
        }
    }

    //  stop the server
    public async stop(): Promise<void> {
        this._listening = false;
        await this.server.stop();

    }
    public async boot() {
        const { morgan, security, bodyParser } = this.options;

        this.initialized = true;
        serverUtils.initializeSecurity({ security, expressApp: this.serverApp });

        serverUtils.initializeBodyParser({ bodyParser: bodyParser, expressApp: this.serverApp });
        if (morgan.enable) {
            serverUtils.initializeMorgan({ morgan: morgan, expressApp: this.serverApp });
        }

        serverUtils.initializeCookieParser({ expressApp: this.serverApp });

        // Set up express-session middleware
        serverUtils.initializeSessions(
            {
                sessionOptions: security.sessionOptions,
                logger: this.options.logger,
                expressApp: this.serverApp
            });

        this.socketLoader.initialize();
        this.apiLoader.initialize();
    }

    private getConfiguration(options){
        let logger;
        const isProduction = this.serverApp.get('env') === 'production';
        return _.defaultsDeep(options, {
            listen: {
                port: 8000,
                url: 'http://127.0.0.1'
            },
            https: {},
            restApiRoot: '/',
            logger: console,
            socket: {
                connections: []
            },
            pattern: '{src/api,api}/*.js',
            main: process.cwd(),
            directories: [],
            morgan: {
                enable: true,
                format: isProduction ? 'combined' : 'dev',
                options: {
                    // Workaround to add fluentD integration with the morgan logging library
                    stream: _.get(logger, 'stream.write')
                }
            },
            bodyParser: {
                json: {},
                urlencoded: {
                    extended: true
                }
            },
            security: {
                sessionOptions: {
                    secret: crypto.randomBytes(64).toString('hex'),
                    resave: false,
                    saveUninitialized: false,
                    name: 'sessionID',
                    cookie: {
                        httpOnly: true,
                        maxAge: 60 * 60 * 1000,      // 1 hour
                        secure: isProduction   // only allow SSL cookies in production by default
                    },
                    store: 'memorystore',            // Defaults to https://www.npmjs.com/package/memorystore
                    storeOptions: {
                        checkPeriod: 86400000        // prune expired entries every 24h
                    }
                },
                contentSecurityPolicy: false,
                hpkp: false,
                referrerPolicy: {
                    policy: 'no-referrer'
                }
            }
        });

    }
        /**
     * @description Allows additional modifications to be made to the Express instance and routes before the services are started up.
     * @param {Function} func - A configuration function that receives all the API routes and the express app as arguments
     * @api
     */
    public config(func) {
        if (this.servicesActive) {
            throw new Error('You cannot modify the LabShare API services after starting up the server!');
        }

        func({
            services: this.apiLoader.services,
            sockets: this.socketLoader.getSockets(),
            app: this.serverApp,
            io: this.io()
        });
    }

}