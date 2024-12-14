import express from 'express';
import {
  getscredx,
  upstatus,
  getcred,
  delcred,
  issue,
  ping,
  cr_did,
  didweb,
  schema,
  statusCallback,
  easterEgg,
  getIssuersDidsEndpoint
} from './../controllers/maincontroller';

const router = express.Router();

router.get('/ping', ping);

router.get('/did', cr_did);

router.get('/.well-known/did.json', didweb);

router.get('/issuer/entity/did.json', didweb);

router.get('/schema', schema);

router.get('/did/issuers', getIssuersDidsEndpoint);

// VC API CONTROLLERS
router.post('/credentials/issue', issue);

router.post('/statusCallback/:sessionId', statusCallback);

router.get('/credentials', getcred);

router.get('/credentials/:id(\\d+)', getscredx);

router.post('/credentials/status', upstatus);

router.delete('/credentials/:id(\\d+)', delcred);

router.get('/.hidden-easter-egg', easterEgg);

export default router;
