/**
 * Route: GET /
 */

exports.handler = async event => {
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Sinote! This is a Simple Note app that created by Serverless framework.'),
    };
    return response;
}
