

import {Application, ApplicationConfig} from '@loopback/core';
import * as _ from 'lodash';
import {
  LabShareServer,
  LabShareBindings,
  LabShareServerConfig,
} from '../server';
import * as path from 'path';
import {BootMixin, BootOptions} from '@loopback/boot';
import {ServiceMixin} from '@loopback/service-proxy';
import {RepositoryMixin} from '@loopback/repository';
import {ServicesLoggerComponent, LogBindings} from '@labshare/services-logger';

const servicesAuth = require('@labshare/services-auth');
const servicesCache = require('@labshare/services-cache').Middleware;

export class LabShareApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(Application)),
) {
  options: ApplicationConfig;
  constructor(options: ApplicationConfig = {}) {
    super(options);
    this.options = options;
    // Binding the services-logger component
    this.component(ServicesLoggerComponent);
    this.server(LabShareServer);
    this.bind(LabShareBindings.APP_CONFIG).to(this
      .options as LabShareServerConfig);
    this.projectRoot = process.cwd();
    this.setUpBindings(this.options);
  }

  async setMiddleware() {
    const tenant = _.get(this.options, 'services.auth.tenant') || _.get(this.options, 'services.auth.organization') || 'ls';
    const authUrl = _.get(this.options, 'services.auth.url') || 'https://a.labshare.org/_api';
    const audience = _.get(this.options, 'services.auth.audience') || 'ls-api';

   const labShareServer = await this.getServer(LabShareServer);
   labShareServer.config(async ({ app }) => {
      app.use(require('compression')());
      app.use(require('cors')());

    });

    labShareServer.config(
      servicesAuth({
        authUrl,
        tenant,
        audience
      })
    );
    const cacheConfig = this.getCacheConfig(this.options);
    if (cacheConfig) {
      labShareServer.config(servicesCache(cacheConfig, this.log));
    }
  }

  async boot(){
    const labShareServer = await this.getServer(LabShareServer);
    await labShareServer.boot();
  }

  getCacheConfig(config){
    if(_.has(config, 'services.cache.enable')){
      return _.get(config , 'services.cache');
    }
    if(_.has(config, 'services.Cache.enable')){
      return _.get(config , 'services.Cache');
    }
    return null;
  }

  setUpBindings(options: any): void {
    this.bind(LogBindings.LOG_CONFIG).to(options.services.log);
  }
  
}