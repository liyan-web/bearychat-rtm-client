import RTMClient, { RTMClientEvents, RTMPingTimeoutError } from '../';
import { WebSocket } from 'mock-socket';
import delay from '../delay';

const KEEP_ALIVE_TIMEOUT = 2000;
const PING_TIMEOUT = 80;

let server, url;

const errorHandler = jest.fn();
const closeHandler = jest.fn();
const onlineHandler = jest.fn();
const offlineHandler = jest.fn();
const eventHandler = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  return new Promise((resolve) => {
    server.stop(resolve);
  });
});

test('keep alive', async () => {
  const result = await createMockServer();
  server = result.server;
  url = result.url;

  const client = new RTMClient({
    url,
    WebSocket,
    pingInterval: CLIENT_PING_INTERVAL
  });

  client.on(RTMClientEvents.ERROR, errorHandler);
  client.on(RTMClientEvents.CLOSE, closeHandler);
  client.on(RTMClientEvents.ONLINE, onlineHandler);
  client.on(RTMClientEvents.OFFLINE, offlineHandler);
  client.on(RTMClientEvents.EVENT, eventHandler);

  expect(offlineHandler).not.toBeCalled();
  expect(closeHandler).not.toBeCalled();
  expect(eventHandler).not.toBeCalled();

  await delay(KEEP_ALIVE_TIMEOUT);

  client.close();

  expect(errorHandler).not.toBeCalled();
  expect(onlineHandler.mock.calls.length).toBe(1);
  expect(offlineHandler.mock.calls.length).toBe(1);
  expect(closeHandler.mock.calls.length).toBe(1);
  expect(eventHandler.mock.calls.length).toBe(1);
});

test('terminate connection when timeouted', async () => {
  const result = await createMockServer(true);
  server = result.server;
  url = result.url;

  const client = new RTMClient({
    url,
    WebSocket,
    pingInterval: CLIENT_PING_INTERVAL,
    pingTimeout: CLIENT_PING_TIMEOUT
  });

  client.on(RTMClientEvents.ERROR, errorHandler);
  client.on(RTMClientEvents.CLOSE, closeHandler);
  client.on(RTMClientEvents.ONLINE, onlineHandler);
  client.on(RTMClientEvents.OFFLINE, offlineHandler);
  client.on(RTMClientEvents.EVENT, eventHandler);

  expect(offlineHandler).not.toBeCalled();
  expect(closeHandler).not.toBeCalled();
  expect(eventHandler).not.toBeCalled();

  await delay(PING_TIMEOUT);

  expect(onlineHandler.mock.calls.length).toBe(1);
  expect(eventHandler.mock.calls.length).toBe(1);
  expect(errorHandler.mock.calls.length).toBe(1);
  expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(RTMPingTimeoutError);
  expect(offlineHandler.mock.calls.length).toBe(1);
  expect(closeHandler.mock.calls.length).toBe(0);
});
