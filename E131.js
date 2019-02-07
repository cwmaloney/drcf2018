'use strict';

/*
 * This is a simple library to interact with devices that support E1.31 from node.js.
 * Tested with node.js 8.4
 * 
 * E1.31
 * spec: https://tsp.esta.org/tsp/documents/docs/ANSI_E1-31-2018.pdf
 */

 // node.js modules
 const dgram = require('dgram');
 const EventEmitter = require('events');
 

// TODO: should this emit events or only use callbacks? error, sent...
class E131 extends EventEmitter {
  constructor () {
    super();
    this.universeInfos = new Map();
  }

  getUniverseKey(address, universe) {
    return address + "/" + universe;
  }

  getUniverseInfo(address, universe, throwErrorIfMissing = true) {
    const universeKey = this.getUniverseKey(address, universe);
    const universeInfo = this.universeInfos.get(universeKey);
    if (!universeInfo && throwErrorIfMissing) {
      throw new Error("E131::getUniverseInfo - Universe address:" + address + " universe:" + universe + " has not been configured!");
    }
    return universeInfo;
  }

  configureUniverse(configuration) {

    // console.log("E131::configureUniverse, universe=" + configuration.universe);
    // console.log("E131::configureUniverse", "configuration", configuration);
    
    const { universe = 0,
            address = '10.0.0.0',
            enableBroadcast = false,
            port = 5568,
            sourcePort,
            sendOnlyChangeData = true,
            sendSequenceNumbers = true,
            minMessageInterval = 25, /* milliseconds */
            refreshInterval = 4000 /* milliseconds */ } = configuration;

    //universe = this.checkUniverse(universe);

    // close it if it is open
    this.closeUniverse(address, universe);
   
    const universeInfo = {};

    universeInfo.address = address;
    universeInfo.universe = universe;
    universeInfo.enableBroadcast = enableBroadcast;
    universeInfo.port = port;

    if (sourcePort) {
      universeInfo.sourcePort = sourcePort;
    }

    universeInfo.sendOnlyChangeData = sendOnlyChangeData;

    universeInfo.sendSequenceNumbers = sendSequenceNumbers;

    // see spec page ?; milliseconds
    universeInfo.minMessageInterval = minMessageInterval;

    // see spec page ?; in milliseconds
    universeInfo.refreshInterval = refreshInterval;

    universeInfo.channelData = new Uint8Array(512);
    universeInfo.channelData.fill(0);
    
    // The highest channel number that has changed
    universeInfo.changedChannelThreshold = undefined;
    
    // The refreshIntervalTimerId
    universeInfo.refreshIntervalTimerId = undefined;

    // The throttleTimerIds
    universeInfo.throttleTimerId = undefined;

    // true if channel data should be sent after throttle timeout
    universeInfo.sendDelayedByThrottle = false;

    // create a socket
    universeInfo.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

    // enable broacast after socket is ready
    if (universeInfo.enableBroadcast) {
      universeInfo.socket.on('listening', function() {
        console.log("E131::configureUniverse setting broadcast, universe=" + universe);
        universeInfo.socket.setBroadcast(true);
      });
    }

    universeInfo.packetSequenceNumber = 1;

    universeInfo.socket.on('error', function () {
      console.log("*** E131::socket error, universe=" + universe);
    });

    universeInfo.socket.on('close', function () {
      //console.log("E131::socket closed, universe=" + universe);
    });

    if (sourcePort) {
      universeInfo.socket.bind(sourcePort);
    }

    const universeKey = this.getUniverseKey(address, universe);
    this.universeInfos.set(universeKey, universeInfo);

    // console.log("E131::configureUniverse complete, universe=" + universe);
  }

  checkUniverse(universe = 0) {
    universe = parseInt(universe, 10);
    if (universe < 0 || universe > 32767) {
      throw new RangeError("E131::Invalid universe " + universe);
    }
    return universe;
  }

