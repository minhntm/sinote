/**
 * Route: PATCH /notes/{note_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const util = require('../util');
const _ = require('underscore');
const moment = require('moment');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let noteId = decodeURIComponent(event.pathParameters.note_id);

    const body = JSON.parse(event.body);
    if (!body.title || !body.content) {
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
    const userId = util.getUserId(event.headers);
    const timestamp = moment().unix();

    const note = await getNote(tableName, noteId);
    if (!note) {
      return {
        statusCode: 400,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Invalid note id'
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
        ':ts': util.NOTE_ID_PREFIX + ':' + timestamp,
        ':title': title
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    // update current version
    data = await dynamodb.update({
      TableName: tableName,
      Key: {
        id: noteId,
        relationship_id: util.getCurrentNoteVersionPrefix()
      },
      UpdateExpression: 'set update_timestamp = :ts, title = :title, content = :content, revision = :revision',
      ExpressionAttributeValues: {
        ':ts': util.getCurrentNoteVersionPrefix() + ':' + timestamp,
        ':title': title,
        ':content': content,
        ':revision': parseInt(note.revision) + 1
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    return {
      statusCode: 200,
      headers: util.getResponseHeaders(),
      body: JSON.stringify(body)
    }
  } catch (err) {
    console.log('Error', err);
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

const getNote = async (tableName, noteId) => {
  let params = {
    TableName: tableName,
    KeyConditionExpression: 'id = :note_id and relationship_id = :version',
    ExpressionAttributeValues: {
      ':note_id': noteId,
      ':version': util.getCurrentNoteVersionPrefix()
    },
    Limit: 1
  };

  let data = await dynamodb.query(params).promise();
  
  return _.isEmpty(data.Items) ? null : data.Items[0];
}