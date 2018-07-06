'use strict';

import data from './data'

export default app => {
	
	app.use('/data', data);
}
