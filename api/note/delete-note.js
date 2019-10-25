/**
 * Route: DELETE /notes/{note_id}/change-note-cate
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    const noteId = decodeURIComponent(event.pathParameters.noteId);

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

    // delete category relationship
    await dynamodb.delete({
      TableName: tableName,
      Key : {
        id: note.category_id,
        relationship_id: noteId
      }
    }).promise();

    // delete tag relationship
    if (note.tags) {
      note.tags.forEach(async tagId => {
        await dynamodb.delete({
          TableName: tableName,
          Key: {
            id: tagId,
            relationship_id: noteId
          }
        }).promise();
      })
    }

    // delete note revision
    for (i=0; i<note.revision; i++) {
      await dynamodb.delete({
        TableName: tableName,
        Key: {
          id: noteId,
          relationship_id: utils.getNoteVersionPrefix(i)
        }
      }).promise();
    }

    return {
      statusCode: 204,
      headers: utils.getResponseHeaders()
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
