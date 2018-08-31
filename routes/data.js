'use strict';

import express from 'express'
import main from '../data/main'

const router = express.Router()

router.post('/start', main.startRead);
router.post('/stop', main.stopRead);
router.post('/write',main.writeDate);

// router.get('/info', User.getUserInfo);
// router.post('/update/:user_id', User.update);
// router.post('/changepassword', User.chanegPassword);

export default router
