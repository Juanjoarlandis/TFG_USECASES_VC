"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const maincontroller_1 = require("./../controllers/maincontroller");
const router = express_1.default.Router();
router.get('/ping', maincontroller_1.ping);
router.get('/did', maincontroller_1.cr_did);
router.get('/.well-known/did.json', maincontroller_1.didweb);
router.get('/issuer/entity/did.json', maincontroller_1.didweb);
router.get('/schema', maincontroller_1.schema);
// VC API CONTROLLERS
router.post('/credentials/issue', maincontroller_1.issue);
router.post('/statusCallback/:sessionId', maincontroller_1.statusCallback);
router.get('/credentials', maincontroller_1.getcred); // Should an issuer store ALL credentials that has been issued?
router.get('/credentials/:id(\\d+)', maincontroller_1.getscredx);
router.post('/credentials/status', maincontroller_1.upstatus);
router.delete('/credentials/:id(\\d+)', maincontroller_1.delcred); // IS IT WORTH INCLUING? In first place should an issuer store ALL credentials that has been issued?
router.get('/.hidden-easter-egg', maincontroller_1.easterEgg);
exports.default = router;
