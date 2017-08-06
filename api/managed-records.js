import fetch from "../util/fetch-fill";
import URI from "urijs";

// /records endpoint
window.path = "http://localhost:3000/records";

/**
 * @typedef {Object} options
 * @property {?number} page Results page to fetch. Null fetches first page.
 * @property {?string[]} colors Inclusive color filter for results. Null 
 * fetches all colors.
 * @param {?options} options specifies the colors and page filters to fetch 
 * @returns {Promise<Object>} The promisified results of the fetch operation 
 * against the API. NOTE: Per test specs, this promise will always resolve 
 * - either with the transformed object or with an Error object.
 */
const retrieve = (options = {}) => new Promise((resolve) => {
  const page = options.page || 1;
  const colors = options.colors || null;

  fetch(buildURI(window.path, page, colors))
    .then(response => {
      if (response.ok) return response.json();
      throw new Error('Response not OK');
    })
    .then((jsonified) => {
      const formatted = formatResponse(jsonified, page);
      resolve(formatted);
    })
    .catch((err) => {
      console.log(`Something went wrong while fetching: ${err}`);
      resolve(err);
    });
});

/**
 * Builds a /resources endpoint URI based on passed options
 * @param {string} base the URI domain and endpoint
 * @param {?number} page Results page number to add to query param
 * @param {?string[]} colors list of colors, each of which will get its own 
 * query param
 * @returns {string} a complete URI
 */
const buildURI = (base, page, colors) => {
  const offset = (page * 10) - 10;
  // Set limit to 11 to see whether next results page exists
  const limit = 11;
  const queryParams = colors
    ? { offset, limit, 'color[]': colors }
    : { offset, limit };
  return new URI(base)
    .query(queryParams)
    .toString();
};

/**
 * Formats /records api response from json to desired format per homework specs
 * @param {Object} json response object from the api, pre-formatted to JSON
 * @param {number} page the fetched page number (each page has 10 responses)
 * @typedef {Object} formatted
 * @property {number[]} ids id values of returned result objects
 * @property {Object[]} open all result objects with 'open' disposition
 * @property {number} closedPrimaryCount number of results with 'closed' 
 * disposition
 * @property {?number} previousPage prev page number, or null if first page
 * @property {?number} nextPage next page number, or null if last page
 * @returns {formatted} summary object of fetch request in shape of 
 */
const formatResponse = (json, page) => {
  const firstTen = json.filter((result, index) => index < 10);
  const ids = firstTen.map(result => result.id);
  const open = firstTen.filter(result => result.disposition === 'open');
  const primaryColors = ['red', 'blue', 'yellow'];
  open.forEach((result) => {
    result.isPrimary = (primaryColors.indexOf(result.color) > -1);
  });

  const closedPrimaryCount = firstTen.reduce((accum, result) => {
    const toAdd = (result.disposition === 'closed'
        && primaryColors.indexOf(result.color) > -1)
      ? 1
      : 0;
    return accum + toAdd;
  }, 0);

  const previousPage = page > 1 ? page - 1 : null;
  const nextPage = json.length > 10 ? page + 1 : null;

  return { ids, open, closedPrimaryCount, previousPage, nextPage };
};

export default retrieve;
