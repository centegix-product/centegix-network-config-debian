# network-config-debian 

Network configuration for NodeJS. **Only used & tested on Debian stretch**

# Setup

```
npm network-config-debian 
```

# Usage

### List active interfaces

```javascript
var network = require('network-config-debian');

network.interfaces(function(err, interfaces){
  /* interfaces should be something like:

  [{
    name: 'eth0',
    ip: '1.1.1.77',
    netmask: '1.1.1.0',
    mac: 'aa:aa:aa:aa:aa:aa',
    gateway: '10.10.10.1'
   },
   { ... }, { ... }]
  */
 
});
```

### Update interface (static)

```
network.configure('eth0', {
    ip: 'x.x.x.x',
    netmask:'x.x.x.x',
    broadcast: 'x.x.x.x',
    gateway: 'x.x.x.x',
    restart: true // (default) restart networking service right away
}, function(err){

})
```

### Update interface (dhcp)
    
```javascript
network.configure('eth0', {
    dhcp: true,
    restart: false // don't restart networking service
}, function(err){
});
```
