const _ = require('underscore');

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

const getCategory = async (dynamodb, tableName, categoryId) => {
  let params = {
    TableName: tableName,
    KeyConditionExpression: 'id = :category_id and relationship_id = :category_id',
    ExpressionAttributeValues: {
      ':category_id': categoryId,
    },
    Limit: 1
  };

  let data = await dynamodb.query(params).promise();
  return _.isEmpty(data.Items) ? null : data.Items[0];
}

const getTag = async (dynamodb, tableName, tagId) => {
  let params = {
    TableName: tableName,
    KeyConditionExpression: 'id = :tagId and relationship_id = :tagId',
    ExpressionAttributeValues: {
      ':tagId': tagId,
    },
    Limit: 1
  };

  let data = await dynamodb.query(params).promise();
  return _.isEmpty(data.Items) ? null : data.Items[0];
}

const getNote = async (dynamodb, tableName, noteId) => {
  let params = {
    TableName: tableName,
    KeyConditionExpression: 'id = :note_id and relationship_id = :version',
    ExpressionAttributeValues: {
      ':note_id': noteId,
      ':version': getCurrentNoteVersionPrefix()
    },
    Limit: 1
  };

  let data = await dynamodb.query(params).promise();
  return _.isEmpty(data.Items) ? null : data.Items[0];
}

module.exports = {
  getCategory,
  getTag,
  getNote,
  getUserId,
  getUserName,
  getResponseHeaders,
  getNoteVersionPrefix,
  getCurrentNoteVersionPrefix,
  CATEGORY_ID_PREFIX,
  TAG_ID_PREFIX,
  NOTE_ID_PREFIX,
}
