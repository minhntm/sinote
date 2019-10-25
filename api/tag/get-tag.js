/**
 * Route: GET /tags/{tag_id}
 */

const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-northeast-1' });

const _ = require('underscore');
const utils = require('../utils');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.NOTES_TABLE;

exports.handler = async event => {
  try {
    let tagId = decodeURIComponent(event.pathParameters.tagId);

    let tag = await utils.getTag(dynamodb, tableName, tagId);
    if (tag) {
      return {
        statusCode: 200,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify(tag)
      }
    } else {
      return {
        statusCode: 404,
        headers: utils.getResponseHeaders(),
        body: JSON.stringify({
          error: 'Not found',
          message: 'Tag not found'
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
