/**
 * Route: GET /tags/{tag_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const _ = require('underscore');
const util = require('../util');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let tag_id = decodeURIComponent(event.pathParameters.tag_id);

    let params = {
      TableName: tableName,
      KeyConditionExpression: 'id = :tag_id and relationship_id = :tag_id',
      ExpressionAttributeValues: {
        ':tag_id': tag_id,
      },
      Limit: 1
    };

    let data = await dynamodb.query(params).promise();
    if (!_.isEmpty(data.Items)) {
      return {
        statusCode: 200,
        headers: util.getResponseHeaders(),
        body: JSON.stringify(data.Items[0])
      }
    } else {
      return {
        statusCode: 404,
        headers: util.getResponseHeaders()
      }
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
