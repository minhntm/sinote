/**
 * Route: GET /tags/
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let userId = utils.getUserId(event.headers);

    let params = {
      TableName: tableName,
      IndexName: 'user-index',
      KeyConditionExpression: 'user_id = :uid and begins_with(update_timestamp, :prefix_tag_id)',
      ExpressionAttributeValues: {
        ':uid': userId,
        ':prefix_tag_id': utils.TAG_ID_PREFIX
      },
      ScanIndexForward: false
    };

    let data = await dynamodb.query(params).promise();

    return {
      statusCode: 200,
      headers: utils.getResponseHeaders(),
      body: JSON.stringify(data)
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
