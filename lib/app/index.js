"use strict";
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
const core_1 = require("@loopback/core");
const _ = require("lodash");
const server_1 = require("../server");
const boot_1 = require("@loopback/boot");
const service_proxy_1 = require("@loopback/service-proxy");
const repository_1 = require("@loopback/repository");
const services_logger_1 = require("@labshare/services-logger");
const servicesAuth = require('@labshare/services-auth');
const servicesCache = require('@labshare/services-cache').Middleware;
class LabShareApplication extends boot_1.BootMixin(service_proxy_1.ServiceMixin(repository_1.RepositoryMixin(core_1.Application))) {
    constructor(options = {}) {
        super(options);
        this.options = options;
        // Binding the services-logger component
        this.component(services_logger_1.ServicesLoggerComponent);
        this.server(server_1.LabShareServer);
        this.bind(server_1.LabShareBindings.APP_CONFIG).to(this
            .options);
        this.projectRoot = process.cwd();
        this.setUpBindings(this.options);
    }
    setMiddleware() {
        return __awaiter(this, void 0, void 0, function* () {
            const tenant = _.get(this.options, 'services.auth.tenant') || _.get(this.options, 'services.auth.organization') || 'ls';
            const authUrl = _.get(this.options, 'services.auth.url') || 'https://a.labshare.org/_api';
            const audience = _.get(this.options, 'services.auth.audience') || 'ls-api';
            const labShareServer = yield this.getServer(server_1.LabShareServer);
            labShareServer.config(({ app }) => __awaiter(this, void 0, void 0, function* () {
                app.use(require('compression')());
                app.use(require('cors')());
            }));
            labShareServer.config(servicesAuth({
                authUrl,
                tenant,
                audience
            }));
            const cacheConfig = this.getCacheConfig(this.options);
            if (cacheConfig) {
                labShareServer.config(servicesCache(cacheConfig, this.log));
            }
        });
    }
    boot() {
        return __awaiter(this, void 0, void 0, function* () {
            const labShareServer = yield this.getServer(server_1.LabShareServer);
            yield labShareServer.boot();
        });
    }
    getCacheConfig(config) {
        if (_.has(config, 'services.cache.enable')) {
            return _.get(config, 'services.cache');
        }
        if (_.has(config, 'services.Cache.enable')) {
            return _.get(config, 'services.Cache');
        }
        return null;
    }
    setUpBindings(options) {
        this.bind(services_logger_1.LogBindings.LOG_CONFIG).to(options.services.log);
    }
}
exports.LabShareApplication = LabShareApplication;
//# sourceMappingURL=index.js.map