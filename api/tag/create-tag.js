/**
 * Route: POST /tags
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const utils = require('../utils');
const moment = require('moment');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    const body = JSON.parse(event.body);

    if (!body.name) {
      return {
        statusCode: 400,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing name attribute'
        })
      }
    }
    const name = body.name;

    const userId = utils.getUserId(event.headers);
    const tagId = utils.TAG_ID_PREFIX + ':' + name + userId;
    const timestamp = utils.TAG_ID_PREFIX + ':' + moment().unix();

    const newTag = {
      id: tagId,
      relationship_id: tagId,
      create_timestamp: timestamp,
      update_timestamp: timestamp,
      name: name,
      user_id: userId
    }

    let data = await dynamodb.put({
      TableName: tableName,
      Item: newTag
    }).promise();

    return {
      statusCode: 200,
      headers: utils.getResponseHeaders(),
      body: JSON.stringify(newTag)
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
