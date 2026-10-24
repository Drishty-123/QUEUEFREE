const { EventEmitter } = require('events');

// In-process pub/sub for SSE fan-out. Any queue mutation publishes to the
// service channel; connected EventSource clients receive the change.
const emitter = new EventEmitter();
emitter.setMaxListeners(200);

function publish(serviceId, event) {
  emitter.emit(String(serviceId), JSON.stringify(event));
}

function subscribe(serviceId, handler) {
  emitter.on(String(serviceId), handler);
  return () => emitter.off(String(serviceId), handler);
}

module.exports = { publish, subscribe };
