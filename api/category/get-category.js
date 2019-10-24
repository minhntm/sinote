/**
 * Route: GET /categories/{cate_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let cateId = decodeURIComponent(event.pathParameters.cate_id);

    let params = {
      TableName: tableName,
      KeyConditionExpression: 'id = :cate_id and relationship_id = :cate_id',
      ExpressionAttributeValues: {
        ':cate_id': cateId,
      },
      Limit: 1
    };

    let data = await utils.getCategory(dynamodb, tableName, cateId);
    
    if (data) {
      return {
        statusCode: 200,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify(data)
      }
    } else {
      return {
        statusCode: 404,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'Not found',
          message: 'Category not found'
        })
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
