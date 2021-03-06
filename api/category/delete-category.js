/**
 * Route: DELETE /categories/{category_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let categoryId = decodeURIComponent(event.pathParameters.categoryId);

    let categoryNoteRelationship = await dynamodb.query({
      TableName: tableName,
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': categoryId
      }
    }).promise();

    for (i=0; i<categoryNoteRelationship.Items.length; i++){
      let item = categoryNoteRelationship.Items[i];
      
      if (item.relationship_id.startsWith(utils.NOTE_ID_PREFIX)) {
        let note = await utils.getNote(dynamodb, tableName, item.relationship_id);
        for (let i=0; i<parseInt(note.revision); i++) {
          await dynamodb.delete({
            TableName: tableName,
            Key: {
              id: note.id,
              relationship_id: utils.getNoteVersionPrefix(i)
            }
          }).promise();
        }
        

        // delete tags
        if (note.tags) {
          for (let i=0; i<note.tags.length; i++){
            await dynamodb.delete({
              TableName: tableName,
              Key: {
                id: note.tags[i],
                relationship_id: note.id
              }
            }).promise();
          }
        }
      }

      // delete relationship
      let data = await dynamodb.delete({
        TableName: tableName,
        Key: {
          id: categoryId,
          relationship_id: item.relationship_id
        }
      }).promise();
    }

    return {
      statusCode: 204,
      headers: utils.getResponseHeaders(),
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
