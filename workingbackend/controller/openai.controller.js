
import OpenAIApi  from "openai";
import { hashGenerator } from "../utils/hashCheck.js";
import { Invoice } from "../model/invoice.modle.js";


const openAIextractMethod = async (req, res,next) => {
console.log(req.body.extractedText);
const openai = new OpenAIApi({
  apiKey: process.env.OPEN_AI_API, // Make sure to set this environment variable
});
// Function to process text with GPT-4
async function processText(prompt) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{"role": "user", "content": `${prompt}`}],
    });
    console.log(chatCompletion.choices[0].message);
    return chatCompletion.choices[0].message
  } catch (error) {
    console.error("Error processing text:", error);
    return null;
  }
}

// Example usage
const examplePrompt = `Make a json object from this extractedText. The format of the json object will be , it will contain a vehicles array 
which will contain mutiple or one according to text objects with key value pair of year, make, model, color and vin#. The json object besides vehicles will also have
dealer_name,action and date.Make sure to select right year because just before year their are seriol number like 1 , 2,3 on the img table .The vin# is the vehicle registration number as is usually conatins 8 to 15 numbers.Keep all the keys name exactly as i write, Here is the text:${req.body.extractedText}`
// const examplePrompt = "Explain the significance of the Turing test in AI.";
processText(examplePrompt).then(async(result) => {
  console.log("GPT-4 Response:", JSON.parse(result.content));
  const hash = hashGenerator(result.content)
  //now pass this hash to a function for checking if it exists in DB or not 
  //checking if the document exist in the database or not
    req.body.extractedJSON = result.content
    next()
});
};

export default openAIextractMethod;
