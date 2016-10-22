# Fingerprint Client

This app can be used together with [node-fprint-server](https://github.com/WeeJeWel/node-fprint-server), for example on a Raspberry Pi with a [supported USB Fingerprint Reader](https://www.freedesktop.org/wiki/Software/fprint/libfprint/Supported_devices/).

It can manage your users per device under Settings > Fingerprint Client, and it will emit a Flow 'when' event when a finger has been identified.