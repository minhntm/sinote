/**
 * Route: POST /categories
 * required body key: title, content, category_id
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const util = require('../util');
const _ = require('underscore');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  // TODO: category is optinal
  // if missing this value, set it to default category
  try {
    const body = JSON.parse(event.body);

    const userId = util.getUserId(event.headers);
    const noteId = util.NOTE_ID_PREFIX + ':' + uuidv4();
    const timestamp = moment().unix();

    if (!body.title || !body.content || !body.category_id) {
      return {
        statusCode: 400,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing attribute'
        })
      }
    }
    const title = body.title;
    const content = body.content;
    const categoryId = body.category_id;

    const isCateExist = await isCategoryExist(tableName, categoryId);
    if (!isCateExist) {
      return {
        statusCode: 400,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Invalid category'
        })
      }
    }

    const newNote = {
      id: noteId,
      relationship_id: util.getCurrentNoteVersionPrefix(),
      create_timestamp: util.getCurrentNoteVersionPrefix() + ':' + timestamp,
      update_timestamp: util.getCurrentNoteVersionPrefix() + ':' + timestamp,
      title: title,
      content: content,
      category_id: categoryId,
      user_id: userId,
      revision: 1
    }

    let data = await dynamodb.put({ TableName: tableName, Item: newNote }).promise();

    const cateNoteRela = {
      id: categoryId,
      relationship_id: noteId,
      create_timestamp: util.NOTE_ID_PREFIX + ':' + timestamp,
      update_timestamp: util.NOTE_ID_PREFIX + ':' + timestamp,
      userId: userId,
      title: title
    }

    data = await dynamodb.put({ TableName: tableName, Item: cateNoteRela }).promise();

    return {
      statusCode: 200,
      headers: util.getResponseHeaders(),
      body: JSON.stringify(newNote)
    }
  } catch (err) {
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      headers: util.getResponseHeaders(),
      body: JSON.stringify({
        error: err.name ? err.name : 'Exception',
        message: err.message ? err.message : 'Unknown error'
      })
    }
  }
}

const isCategoryExist = async (tableName, categoryId) => {
  let params = {
    TableName: tableName,
    KeyConditionExpression: 'id = :cate_id and relationship_id = :cate_id',
    ExpressionAttributeValues: {
      ':cate_id': categoryId,
    },
    Limit: 1
  };

  let data = await dynamodb.query(params).promise();
  return _.isEmpty(data.Items) ? false : true;
}
