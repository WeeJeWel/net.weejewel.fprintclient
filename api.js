'use strict';

module.exports = [

	{
		method: 'GET',
		path: '/device',
		fn: function( callback, args ) {

			var result = Homey
				.manager('drivers')
				.getDriver('fprint-server')
				.getDevices();

			if( result instanceof Error ) return callback( result );
			return callback( null, result );

		}
	},

	{
		method: 'POST',
		path: '/device/:device_id/user/',
		fn: function( callback, args ) {

			Homey
				.manager('drivers')
				.getDriver('fprint-server')
				.createUser( args.params.device_id, callback );

		}
	},

	{
		method: 'PUT',
		path: '/device/:device_id/user/:user_id',
		fn: function( callback, args ) {

			Homey
				.manager('drivers')
				.getDriver('fprint-server')
				.updateUser( args.params.device_id, args.params.user_id, args.body, callback );

		}
	},

	{
		method: 'DELETE',
		path: '/device/:device_id/user/:user_id',
		fn: function( callback, args ) {

			Homey
				.manager('drivers')
				.getDriver('fprint-server')
				.deleteUser( args.params.device_id, args.params.user_id, callback );

		}
	}

]