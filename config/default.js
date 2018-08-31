'use strict';

module.exports = {
	//port: 6784,
	url: 'mongodb://localhost:27017/db',
	session: {
		name: 'SYDATA',
		secret: 'SYDATA',
		cookie: {
			httpOnly: true,
		    secure:   false,
		    maxAge:   365 * 24 * 60 * 60 * 1000,
		}
	}
}
