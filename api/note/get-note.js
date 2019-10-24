/**
 * Route: GET /notes/{note_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let noteId = decodeURIComponent(event.pathParameters.note_id);

    let data = await utils.getNote(dynamodb, tableName, noteId);
    if (data) {
      return {
        statusCode: 200,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify(data)
      }
    } else {
      return {
        statusCode: 404,
        headers: utils.getResponseHeaders()
      }
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