  checkChannel(channel = 1) {
    channel = parseInt(channel, 10);
    if (channel < 1 || channel > 512) {
      throw new RangeError("E131::Invalid channel "+ channel);
    }
    return channel;
  }

  checkChannelData(value = 0) {
    value = parseInt(value, 10);
    if (value < 0 || value > 255) {
      throw new RangeError("E131::Invalid channel data "+ value);
    }
    return value;
  }

  /* 
   * The message makes a copy of the channel data so that
   * the data can be changed while the message is being sent.
   */
  createE131DataMessage(address, universe, dataLength) {
    const universeInfo = this.getUniverseInfo(address, universe);

    const universeHighByte = (universe >> 8) & 0xff;
    const universeLowByte = universe & 0xff;

    // artnet lengh must be even, I don't see this in the e1.31 spec
    // if (dataLength % 2) {
    //   dataLength += 1;
    // }

    // const dataLengthHighByte = (dataLength >> 8) & 0xff;
    // const dataLengthLowByte = (dataLength & 0xff);

    let sequenceNumber = 0;
    if (universeInfo.sendSequenceNumbers) {
      if (universeInfo.packetSequenceNumber == 255) {
        universeInfo.packetSequenceNumber = 1;
      }
      else {
        universeInfo.packetSequenceNumber++;
      }
      sequenceNumber = universeInfo.packetSequenceNumber;
    }

    // PDU - protocol data unit
    const rootHeaderLength = 37 - 0 + 1;
    const framingHeaderLength = 114 - 38 + 1;
    const dmpHeaderLength = 126 - 115 + 1;

    const dmpPduLength = dmpHeaderLength + dataLength;
    const framingPduLength = framingHeaderLength + dmpPduLength;
    const rootPduLength = framingPduLength + rootHeaderLength;

    // cid must be 16 bytes      1234567890123456
    const cid = Uint8Array.from("Holiday Lights  ");

    // ACN root layer protocol header
    const rootHeaderPart1 = [
      0x00, 0x10, // ACN root layer preamble size
      0x00, 0x00, // ACN root layer post-amble size
      0x41, 0x53, 0x43, 0x2d, 0x45, 0x31, 0x2e, 0x31, 0x37, 0x00, 0x00, 0x00, // ACN Packet Identifier
      (0x7 | ((rootPduLength & 0xff00) > 8)), rootPduLength & 0xff,
      0x00, 0x00, 0x00, 0x04, // VECTOR_ROOT_E131_DATA
    ];

    // E1.31 framing layer
    const framingHeaderPart1 = [
      (0x7 | ((framingPduLength & 0xff00) > 8)), framingPduLength & 0xff,
      0x00, 0x00, 0x00, 0x02, // VECTOR_E131_DATA_PACKET
    ];

    const sourceName = Uint8Array.from("Holiday Lights");
    sourceName.length = 64;

    const framingHeaderPart3 = [
      100, // priority; 0-200; 100 is default
      0, 0, // synchornize universe (not used)
      sequenceNumber,
      0, // options
      universeLowByte, universeHighByte
    ];
 
    const  dmpLayerHeader = [
      dmpFlagsAndLengthLow, dmpFlagsAndLengthHigh,
      0x02, // VECTOR_DMP_SET_PROPERTY
      0xa1, // address type and data type
      0x00, 0x00, // first channel address
      0x01, 0x00, // address increment
      dataLengthLowByte, dataLengthHighByte,
        // start byte
    ];

    // create message

    const messageLength = rootPduLength;
    const message = new Uint8Array(messageLength);
    let index = 0;
    message.set(rootHeaderPart1, index);    index += rootHeaderPart1.length;
    message.set(cid, index);                index += cid.length;
    message.set(framingHeaderPart1, index); index += rootHeaderPart1.length;
    message.set(sourceName,, index);        index += rootHeaderPart1.length;
    message.set(framingHeaderPart3, index); index += rootHeaderPart1.length;
    message.set(universeInfo.channelData.slice(0,dataLength), index);

    return message;
  }

