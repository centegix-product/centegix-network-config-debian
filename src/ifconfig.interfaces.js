'use strict';
var _ = require('lodash');

// var MAC = 'HWaddr';
var MAC = 'ether';
var INET = 'inet';
// var BCAST = 'Bcast';
var BCAST = 'broadcast';
var DESTINATIONS = ['default', 'link-local'];

var fs = require('fs');

module.exports = function (cp) {
  return function (f) {
    // @todo add command timeout
    cp.exec('ifconfig', function (err, ifConfigOut, stderr) {
      if (err) {
        return f(err);
      }

      if (stderr) {
        return f(stderr);
      }

      cp.exec('route', function (err, routeOut, stderr) {
        if (err) {
          return f(err);
        }

        if (stderr) {
          return f(stderr);
        }

        fs.readFile('/etc/network/interfaces', {
          encoding: 'utf8'
        }, function (err, content) {
          if (err) {
            return f(err);
          }
          f(null, parse(ifConfigOut, routeOut, content));
        });
      });
    });
  };
};

function parse(ifConfigOut, routeOut, content) {
  return ifConfigOut.split('\n\n').map(function (inface) {
    var lines = inface.split('\n');
    var ifName = getInterfaceName(_.first(lines));
    var tmp = `iface ${ifName} inet static`;
    var use_dhcp = !_.includes(content, tmp);
    // console.log(`========\nifName:${ifName}\nuse_dhcp:${use_dhcp}\n========`);

    /**
     * Format 1
     * link xx:xx HWaddr xx-xx-xx
     * link xx:xx HWaddr xx:xx:xx
     *
     * Format 1
     * inet xx:xxx.xxx.xxx.xxx mask|masque|...:xxx.xxx.xxx.xxx
     */

    return {
      name: ifName,
      ip: getInterfaceIpAddr(lines[1]),
      netmask: getInterfaceNetmaskAddr(lines[1]),
      broadcast: getBroadcastAddr(lines[1]),
      // mac: getInterfaceMacAddr(_.first(lines)),
      mac: getInterfaceMacAddr(lines[2]),
      gateway: getGateway(routeOut),
      use_dhcp: use_dhcp
    };
  });
}

function getInterfaceName(firstLine) {
  return _.first(firstLine.split(' ')).split(':')[0];
}

/**
 * extract mac adress
 *
 * ifconfig output:
 *   - link xx:xx HWaddr xx-xx-xx
 *   - link xx:xx HWaddr xx:xx:xx
 *
 * @param  {string} firstLine
 * @return {string}           Mac address, format: "xx:xx:xx:xx:xx:xx"
 */
function getInterfaceMacAddr(firstLine) {
  if (!_.includes(firstLine, MAC)) {
    return null;
  }

  // var macAddr = _.last(firstLine.split(MAC)).trim().replace(/-/g, ':');
  var macAddr = firstLine.trim().split(' ')[1].replace(/-/g, ':');

  if (macAddr.split(':').length !== 6) {
    return null;
  }
  return macAddr;
}

/**
 * extract ip addr
 *
 * ifconfig output:
 *   - inet xx:xxx.xxx.xxx.xxx mask|masque|...:xxx.xxx.xxx.xxx
 *
 * @param  {string} line
 * @return {string,null} xxx.xxx.xxx.xxx
 */
function getInterfaceIpAddr(line) {
  if (!_.includes(line, INET)) {
    return null;
  }
  //return _.first(line.split(':')[1].split(' '));
  return line.trim().split(' ')[1];
}

/**
 * extract netmask addr
 *
 * ifconfig output:
 *   - inet xx:xxx.xxx.xxx.xxx mask|masque|...:xxx.xxx.xxx.xxx
 *
 * @param  {string} line
 * @return {string,null} xxx.xxx.xxx.xxx
 */
function getInterfaceNetmaskAddr(line) {
  if (!_.includes(line, INET)) {
    return null;
  }
  // return _.last(line.split(':'));
  return line.trim().split(' ')[4];
}

/**
 * extract broadcast addr
 * @param  {string} line
 * @return {string,null}      xxx.xxx.xxx.xxx
 */
function getBroadcastAddr(line) {
  if (!_.includes(line, BCAST)) {
    return null;
  }

  // inet adr:1.1.1.77  Bcast:1.1.1.255  Masque:1.1.1.0
  // @todo oh boy. this is ugly.
/*  return _.chain(line)
    .split(BCAST)
    .slice(1)
    .first()
    .value()
    .substring(1)
    .split(' ')[0];*/
    return line.trim().split(' ')[7];
}


/**
 * extract gateway ip
 * @param  {string} stdout
 * @return {string,null} default gateway ip or null
 */
function getGateway(stdout) {
  // @todo yep. this is ugly.
  return stdout
    .split('\n')
    .filter(function (line) {
      return _.some(DESTINATIONS, function (destination)  {
        return _.includes(line, destination);
      });
    })[0]
    .split(/\s+/)[1]
    // .split('.')[0]
    .replace(/-/g, '.');
}
