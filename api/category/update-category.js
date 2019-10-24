/**
 * Route: PATCH /categories/{category_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');
const moment = require('moment');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let categoryId = decodeURIComponent(event.pathParameters.category_id);

    const body = JSON.parse(event.body);
    if (!body.name) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing attribute'
        })
      }
    }

    const name = body.name;
    const timestamp = moment().unix();

    const category = await utils.getCategory(dynamodb, tableName, categoryId);
    if (!category) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Invalid category id'
        })
      }
    }

    // update category name
    data = await dynamodb.update({
      TableName: tableName,
      Key: {
        id: categoryId,
        relationship_id: categoryId
      },
      UpdateExpression: 'set #uts = :ts, #name = :name',
      ExpressionAttributeNames: {
        '#uts': 'update_timestamp',
        '#name': 'name'
      },
      ExpressionAttributeValues: {
        ':ts': utils.CATEGORY_ID_PREFIX + ':' + timestamp,
        ':name': name
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
