/**
 * SSE Manager — Singleton registry of active Server-Sent Event connections.
 *
 * Holds a Map<programId, Set<res>> so broadcasts are O(subscribers) for a
 * given program without touching unrelated connections.
 */

/** @type {Map<string, Set<import('express').Response>>} */
const clients = new Map();

/**
 * Register a new SSE subscriber for a program.
 * Sets the required SSE response headers and sends an initial "connected" comment
 * so the client knows the stream is alive.
 *
 * @param {string} programId
 * @param {import('express').Response} res
 */
function addClient(programId, res) {
  if (!clients.has(programId)) {
    clients.set(programId, new Set());
  }
  clients.get(programId).add(res);
  console.log(`[SSE] Client connected for program ${programId}. Total: ${clients.get(programId).size}`);
}

/**
 * Remove an SSE subscriber. Called immediately when the client disconnects
 * (via req.on('close', ...)) to prevent memory leaks.
 *
 * @param {string} programId
 * @param {import('express').Response} res
 */
function removeClient(programId, res) {
  const programClients = clients.get(programId);
  if (programClients) {
    programClients.delete(res);
    if (programClients.size === 0) {
      clients.delete(programId); // Clean up the Map entry when no subscribers remain
    }
    console.log(`[SSE] Client disconnected from program ${programId}. Remaining: ${programClients?.size ?? 0}`);
  }
}

/**
 * Broadcast a JSON data payload to all SSE clients watching a given program.
 *
 * @param {string} programId
 * @param {object} data  - Will be JSON-stringified as the SSE `data` field
 */
function broadcast(programId, data) {
  const programClients = clients.get(programId);
  if (!programClients || programClients.size === 0) return;

  const payload = `data: ${JSON.stringify(data)}\n\n`;
  let deadClients = [];

  programClients.forEach((res) => {
    try {
      res.write(payload);
    } catch (err) {
      // The connection is broken — mark for removal
      console.warn(`[SSE] Dead client detected for program ${programId}, removing.`);
      deadClients.push(res);
    }
  });

  // Clean up any dead clients discovered during broadcast
  deadClients.forEach((res) => removeClient(programId, res));
}

module.exports = { addClient, removeClient, broadcast };
