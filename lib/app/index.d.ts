import { Application, ApplicationConfig } from '@loopback/core';
import { BootOptions } from '@loopback/boot';
declare const LabShareApplication_base: (new (...args: any[]) => {
    [x: string]: any;
    projectRoot: string;
    bootOptions?: BootOptions;
    boot(): Promise<void>;
    booters(...booterCls: import("@loopback/core").Constructor<import("@loopback/boot").Booter>[]): import("@loopback/core").Binding<any>[];
    component(component: import("@loopback/core").Constructor<{}>): void;
    mountComponentBooters(component: import("@loopback/core").Constructor<{}>): void;
}) & (new (...args: any[]) => {
    [x: string]: any;
    serviceProvider<S>(provider: import("@loopback/service-proxy").Class<import("@loopback/core").Provider<S>>, name?: string): import("@loopback/core").Binding<S>;
    component(component: import("@loopback/service-proxy").Class<unknown>, name?: string): void;
    mountComponentServices(component: import("@loopback/service-proxy").Class<unknown>): void;
}) & (new (...args: any[]) => {
    [x: string]: any;
    repository<R extends import("@loopback/repository").Repository<any>>(repoClass: import("@loopback/repository").Class<R>, name?: string): import("@loopback/core").Binding<R>;
    getRepository<R_1 extends import("@loopback/repository").Repository<any>>(repo: import("@loopback/repository").Class<R_1>): Promise<R_1>;
    dataSource<D extends any>(dataSource: D | import("@loopback/repository").Class<D>, name?: string): import("@loopback/core").Binding<D>;
    component(component: import("@loopback/repository").Class<unknown>, name?: string): void;
    mountComponentRepositories(component: import("@loopback/repository").Class<unknown>): void;
    migrateSchema(options?: import("@loopback/repository").SchemaMigrationOptions): Promise<void>;
}) & typeof Application;
export declare class LabShareApplication extends LabShareApplication_base {
    options: ApplicationConfig;
    constructor(options?: ApplicationConfig);
    setMiddleware(): Promise<void>;
    boot(): Promise<void>;
    getCacheConfig(config: any): any;
    setUpBindings(options: any): void;
}
export {};
