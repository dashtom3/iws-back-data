'use strict';

import express from 'express'
import Data from '../data/main'

const router = express.Router()

router.post('/start', Data.startRead);
router.post('/stop', Data.stopRead);


// router.get('/info', User.getUserInfo);
// router.post('/update/:user_id', User.update);
// router.post('/changepassword', User.chanegPassword);

export default router
