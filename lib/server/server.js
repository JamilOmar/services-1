"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("@loopback/context");
const core_1 = require("@loopback/core");
const _ = require("lodash");
const keys_1 = require("./keys");
const express = require('express'), crypto = require('crypto'), serverUtils = require('../server-utils'), { SocketIOLoader, Loader } = require('../api'), dotEnv = require('dotenv'), path = require('path'), status = require('../middleware/status'), memoryStore = require('memorystore');
let LabShareServer = class LabShareServer extends context_1.Context {
    constructor(app, options) {
        super(app);
        this.app = app;
        this.options = options;
        this.serverApp = express();
        this.servicesActive = false;
        this.initialized = false;
        // required property for the Server
        this._listening = false;
        this.options = this.getConfiguration(options);
        this.server = serverUtils.createServer(this.serverApp, this.options.logger);
        this.apiLoader = new Loader(this.serverApp, this.options);
        this.socketLoader = new SocketIOLoader(this.server, this.options);
    }
    get listening() {
        return this._listening;
    }
    io() {
        return this.socketLoader.getIO();
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this._listening = true;
            let mountPoint = this.options.restApiRoot;
            // Attach basic health check middleware
            this.serverApp.get(mountPoint, status());
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
        });
    }
    //  stop the server
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this._listening = false;
            yield this.server.stop();
        });
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const { morgan, security, bodyParser } = this.options;
            this.initialized = true;
            serverUtils.initializeSecurity({ security, expressApp: this.serverApp });
            serverUtils.initializeBodyParser({ bodyParser: bodyParser, expressApp: this.serverApp });
            if (morgan.enable) {
                serverUtils.initializeMorgan({ morgan: morgan, expressApp: this.serverApp });
            }
            serverUtils.initializeCookieParser({ expressApp: this.serverApp });
            // Set up express-session middleware
            serverUtils.initializeSessions({
                sessionOptions: security.sessionOptions,
                logger: this.options.logger,
                expressApp: this.serverApp
            });
            this.socketLoader.initialize();
            this.apiLoader.initialize();
        });
    }
    getConfiguration(options) {
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
                        maxAge: 60 * 60 * 1000,
                        secure: isProduction // only allow SSL cookies in production by default
                    },
                    store: 'memorystore',
                    storeOptions: {
                        checkPeriod: 86400000 // prune expired entries every 24h
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
    config(func) {
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
};
LabShareServer = __decorate([
    __param(0, context_1.inject(core_1.CoreBindings.APPLICATION_INSTANCE)),
    __param(1, context_1.inject(keys_1.LabShareBindings.APP_CONFIG)),
    __metadata("design:paramtypes", [core_1.Application, Object])
], LabShareServer);
exports.LabShareServer = LabShareServer;
//# sourceMappingURL=server.js.map