//Driver code
exports.handler = async event => {
  var userID = event.rawPath.replace("/", "");
  var user = await getItem(userID);
  var viewsCount = 1;

  if (user != null) {
    if (user.Item) {
      viewsCount = parseInt(user.Item.count.N);
      updateItem(userID, ++viewsCount);
    } else {
      putItem(userID);
    }
  }
  return buildResponse(viewsCount);
};

const AWS = require("aws-sdk");
const config = require("./config");

AWS.config.update(config.aws_config);

const dynamoDb = new AWS.DynamoDB();

//Return image response with count

async function putItem(userID) {
  try {
    var params = {
      TableName: "github-counter",
      Item: {
        userid: { S: userID },
        count: { N: "1" }
      }
    };

    return await dynamoDb.putItem(params).promise();
  } catch (err) {
    console.log(err);
    return null;
  }
}

//put item
async function getItem(userID) {
  try {
    var params = {
      TableName: "github-counter",
      Key: {
        userid: { S: userID }
      }
    };
    return await dynamoDb.getItem(params).promise();
  } catch (err) {
    console.log(err);
    return null;
  }
}

//update item
async function updateItem(userID, count) {
  try {
    var params = {
      ExpressionAttributeNames: {
        "#C": "count"
      },
      ExpressionAttributeValues: {
        ":c": {
          N: `${count.toString()}`
        }
      },
      Key: {
        userid: {
          S: userID
        }
      },
      ReturnValues: "ALL_NEW",
      TableName: "github-counter",
      UpdateExpression: "SET #C = :c"
    };

    return await dynamoDb.updateItem(params).promise().Item;
  } catch (err) {
    console.log(err);
  }
}

async function buildResponse(viewsCount) {
  var response = {
    statusCode: 200,
    body: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="180" height="25" role="img">
              <rect x="0" y="0" rx="0" ry="0" width="180" height="25" style="fill:Teal;stroke:black;stroke-width:2;opacity:1"/>
              <rect x="0" y="0" rx="0" ry="0" width="105" height="25" style="fill:black;stroke:black;stroke-width:0;opacity:1"/>
              <text fill="#ffffff" font-size="15" font-family="Verdana" x="3" y="17">Profile views: ${viewsCount}</text>
          </svg>`,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "max-age=0, no-cache, no-store, must-revalidate"
    }
  };
  return response;
}
