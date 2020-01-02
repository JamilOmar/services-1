"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("@loopback/context");
// nanmespace for binding configurations
var LabShareBindings;
(function (LabShareBindings) {
    LabShareBindings.APP_CONFIG = context_1.BindingKey.create('labshare.server.config');
})(LabShareBindings = exports.LabShareBindings || (exports.LabShareBindings = {}));
/**
 * The key used to store log-related via @loopback/metadata and reflection.
 */
exports.LABSHARE_METADATA_KEY = 'labshare.server.metadata';
//# sourceMappingURL=keys.js.map