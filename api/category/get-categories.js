/**
 * Route: GET /categories/
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let user_id = util.getUserId(event.headers);

    let params = {
      TableName: tableName,
      IndexName: 'user-index',
      KeyConditionExpression: 'user_id = :uid and begins_with(relationship_id, :cat_id_prefix)',
      ExpressionAttributeValues: {
        ':uid': user_id,
        ':cat_id_prefix': util.CATEGORY_ID_PREFIX
      },
      ScanIndexForward: false
    };

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
