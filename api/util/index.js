const CATEGORY_ID_PREFIX = 'CAT';
const TAG_ID_PREFIX = 'TAG';
const NOTE_ID_PREFIX = 'NOT';

const getNoteVersionPrefix = version => {
  return 'v' + version;
}

// v0 version is always hold current information of note
const getCurrentNoteVersionPrefix = () => {
  return 'v0';
}

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
  getNoteVersionPrefix,
  getCurrentNoteVersionPrefix,
  CATEGORY_ID_PREFIX,
  TAG_ID_PREFIX,
  NOTE_ID_PREFIX,
}