  setOneChannelData(address, universe, channel, channelData) {
    universe = this.checkUniverse(universe);
    channel = this.checkChannel(channel);
    channelData = this.checkChannelData(channelData);

    const universeInfo = this.getUniverseInfo(address, universe);

    if (!universeInfo.channelData) {
      this.createChannelData(universe);
    }
    
    if (!universeInfo.changedChannelThreshold || channel > universeInfo.changedChannelThreshold) {
      universeInfo.changedChannelThreshold = channel;
    }

    universeInfo.channelData[channel-1] = channelData;
  }

  /*
   * data can be an array
   */
  setChannelData(address, universe, channel, data) {
    universe = this.checkUniverse(universe);
    channel = this.checkChannel(channel);

    if ((Array.isArray(data)) && (data.length > 0)) {
      for (let index = 0; index < data.length; index++) {
        this.setOneChannelData(address, universe, channel+index, data[index]);
      }
    } else {
      this.setOneChannelData(address, universe, channel, data);
    }
  }

  close() {
    for (let [, universeInfo] of this.universeInfos) {
      this.closeUniverse(universeInfo.address, universeInfo.universe);
    }
    this.universeInfos.clear();
  }

  closeUniverse(address, universe) {
    const universeInfo = this.getUniverseInfo(address, universe, false);
    if (universeInfo) {
      clearInterval(universeInfo.refreshInternvalTimerId);
      clearTimeout(universeInfo.throttleTimerId);
      universeInfo.socket.close();
      this.universeInfos.delete(this.getUniverseKey(address, universe));
    }
  }

  onRefreshTimeout(universeInfo) {
    //console.log("E131::onRefreshTimeout, universeInfo=" + universeInfo);

    universeInfo.changedChannelThreshold = universeInfo.channelData.length;
    this.send(universeInfo.address, universeInfo.universe);
  }

  onThrottleTimeout(universeInfo) {
    universeInfo.thottleTimerId = null;
    if (universeInfo.sendDelayedByThrottle) {
      universeInfo.sendDelayedByThrottle = false;
      // console.log("E131::onThrottleTimeout - sending after throttle, universe=" + universe);
      this.send(universeInfo.address, universeInfo.universe);
    } else {
      // console.log("E131::onThrottleTimeout - starting refresh timer, universe=" + universe);
      universeInfo.refreshInternvalTimerId = setTimeout(
        this.onRefreshTimeout.bind(this, universeInfo), universeInfo.refreshInterval);
    }
  }

  onAfterSend(universeInfo) {
    // console.log("E131::onAfterSend - starting throttle timer, universeInfo=" + universeInfo);
 
    universeInfo.thottleTimerId = setTimeout(
      this.onThrottleTimeout.bind(this, universeInfo), universeInfo.minMessageInterval);
  }

  /*
   * callback is optional
   */
  send(address, universe) {
    const universeInfo = this.getUniverseInfo(address, universe);
    
        // if there is a throttle time, do not send messaage but
    // set flag so throttle timer will send the message
    if (universeInfo.thottleTimerId) {
      // console.log("E131::send throttled, universe=" + universe);
      universeInfo.sendDelayedByThrottle = true;
      return;
    }

    clearTimeout(universeInfo.refreshInternvalTimerId);
    universeInfo.refreshInternvalTimerId = null;

    if (universeInfo.changedChannelThreshold) { 
      let message = this.createArtDmxMessage(address, universe, universeInfo.changedChannelThreshold);
      universeInfo.changedChannelThreshold = 0;
  
      // if (universe > 0) {
      //   console.log(`E131::send, u=${universe} p=${universeInfo.port} a=${universeInfo.address}
      //     m=${JSON.stringify(message)}`);
      // }
      universeInfo.socket.send(message, 0, message.length, universeInfo.port, universeInfo.address,
        this.onAfterSend.bind(this, universeInfo), universeInfo.minMessageInterval);
    }
  }

}

exports.E131 = E131;
