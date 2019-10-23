/**
 * Route: GET /notes/
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let query = event.queryStringParameters;
    let categoryId = query && query.category ? query.category : '';
    let tagId = query && query.tag ? query.tag : ''; 

    let userId = util.getUserId(event.headers);
    let params = {}

    if (categoryId) {
      params.TableName = tableName;
      params.IndexName = 'update_time-index';
      params.KeyConditionExpression = 'id = :cate_id and begins_with(update_timestamp, :note_prefix)';
      params.ExpressionAttributeValues = {
        ':cate_id': categoryId,
        ':note_prefix': util.NOTE_ID_PREFIX
      }
    } else if (tagId) {
      params.TableName = tableName;
      params.IndexName = 'update_time-index';
      params.KeyConditionExpression = 'id = :tag_id and begins_with(update_timestamp, :note_prefix)';
      params.ExpressionAttributeValues = {
        ':tag_id': tagId,
        ':note_prefix': util.NOTE_ID_PREFIX
      }
    } else {
      params.TableName = tableName;
      params.IndexName = 'user-index';
      params.KeyConditionExpression = 'user_id = :uid and begins_with(update_timestamp, :version)';
      params.ExpressionAttributeValues = {
        ':uid': userId,
        ':version': util.getCurrentNoteVersionPrefix()
      }
      params.ScanIndexForward = false
    }

    let data = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      headers: util.getResponseHeaders(),
      body: JSON.stringify(data)
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
