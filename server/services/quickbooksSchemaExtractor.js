import fetch from 'node-fetch';

/**
 * Recursively extract all field paths from a JSON object.
 * @param {object} obj - The JSON object.
 * @param {string} prefix - The current field path prefix.
 * @returns {string[]} Array of field paths.
 */
function extractFieldPaths(obj, prefix = '') {
  let paths = [];
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths = paths.concat(extractFieldPaths(value, path));
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // For arrays of objects, extract from first element
      paths = paths.concat(extractFieldPaths(value[0], path));
    } else {
      paths.push(path);
    }
  }
  return paths;
}

/**
 * Fetch a sample record for a given entity from QuickBooks and extract field paths.
 * @param {object} params
 * @param {string} params.realmId - The QuickBooks company ID.
 * @param {string} params.accessToken - The OAuth access token.
 * @param {string} params.entity - The transaction entity type (e.g., 'Expense').
 * @returns {Promise<string[]>} List of field paths.
 */
export async function getQuickBooksFields({ realmId, accessToken, entity }) {
  //const temp = `eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2IiwieC5vcmciOiJIMCJ9..DhNEPfH3C0iCuOpspSCKOw.t3Hg5FqOZF2Yt3-UEnMCkGk6jWAGhAnGgnoaKVlwvmHbfpvXAj8aB7GiVFKqXmSYCt0LenUU8hqVvcgyCS2fPIkueB7clvIJZGtLUdEuSecNB1fpnQyEgdvwFVhBwXX0rJROo3GLW_Y_ziBRfPRN2EBo1AEN6F66k37KBBgodO49Y4Hhr9WGBeIkYe4iqf8fB3wvhYkhwTXxh0mJnKpMszjf2vZFSIUBwoYlC1dLBxETVXFSIfnZXBAkhakEzfq-zk9AySQDqr-3JJM47gkV5JR_axSPqySl8deMQ0HuXKaCqpvHPgCUfcA3sm-S1yltJ-aGRqWRrJnMmYzjEydYJPs4wUZnFaRCatdnMOBvwITHnIOxefSAx9dthUxHTXtp8DLrrrjO6khK5LhHkC4EOoKwGCVF3J2hbBIqRCF8s3FfisYWgejw7mSKd9hIlyXcFZdOIcZDLjstajxzebmfQsrm8ZNzVsaTysO5g42iIJE.MMn5fz_-6XM5DLQjZ3gmWg`
  const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=SELECT * FROM ${entity}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`QuickBooks API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  // The entity records are in data[entity] or data.QueryResponse[entity]
  const records = data.QueryResponse && data.QueryResponse[entity];
  if (!records || !records.length) {
    throw new Error(`No records found for entity: ${entity}`);
  }
  // Extract field paths from the first record
  return extractFieldPaths(records[0]);
} 