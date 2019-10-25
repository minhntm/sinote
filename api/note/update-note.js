/**
 * Route: PATCH /notes/{note_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');
const moment = require('moment');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let noteId = decodeURIComponent(event.pathParameters.noteId);

    const body = JSON.parse(event.body);
    if (!body.title || !body.content) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing attribute'
        })
      }
    }

    const title = body.title;
    const content = body.content;
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

    // create revision
    const newRevision = {
      id: noteId,
      relationship_id: 'v' + note.revision,
      create_timestamp: timestamp.toString(),
      update_timestamp: timestamp.toString(),
      title: note.title,
      content: note.content
    } 
    
    let data = await dynamodb.put({ TableName: tableName, Item: newRevision }).promise();

    // update title in cate - note relationship
    data = await dynamodb.update({
      TableName: tableName,
      Key: {
        id: note.category_id,
        relationship_id: noteId
      },
      UpdateExpression: 'set update_timestamp = :ts, title = :title',
      ExpressionAttributeValues: {
        ':ts': utils.NOTE_ID_PREFIX + ':' + timestamp,
        ':title': title
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    // update current version
    data = await dynamodb.update({
      TableName: tableName,
      Key: {
        id: noteId,
        relationship_id: utils.getCurrentNoteVersionPrefix()
      },
      UpdateExpression: 'set update_timestamp = :ts, title = :title, content = :content, revision = :revision',
      ExpressionAttributeValues: {
        ':ts': utils.getCurrentNoteVersionPrefix() + ':' + timestamp,
        ':title': title,
        ':content': content,
        ':revision': parseInt(note.revision) + 1
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers: utils.getResponseHeaders(),
      body: JSON.stringify(body)
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
