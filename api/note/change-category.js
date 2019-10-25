/**
 * Route: POST /notes/{note_id}/change-note-cate
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const moment = require('moment');
const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    const noteId = decodeURIComponent(event.pathParameters.note_id);
    const userId = utils.getUserId(event.headers);

    const body = JSON.parse(event.body);
    if (!body.from_cate_id || !body.to_cate_id) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing attribute'
        })
      }
    }
    const fromCategoryId = body.from_cate_id;
    const toCategoryId = body.to_cate_id;
    const timestamp = moment().unix();

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

    if (fromCategoryId !== note.category_id) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Invalid source category id'
        })
      }
    }

    const toCategory = utils.getNote(dynamodb, tableName, toCategoryId);
    if (!toCategory) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Invalid destination category id'
        })
      }
    }

    // delete relationship with old category
    dynamodb.delete({
      TableName: tableName,
      Key: {
        id: fromCategoryId,
        relationship_id: noteId
      }
    }).promise();

    // create relationship with new category
    dynamodb.put({
      TableName: tableName,
      Item: {
        id: toCategoryId,
        relationship_id: noteId,
        create_timestamp: utils.NOTE_ID_PREFIX + ':' + timestamp,
        update_timestamp: utils.NOTE_ID_PREFIX + ':' + timestamp,
        user_id: userId,
        title: note.title
      }
    }).promise();

    // update note
    data = await dynamodb.update({
      TableName: tableName,
      Key: {
        id: noteId,
        relationship_id: utils.getCurrentNoteVersionPrefix()
      },
      UpdateExpression: 'set category_id = :cate_id',
      ExpressionAttributeValues: {
        ':cate_id': toCategoryId
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers: utils.getResponseHeaders(),
      body: JSON.stringify({...note, category_id: toCategoryId})
    }

  } catch (err) {
    console.log('Error', err);
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
