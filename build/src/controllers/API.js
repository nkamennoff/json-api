"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Response_1 = require("../types/HTTP/Response");
exports.SealedResponse = Response_1.Response;
const Document_1 = require("../types/Document");
const Collection_1 = require("../types/Collection");
const APIError_1 = require("../types/APIError");
const logger_1 = require("../util/logger");
const requestValidators = require("../steps/http/validate-request");
const negotiate_content_type_1 = require("../steps/http/content-negotiation/negotiate-content-type");
const validate_content_type_1 = require("../steps/http/content-negotiation/validate-content-type");
const label_to_ids_1 = require("../steps/pre-query/label-to-ids");
const parse_request_primary_1 = require("../steps/pre-query/parse-request-primary");
const validate_document_1 = require("../steps/pre-query/validate-document");
const validate_resources_1 = require("../steps/pre-query/validate-resources");
const parse_query_params_1 = require("../steps/pre-query/parse-query-params");
const apply_transform_1 = require("../steps/apply-transform");
const make_get_1 = require("../steps/make-query/make-get");
const do_get_1 = require("../steps/do-query/do-get");
const make_post_1 = require("../steps/make-query/make-post");
const do_post_1 = require("../steps/do-query/do-post");
const make_patch_1 = require("../steps/make-query/make-patch");
const do_patch_1 = require("../steps/do-query/do-patch");
const make_delete_1 = require("../steps/make-query/make-delete");
const do_delete_1 = require("../steps/do-query/do-delete");
class APIController {
    constructor(registry) {
        this.registry = registry;
    }
    handle(request, frameworkReq, frameworkRes, queryTransform) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = new Response_1.default();
            const registry = this.registry;
            try {
                yield requestValidators.checkMethod(request);
                yield requestValidators.checkBodyExistence(request);
                response.contentType = yield negotiate_content_type_1.default(request.accepts, ["application/vnd.api+json"]);
                response.headers.vary = "Accept";
                if (request.idOrIds && request.allowLabel) {
                    const mappedLabel = yield label_to_ids_1.default(request.type, request.idOrIds, registry, frameworkReq);
                    request.idOrIds = mappedLabel;
                    const mappedIsEmptyArray = Array.isArray(mappedLabel) && !mappedLabel.length;
                    if (mappedLabel === null || mappedLabel === undefined || mappedIsEmptyArray) {
                        response.primary = (mappedLabel) ? new Collection_1.default() : null;
                    }
                }
                request.queryParams = parse_query_params_1.default(request.queryParams);
                if (!registry.hasType(request.type)) {
                    throw new APIError_1.default(404, undefined, `${request.type} is not a valid type.`);
                }
                if (request.hasBody) {
                    yield validate_content_type_1.default(request, this.constructor.supportedExt);
                    yield validate_document_1.default(request.body);
                    const parsedPrimary = yield parse_request_primary_1.default(request.body.data, request.aboutRelationship);
                    if (!request.aboutRelationship) {
                        yield validate_resources_1.default(request.type, parsedPrimary, registry);
                    }
                    request.primary = yield apply_transform_1.default(parsedPrimary, "beforeSave", registry, { frameworkReq, frameworkRes, request });
                }
                response.meta = {};
                if (typeof response.primary === "undefined") {
                    queryTransform = queryTransform || ((it) => it);
                    switch (request.method) {
                        case "get": {
                            const query = yield queryTransform(make_get_1.default(request, registry));
                            yield do_get_1.default(request, response, registry, query);
                            break;
                        }
                        case "post": {
                            const query = yield queryTransform(make_post_1.default(request, registry));
                            yield do_post_1.default(request, response, registry, query);
                            break;
                        }
                        case "patch": {
                            const query = yield queryTransform(make_patch_1.default(request, registry));
                            yield do_patch_1.default(request, response, registry, query);
                            break;
                        }
                        case "delete": {
                            const query = yield queryTransform(make_delete_1.default(request, registry));
                            yield do_delete_1.default(request, response, registry, query);
                        }
                    }
                }
            }
            catch (errors) {
                const errorsArr = Array.isArray(errors) ? errors : [errors];
                const apiErrors = errorsArr.map(APIError_1.default.fromError);
                if (response.contentType !== "application/json") {
                    response.contentType = "application/vnd.api+json";
                }
                response.errors = response.errors.concat(apiErrors);
                errorsArr.forEach(err => {
                    logger_1.default.info("API Controller caught error", err, err.stack);
                });
            }
            if (response.errors.length) {
                response.status = pickStatus(response.errors.map((v) => Number(v.status)));
                response.body = new Document_1.default(response.errors).get(true);
                return response;
            }
            response.primary = yield apply_transform_1.default(response.primary, "beforeRender", registry, { frameworkReq, frameworkRes, request });
            response.included = yield apply_transform_1.default(response.included, "beforeRender", registry, { frameworkReq, frameworkRes, request });
            if (response.status !== 204) {
                response.body = new Document_1.default(response.primary, response.included, response.meta, registry.urlTemplates(), request.uri).get(true);
            }
            return response;
        });
    }
    static responseFromExternalError(errors, requestAccepts) {
        const response = new Response_1.default();
        response.errors = (Array.isArray(errors) ? errors : [errors])
            .map(APIError_1.default.fromError.bind(APIError_1.default));
        response.status = pickStatus(response.errors.map((v) => Number(v.status)));
        response.body = new Document_1.default(response.errors).get(true);
        return negotiate_content_type_1.default(requestAccepts, ["application/vnd.api+json"])
            .then((contentType) => {
            response.contentType = (contentType.toLowerCase() === "application/json")
                ? contentType : "application/vnd.api+json";
            return response;
        }, () => {
            response.contentType = "application/vnd.api+json";
            return response;
        });
    }
}
APIController.supportedExt = Object.freeze([]);
exports.default = APIController;
function pickStatus(errStatuses) {
    return errStatuses[0];
}
