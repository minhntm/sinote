/**
 * Route: POST /notes/{note_id}/attach-tag
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');
const moment = require('moment');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  // TODO: category is optinal
  // if missing this value, set it to default category
  try {
    const noteId = decodeURIComponent(event.pathParameters.note_id);
    const body = JSON.parse(event.body);

    const timestamp = moment().unix();

    if (!body.tag_id) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing attribute'
        })
      }
    }
    const tagId = body.tag_id;
    const tag = await utils.getTag(dynamodb, tableName, tagId);
    if (!tag) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Invalid category'
        })
      }
    }

    const note = await utils.getNote(dynamodb, tableName, noteId);
    if (!note) {
      return {
        statusCode: 404,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'Not found',
          message: 'Note not found'
        })
      }
    }
    if (note.tags && note.tags.includes(tagId)) {
      return {
        statusCode: 200,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify(note)
      }
    }

    // create relationship
    await dynamodb.put({
      TableName: tableName,
      Item: {
        id: tagId,
        relationship_id: noteId,
        create_timestamp: utils.NOTE_ID_PREFIX + ':' + timestamp,
        update_timestamp: utils.NOTE_ID_PREFIX + ':' + timestamp,
        title: note.title
      }
    }).promise()

    let noteTags = []
    if (note.tags) {
      noteTags = note.tags;
      noteTags.push(tagId);
    } else {
      noteTags = [tagId];
    }
    
    await dynamodb.update({
      TableName: tableName,
      Key: {
        id: noteId,
        relationship_id: utils.getCurrentNoteVersionPrefix()
      },
      UpdateExpression: 'set tags = :tags',
      ExpressionAttributeValues: {
        ':tags': noteTags
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers: utils.getResponseHeaders(),
      body: JSON.stringify({...note, tags: noteTags})
    }
  } catch (err) {
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      headers: utils.getResponseHeaders(),
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

