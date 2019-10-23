/**
 * Route: POST /tags
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const util = require('../util');
const moment = require('moment');
const uuidv4 = require('uuid/v4');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    const body = JSON.parse(event.body);

    const user_id = util.getUserId(event.headers);
    const tag_id = util.TAG_ID_PREFIX + ':' + uuidv4();
    const timestamp = util.TAG_ID_PREFIX + moment().unix();

    if (!body.name) {
      return {
        statusCode: 400,
        headers: util.getResponseHeaders(),
        body: JSON.stringify({
          error: 'ValueError',
          message: 'Missing name attribute'
        })
      }
    }
    const name = body.name;
    const newTag = {
      id: tag_id,
      relationship_id: tag_id,
      create_timestamp: timestamp,
      update_timestamp: timestamp,
      name: name,
      user_id: user_id
    }

    let data = await dynamodb.put({
      TableName: tableName,
      Item: newTag
    }).promise();

    return {
      statusCode: 200,
      headers: util.getResponseHeaders(),
      body: JSON.stringify(newTag)
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
