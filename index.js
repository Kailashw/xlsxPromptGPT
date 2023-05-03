import express from "express";
import pkg from "openai";
import lodashpkg from "lodash";
import { chatGptConfig } from "./config/config.js";
import cors from "cors";
import multer from "multer";
import reader from "xlsx";
import * as path from "path";
import * as fsExtra from "fs-extra";

const { chunk } = lodashpkg;
const OpenAI = pkg;
const { Configuration, OpenAIApi } = OpenAI;

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const upload = multer({ dest: "uploads/" });

const configuration = new Configuration({
  organization: chatGptConfig.organisation,
  apiKey: chatGptConfig.apiKey,
  headers: {
    "Content-Type": "application/json",
  },
});

async function getGptCompletionResponse(text) {
  // init of chatGPT api
  let openai = new OpenAIApi(configuration);
  try {
    const prompt = `${text}`;
    const axiosResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      temperature: 0.7,
      max_tokens: 600,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });

    return axiosResponse.data?.choices[0].text.replaceAll("\n", "");
  } catch (error) {
    console.log(
      `Error while fetching chatGpt complettion response ${JSON.stringify(
        error
      )}`
    );
    return null;
  }
}

app.post("/", upload.single("file"), async (req, res) => {
  const { body, file } = req;
  const { promptText } = body;
  if (!file || !promptText) {
    res.send("please mention prompt and file");
    return;
  }

  const fileData = await reader.readFile(`${file.path}`);
  let data = [];
  // read excel sheets from file.
  const sheets = fileData.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    // list of sheets
    const temp = reader.utils.sheet_to_json(
      fileData.Sheets[fileData.SheetNames[i]]
    );
    // for each sheet pick rows
    temp.forEach(async (element) => {
      element.prompt = promptText.replace("{{text}}", element.text);
      data.push(element);
    });
  }

  // create to a new excel file
  const ws = reader.utils.json_to_sheet(data);
  const wb = reader.utils.book_new();
  reader.utils.book_append_sheet(wb, ws, "Responses");
  reader.writeFile(wb, "sampleData-export.xlsx");
  res.send("Constructing and Loading file for modification of prompts.");
  return;
});

// get prompt results one by one
app.get("/generate", async (req, res) => {
  const fileData = await reader.readFile(`./sampleData-export.xlsx`);
  let sortedData = [];
  // read excel sheets from file.
  const sheets = fileData.SheetNames;
  for (let i = 0; i < sheets.length; i++) {
    const temp = reader.utils.sheet_to_json(
      fileData.Sheets[fileData.SheetNames[i]]
    );
    temp.forEach(async (element) => {
      sortedData.push(element);
    });
  }
  const SLICE = req?.query?.limit
    ? parseInt(req.query.limit)
    : sortedData.length;
  console.log(`Limit is set to ${SLICE}`);
  for (let index = 0; index < SLICE; index++) {
    const element = sortedData[index];
    console.log(`Generating for ${element.userId}`);
    const genData = await getGptCompletionResponse(element.prompt);
    try {
      element.genData = JSON.parse(genData);
    } catch (error) {
      element.genData = genData;
    }
    sortedData.push(element);
  }

  // create to a new excel file
  const ws = reader.utils.json_to_sheet(sortedData);
  const wb = reader.utils.book_new();
  reader.utils.book_append_sheet(wb, ws, "Responses");
  reader.writeFile(wb, "sampleData-export.xlsx");
  res.send(sortedData);
  return;
});

app.get("/", upload.single("file"), async (req, res) => {
  const dirName = path.resolve(path.dirname(""));
  const fileDownload = `${dirName}/sampleData-export.xlsx`;
  res.download(fileDownload);
  fsExtra.emptyDirSync("./uploads");
  return;
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
