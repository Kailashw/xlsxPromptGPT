# Prompt GPT with xlsx

- checkout the code.
- create a `config` folder with config.js file with following values

```
export const chatGptConfig = {
  organisation: null,
  apiKey: "your_api_secret",
};

```

- run `npm i` to install dependencies
- run `npm start` start accessing api's on localhost:3000
- following are available api's

```
TYPE  |           URL                           | What it Does
GET   |   http://localhost:3000/                | to get latest
POST  |   http://localhost:3000/                | to upload file to generate prompts
GET   |   http://localhost:3000/generate        | to generate gpt responses

```

Following is the sample CURL for POST request

````
curl --location 'localhost:3000' \
--form 'promptText="For given text with in three double quoates : \"\"\"{{text}}\"\"\". Generate sentiment , calculate churn percentage in percentage with higher percentage meaning sooner churn and lower churn percentage meaning churn after some time, estimate resignation date range from now in daya/months/years and list three short actionable items to reduce churn and output strictly in json format."' \
--form 'file=@"/Users/kailaswalldoddi/Downloads/sample_export.xlsx"'```
````
