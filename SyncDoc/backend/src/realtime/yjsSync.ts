import * as Y from "yjs";

export const MSG_SYNC_STEP1 = 0;
export const MSG_SYNC_STEP2 = 1;
export const MSG_UPDATE = 2;

export interface ProcessedYjsMessage {
  type: number;
  reply?: Uint8Array;
  updateApplied?: Uint8Array;
}

/**
 * Encodes a Sync Step 1 message containing the Y.Doc state vector.
 */
export function createSyncStep1Message(doc: Y.Doc): Uint8Array {
  const sv = Y.encodeStateVector(doc);
  const message = new Uint8Array(1 + sv.length);
  message[0] = MSG_SYNC_STEP1;
  message.set(sv, 1);
  return message;
}

/**
 * Encodes a Sync Step 2 message containing state updates missing from the client's state vector.
 */
export function createSyncStep2Message(doc: Y.Doc, stateVector: Uint8Array): Uint8Array {
  const update = Y.encodeStateAsUpdate(doc, stateVector);
  const message = new Uint8Array(1 + update.length);
  message[0] = MSG_SYNC_STEP2;
  message.set(update, 1);
  return message;
}

/**
 * Encodes an incremental Yjs update message.
 */
export function createUpdateMessage(update: Uint8Array): Uint8Array {
  const message = new Uint8Array(1 + update.length);
  message[0] = MSG_UPDATE;
  message.set(update, 1);
  return message;
}

/**
 * Processes an incoming binary Yjs message from a WebSocket client.
 *
 * @param doc Target room Y.Doc instance
 * @param data Message payload as Uint8Array
 * @param origin Optional transaction origin string (e.g. "websocket")
 */
export function handleYjsMessage(
  doc: Y.Doc,
  data: Uint8Array,
  origin: unknown = "websocket"
): ProcessedYjsMessage {
  if (data.length === 0) {
    throw new Error("Empty Yjs message payload");
  }

  const messageType = data[0];
  const payload = data.subarray(1);

  switch (messageType) {
    case MSG_SYNC_STEP1: {
      const reply = createSyncStep2Message(doc, payload);
      return {
        type: MSG_SYNC_STEP1,
        reply,
      };
    }

    case MSG_SYNC_STEP2: {
      Y.applyUpdate(doc, payload, origin);
      return {
        type: MSG_SYNC_STEP2,
        updateApplied: payload,
      };
    }

    case MSG_UPDATE: {
      Y.applyUpdate(doc, payload, origin);
      return {
        type: MSG_UPDATE,
        updateApplied: payload,
      };
    }

    default:
      throw new Error(`Unsupported Yjs message type: ${messageType}`);
  }
}
