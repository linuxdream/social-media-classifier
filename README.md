# Social Media Bullying Application

## API

### Setup
Be sure you have at least node 4.0+. Ideally, 7+ would be best.

Set the following environment variable:

```bash
export nlp_app_key=ANY_RANDOM_KEY
```

You will need use the key generated here in all header requests for at least some basic security. The API expects the key to be passed as an x-key header.

To setup the serve, simply enter the api directory and type:

```bash
npm install
```

To lift the server, type:

```bash
sails lift
```

You can use [Postman](https://www.getpostman.com/apps) to make sample requests. The API has only one endpoint at the moment:

```http
PUT /nlp/assess
```

and it accepts a JSON object in the body of the request:

```json
{
	"comments": [
		"comment 1",
		"comment 2",
		"comment 3"
	]
}
```

The API uses the training classifier data to make an assessment if each comment fits into the bullying category. The response from the API will be:

```json
{
  "total": 3,
  "totalBullying": 2
}
```

The API consumer can them make the determination of how to present that to the user.

```http
PUT /nlp/classify
```

body

```json
{
  "comment": "comment1",
  "isBully": true
}
```

This API could be used to add more document for classification.
