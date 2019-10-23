const CATEGORY_ID_PREFIX = 'CAT';
const TAG_ID_PREFIX = 'TAG';
const NOTE_ID_PREFIX = 'NOT';

const getUserId = headers => {
  return headers.app_user_id;
}

const getUserName = headers => {
  return headers.app_user_name;
}

const getResponseHeaders = () => {
  return {
    'Access-Control-Allow-Origin': '*'
  }
}

module.exports = {
  getUserId,
  getUserName,
  getResponseHeaders,
  CATEGORY_ID_PREFIX,
  TAG_ID_PREFIX,
  NOTE_ID_PREFIX,
}
