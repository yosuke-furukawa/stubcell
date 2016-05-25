const net = require('net');
const MAXPORT = 65536;
const MINPORT = 3000; // avoid wellknown port
const portPromise = (beginPort) => {
  var PORT = beginPort || Math.random() * (MAXPORT - MINPORT) + MINPORT;
  return new Promise((resolve, reject) => {
    const nextPort = () => {
      const port = PORT++;
      if (port > 65536) {
        reject(new Error('Over max port number'));
      }
      const server = net.createServer();
      server.listen(port, (err) => {
        server.once('close', () => {
          resolve(port);
        });
        server.close();
      });
      server.on('error', (err) => {
        nextPort();
      });
    };
  });
};

module.exports.port = portPromise;
