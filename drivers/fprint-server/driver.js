'use strict';

const socketIoClient 	= require('socket.io-client');
const http 				= require('http.min')
const _					= require('underscore');

var devices = [];

function init( devices_data, callback ) {
	devices_data.forEach(_initDevice);
	callback();

	Homey.manager('flow').on('trigger.identify_specific.user.autocomplete', function( callback, args ) {

		let device = _getDevice( args.args.device );
		if( device instanceof Error ) return callback( device );

		var result = [];
		device.users.forEach(( user ) => {
			result.push({
				id: user.id,
				name: user.data.name
			})
		});

		result = result.filter(( resultItem ) => {
			return resultItem
				.name
				.toLowerCase()
				.indexOf( args.query.toLowerCase() ) > -1
		});

		callback( null, result );
	})

	Homey.manager('flow').on('trigger.identify_specific', function( callback, args, state ) {
		callback( null, args.user.id === state.userId );
	});
}

function _getDevice( device_data ) {
	return _.findWhere( devices, { id: device_data.id }) || new Error('invalid_device');
}

function _initDevice( device_data ) {

	module.exports.setUnavailable( device_data, __('not_connected') );

	module.exports.getSettings( device_data, ( err, settings ) => {
		if( err ) return console.error( err );

		module.exports.getName( device_data, ( err, name ) => {
			if( err ) return console.error( err );

			let socket = socketIoClient( settings.address );

			devices.push({
				id		: device_data.id,
				address	: settings.address,
				name	: name,
				socket	: socket,
				users	: []
			});

			refreshUsers( device_data.id );

			socket
				.on('connect', () => {
					module.exports.setAvailable( device_data );
				})
				.on('disconnect', () => {
					module.exports.setUnavailable( device_data, __('not_connected') );
				})
				.on('identify', ( userId, userData ) => {
					console.log('onIdentify', userId, userData)
					Homey.manager('flow').triggerDevice( 'identify', { name: userData.name }, null, device_data, ( err ) => {
						if( err ) return console.error( err );
					})
					Homey.manager('flow').triggerDevice( 'identify_specific', { name: userData.name }, { userId: userId }, device_data, ( err ) => {
						if( err ) return console.error( err );
					})
				})
		});
	});
}

function _uninitDevice( device_data ) {

	let device = _getDevice( device_data );
	if( device instanceof Error ) return;

	if( device.socket ) {
		device.socket.disconnect();
	}

	devices = _.without( devices, device );

}

function pair( socket ) {

}

function added( device_data ) {
	_initDevice( device_data );
}

function deleted( device_data ) {
	_uninitDevice( device_data );
}

function renamed( device_data, newName ) {

	let device = _getDevice( device_data );
	if( device instanceof Error ) return;

	device.name = newName;

}

function settings( device_data, oldSettingsObj, newSettingsObj, changedKeysArr, callback ) {
	callback( null, true );

	setTimeout(function(){
		_uninitDevice( device_data );
		_initDevice( device_data );
	}, 100);
}

/*
	Api methods
*/
function getDevices() {

	var result = [];

	devices.forEach(function(device){
		result.push({
			id		: device.id,
			name	: device.name,
			users	: device.users
		})
	})

	return result;

}

function createUser( deviceId, callback ) {
	callback = callback || function(){}

	let device = _getDevice({ id: deviceId });
	if( device instanceof Error ) return callback( device );

	http
		.post({
			uri: `${device.address}/api/user`,
			json: {
				name: __('newuser')
			}
		})
		.then(function( result ) {
			refreshUsers( deviceId, () => {
				callback( null, result.data && result.data.success );
			});
		})
		.catch( callback )

}

function updateUser( deviceId, userId, userData, callback ) {
	callback = callback || function(){}

	let device = _getDevice({ id: deviceId });
	if( device instanceof Error ) return callback( device );

	http
		.put({
			uri: `${device.address}/api/user/${userId}`,
			json: userData
		})
		.then(function( result ) {
			refreshUsers( deviceId, () => {
				callback( null, result.data && result.data.success );
			});
		})
		.catch( callback )

}
function deleteUser( deviceId, userId, callback ) {
	callback = callback || function(){}

	let device = _getDevice({ id: deviceId });
	if( device instanceof Error ) return callback( device );

	http
		.delete({
			uri: `${device.address}/api/user/${userId}`,
			json: true
		})
		.then(function( result ) {
			refreshUsers( deviceId, () => {
				callback( null, result.data && result.data.success );
			});
		})
		.catch( callback )

}

function refreshUsers( deviceId, callback ) {
	callback = callback || function(){}

	let device = _getDevice({ id: deviceId });
	if( device instanceof Error ) return callback( device );

	http
		.get({
			uri: `${device.address}/api/user`,
			json: true
		})
		.then(function( result ) {
			callback( null, result.data && result.data.success );
			if( result.data && Array.isArray( result.data.message ) ) {
				device.users = result.data.message;
			}
		})
		.catch( callback )

}

module.exports.init = init;
module.exports.pair = pair;
module.exports.added = added;
module.exports.deleted = deleted;
module.exports.settings = settings;
module.exports.renamed = renamed;

module.exports.getDevices = getDevices;
module.exports.createUser = createUser;
module.exports.updateUser = updateUser;
module.exports.deleteUser = deleteUser;
